import { URLList } from "@/components/URLs/URLList"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function URLListPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <URLList />
    </Layout>
  )
}

