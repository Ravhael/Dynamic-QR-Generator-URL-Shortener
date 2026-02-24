import { QRCodeGenerator } from "@/components/QRCodes/QRCodeGenerator"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function GeneratePage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <QRCodeGenerator />
    </Layout>
  )
}

