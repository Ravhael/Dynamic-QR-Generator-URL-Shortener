import { Groups } from "@/components/Users/Groups"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function GroupsPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <Groups />
    </Layout>
  )
}

