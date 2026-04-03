import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const PORTAL_COOKIE_NAME = "portal_session";
const PORTAL_TOKEN_EXPIRY = "7d";

function getSecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return new TextEncoder().encode(secret);
}

export interface PortalTokenPayload {
  supplierId: string;
  email: string;
  name: string;
}

export async function signPortalToken(
  supplierId: string,
  email: string,
  name: string,
): Promise<string> {
  return new SignJWT({ supplierId, email, name })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(PORTAL_TOKEN_EXPIRY)
    .sign(getSecret());
}

export async function verifyPortalToken(
  token: string,
): Promise<PortalTokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      supplierId: payload.supplierId as string,
      email: payload.email as string,
      name: payload.name as string,
    };
  } catch {
    return null;
  }
}

export async function getPortalSession(): Promise<PortalTokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(PORTAL_COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyPortalToken(token);
}

export async function setPortalCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(PORTAL_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/portal",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearPortalCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(PORTAL_COOKIE_NAME);
}

export { PORTAL_COOKIE_NAME };
