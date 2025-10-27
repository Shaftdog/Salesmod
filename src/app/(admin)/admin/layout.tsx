import { AdminOnly } from '@/components/admin'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { Toaster } from '@/components/ui/toaster'

export const metadata = {
  title: 'Admin Panel | AppraiseTrack',
  description: 'Administrative dashboard for managing users, settings, and system configuration',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminOnly>
      <div className="flex min-h-screen bg-muted/40">
        <AdminSidebar />
        <div className="flex flex-1 flex-col pl-16 sm:pl-64">
          <AdminHeader />
          <main className="flex-1 p-6">
            {children}
          </main>
        </div>
        <Toaster />
      </div>
    </AdminOnly>
  )
}
