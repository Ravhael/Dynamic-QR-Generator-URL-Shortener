import { URLDetailedAnalytics } from "@/components/Analytics/URL/URL_DetailedAnalytics"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function URLDetailedAnalyticsPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <URLDetailedAnalytics type="url" />
    </Layout>
  )
}

