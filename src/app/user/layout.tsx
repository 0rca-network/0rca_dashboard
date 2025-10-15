import DashboardLayout from '@/components/dashboard-layout'

export default function UserLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <DashboardLayout>{children}</DashboardLayout>
}