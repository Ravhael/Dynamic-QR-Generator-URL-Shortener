import { Dashboard } from "@/components/Dashboard/Dashboard"
import { Layout } from "@/components/Layout/PermissionControlledLayout"
import { ProtectedRoute } from "@/components/Auth/ProtectedRoute"

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <Layout usePermissionAwareSidebar={true}>
        <Dashboard />
      </Layout>
    </ProtectedRoute>
  )
}
