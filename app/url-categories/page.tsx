import { URLCategories } from "@/components/Categories/URLCategories"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function URLCategoriesPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <URLCategories />
    </Layout>
  )
}

