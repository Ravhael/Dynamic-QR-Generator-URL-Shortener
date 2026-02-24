import { QRCodeList } from "@/components/QRCodes/QRCodeList"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function QRCodesPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <QRCodeList />
    </Layout>
  )
}

