export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#0b0b10] via-[#0e0e15] to-[#0b0b10]">
      {children}
    </div>
  );
}
