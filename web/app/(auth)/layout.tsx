export default async function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="container flex min-h-[85vh] items-center justify-center px-4 py-12 mx-auto">
      {children}
    </div>
  );
}
