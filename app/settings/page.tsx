import { Settings } from "@/components/Settings/Settings"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function SettingsPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <Settings />
    </Layout>
  )
}

