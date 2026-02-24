import { URLAnalytics } from "@/components/Analytics/URL/URL_Analytics"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function URLAnalyticsPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <URLAnalytics />
    </Layout>
  )
}

