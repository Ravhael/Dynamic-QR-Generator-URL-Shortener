import { QRMigration } from "@/components/QRCodes/QRMigration"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function QRMigrationPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <QRMigration />
    </Layout>
  )
}

