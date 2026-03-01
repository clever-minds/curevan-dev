
import DashboardLayout from "../dashboard/layout";

export default function PcrLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardLayout>{children}</DashboardLayout>;
}
