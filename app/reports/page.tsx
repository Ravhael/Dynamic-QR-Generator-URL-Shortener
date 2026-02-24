import { Reports } from "@/components/Reports/Reports"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function ReportsPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <Reports />
    </Layout>
  )
}

