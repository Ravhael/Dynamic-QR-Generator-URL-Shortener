import { URLGenerator } from "@/components/URLs/URLGenerator"
import { Layout } from "@/components/Layout/PermissionControlledLayout"

export default function GenerateURLPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <URLGenerator />
    </Layout>
  )
}

