import { QRAnalytics } from "@/components/Analytics/QR/QR_Analytics"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function QRAnalyticsPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <QRAnalytics />
    </Layout>
  )
}

