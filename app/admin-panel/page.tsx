import AdminPanel from "@/components/Admin/AdminPanel"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function AdminPanelPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <AdminPanel />
    </Layout>
  )
}

