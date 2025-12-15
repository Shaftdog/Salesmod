import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import { Toaster } from '@/components/ui/toaster'

export const metadata = {
  title: 'Admin Panel | AppraiseTrack',
  description: 'Administrative dashboard for managing users, settings, and system configuration',
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Server-side auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check if user has admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || (profile.role !== 'admin' && profile.role !== 'super_admin')) {
    redirect('/unauthorized')
  }

  return (
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
  )
}
