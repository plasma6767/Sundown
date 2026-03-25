import { AlertBanner } from "@/components/dashboard/AlertBanner";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AlertBanner />
      {children}
    </>
  );
}
