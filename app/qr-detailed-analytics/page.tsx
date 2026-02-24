import { QRDetailedAnalytics } from "@/components/Analytics/QR/QR_DetailedAnalytics"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function QRDetailedAnalyticsPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <QRDetailedAnalytics type="qr" />
    </Layout>
  )
}

