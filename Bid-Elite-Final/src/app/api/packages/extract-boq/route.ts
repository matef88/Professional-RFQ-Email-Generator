import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth/config";
import { GoogleGenerativeAI } from "@google/generative-ai";
import * as xlsx from "xlsx";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { env } = process;
    if (!env.GEMINI_API_KEY) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured on the server." },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    const mimeType = file.type;
    const fileName = file.name.toLowerCase();

    if (mimeType === "application/pdf" || fileName.endsWith(".pdf")) {
      const pdf = require("pdf-parse");
      const data = await pdf(buffer);
      extractedText = data.text;
    } else if (
      fileName.endsWith(".xlsx") ||
      fileName.endsWith(".xls") ||
      fileName.endsWith(".csv")
    ) {
      const workbook = xlsx.read(buffer, { type: "buffer" });
      const firstSheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[firstSheetName];
      extractedText = xlsx.utils.sheet_to_csv(sheet);
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF or Excel/CSV file." },
        { status: 400 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: "No readable text found in the document." },
        { status: 400 }
      );
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Truncate text if it's too long (rough approximation)
    const MAX_CHARS = 100000;
    const textToProcess = extractedText.length > MAX_CHARS ? extractedText.slice(0, MAX_CHARS) : extractedText;

    const prompt = `You are a helpful assistant specialized in construction and procurement.
Extract all Bill of Quantities (BOQ) or pricing items from the following document text and format it as a JSON array of objects.

Follow these strict rules:
1. Each object must have exactly these keys: "itemNo" (string), "description" (string), "unit" (string), "quantity" (number), and "remarks" (string).
2. If an item number doesn't exist, assign a sequential number like "1", "2", "3".
3. If unit is missing, use "pcs" or "ea" or empty string "".
4. If quantity is missing or unparseable, set it to 1.
5. If remarks are missing, use an empty string "".
6. Output ONLY a valid JSON array, without any markdown formatting (no \`\`\`json or \`\`\`). Do not add any conversational text.

Document Text:
${textToProcess}`;

    const result = await model.generateContent(prompt);
    let aiText = result.response.text().trim();

    // Remove markdown code blocks if the model still returns them
    if (aiText.startsWith("```json")) {
      aiText = aiText.substring(7);
    } else if (aiText.startsWith("```")) {
      aiText = aiText.substring(3);
    }
    if (aiText.endsWith("```")) {
      aiText = aiText.substring(0, aiText.length - 3);
    }
    aiText = aiText.trim();

    let items = [];
    try {
      items = JSON.parse(aiText);
      if (!Array.isArray(items)) {
        throw new Error("AI did not return an array");
      }
    } catch (parseError) {
      console.error("Failed to parse AI output:", aiText);
      return NextResponse.json(
        { error: "Failed to parse the extracted items from the document." },
        { status: 500 }
      );
    }

    return NextResponse.json({ items });
  } catch (error: any) {
    console.error("Error in extract-boq API:", error);
    return NextResponse.json(
        { error: error.message || "An unexpected error occurred during extraction." },
        { status: 500 }
    );
  }
}
