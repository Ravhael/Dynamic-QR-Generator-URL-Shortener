import { ProfileModern } from "@/components/Users/ProfileModern"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function ProfilePage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <ProfileModern />
    </Layout>
  )
}

