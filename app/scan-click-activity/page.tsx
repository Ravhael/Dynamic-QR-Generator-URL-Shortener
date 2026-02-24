import { Layout } from "@/components/Layout/PermissionControlledLayout"
import ScanClickActivity from "@/components/Analytics/ScanClickActivity"

export default function ScanClickActivityPage() {
  return (
    <Layout usePermissionAwareSidebar={true}>
      <div className="p-4">
        <h1 className="text-xl font-semibold mb-4">Scan & Click Activity</h1>
        <ScanClickActivity />
      </div>
    </Layout>
  )
}
