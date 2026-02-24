import { Notifications } from "@/components/ui/notifications"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function NotificationsPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <Notifications />
    </Layout>
  )
}

