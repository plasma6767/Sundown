export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b px-6 py-4">
        <p className="text-sm font-semibold text-foreground">Sundown</p>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}
