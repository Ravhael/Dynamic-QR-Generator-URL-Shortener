import { Users } from "@/components/Users/Users"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function UsersPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <Users />
    </Layout>
  )
}

