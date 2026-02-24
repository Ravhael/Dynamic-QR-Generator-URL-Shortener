import { UserActivity } from "@/components/Users/UserActivity"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function UserActivityPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <UserActivity />
    </Layout>
  )
}

