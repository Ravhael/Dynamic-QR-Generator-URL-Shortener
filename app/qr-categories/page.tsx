import { QRCategories } from "@/components/Categories/QRCategories"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function QRCategoriesPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <QRCategories />
    </Layout>
  )
}

