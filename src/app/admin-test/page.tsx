'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAdmin } from '@/hooks/use-admin'
import { usePermission } from '@/hooks/use-permission'
import { PERMISSIONS } from '@/lib/admin/permissions'

export default function AdminTestPage() {
  const { isAdmin, role, userId, isLoading, error } = useAdmin()
  const { hasPermission: canManageUsers } = usePermission(PERMISSIONS.MANAGE_USERS)
  const { hasPermission: canViewAnalytics } = usePermission(PERMISSIONS.VIEW_ANALYTICS)
  const [permissions, setPermissions] = useState<any[]>([])
  const [loadingPerms, setLoadingPerms] = useState(false)

  useEffect(() => {
    async function loadPermissions() {
      if (!role) return

      setLoadingPerms(true)
      try {
        const supabase = createClient()
        const { data } = await supabase.rpc('get_role_permissions', { role_name: role })
        setPermissions(data || [])
      } catch (err) {
        console.error('Error loading permissions:', err)
      } finally {
        setLoadingPerms(false)
      }
    }

    loadPermissions()
  }, [role])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8 max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <h2 className="text-red-800 font-semibold">Error</h2>
          <p className="text-red-600">{error.message}</p>
        </div>
      </div>
    )
  }

  const allTestsPassed =
    !!userId &&
    !!role &&
    permissions.length > 0 &&
    (canManageUsers || canViewAnalytics)

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Admin Panel Test Page</h1>
        <p className="text-gray-600">Testing Phase 1 RBAC Implementation</p>
      </div>

      {/* Overall Status */}
      <div className={`border rounded-lg p-6 mb-6 ${allTestsPassed ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">{allTestsPassed ? '✅' : '⚠️'}</div>
          <div>
            <h2 className="text-xl font-semibold">
              {allTestsPassed ? 'All Tests Passed!' : 'Tests Running...'}
            </h2>
            <p className="text-sm text-gray-600">
              {allTestsPassed
                ? 'Phase 1 RBAC is working correctly!'
                : 'Some tests may still be loading or failed'}
            </p>
          </div>
        </div>
      </div>

      {/* User Info */}
      <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Your Account</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">User ID:</span>
            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{userId || 'Not found'}</code>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Role:</span>
            <span className={`px-3 py-1 rounded font-medium ${
              role === 'admin' ? 'bg-purple-100 text-purple-800' :
              role === 'manager' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {role || 'user'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Is Admin:</span>
            <span className="font-medium">
              {isAdmin ? '✅ Yes' : '❌ No'}
            </span>
          </div>
        </div>
      </div>

      {/* Permission Checks */}
      <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Permission Tests</h2>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Can Manage Users:</span>
            <span className="font-medium">
              {canManageUsers ? '✅ Yes' : '❌ No'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-600">Can View Analytics:</span>
            <span className="font-medium">
              {canViewAnalytics ? '✅ Yes' : '❌ No'}
            </span>
          </div>
        </div>
      </div>

      {/* All Permissions */}
      <div className="bg-white border rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-xl font-semibold mb-4">
          Your Permissions ({permissions.length})
        </h2>
        {loadingPerms ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : permissions.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {permissions.map((perm, index) => (
              <div key={index} className="flex items-center gap-2 text-sm p-2 bg-gray-50 rounded">
                <span className="text-green-600">✓</span>
                <div>
                  <div className="font-mono text-xs">{perm.permission_name}</div>
                  <div className="text-xs text-gray-500">{perm.resource} / {perm.action}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No permissions loaded</p>
            <p className="text-sm mt-2">This might indicate the seed migration didn't run</p>
          </div>
        )}
      </div>

      {/* Test Results Summary */}
      <div className="bg-gray-900 text-white rounded-lg p-6">
        <h3 className="font-semibold mb-4 text-lg">Test Results Summary:</h3>
        <div className="space-y-2 font-mono text-sm">
          <div className="flex items-center gap-2">
            <span>{userId ? '✅' : '❌'}</span>
            <span>User authentication</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{role ? '✅' : '❌'}</span>
            <span>Role detection ({role || 'none'})</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{isAdmin ? '✅' : '❌'}</span>
            <span>Admin status</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{permissions.length > 0 ? '✅' : '❌'}</span>
            <span>Permission loading ({permissions.length} permissions)</span>
          </div>
          <div className="flex items-center gap-2">
            <span>{canManageUsers || canViewAnalytics ? '✅' : '❌'}</span>
            <span>Permission checks working</span>
          </div>
        </div>

        {allTestsPassed && (
          <div className="mt-6 p-4 bg-green-900/50 rounded border border-green-700">
            <p className="font-semibold text-green-200">🎉 All tests passed!</p>
            <p className="text-sm text-green-300 mt-1">
              Phase 1 RBAC is fully functional. You're ready for Phase 2!
            </p>
          </div>
        )}
      </div>

      {/* Next Steps */}
      {allTestsPassed && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-2">Next Steps:</h3>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>Create admin dashboard UI (Phase 2)</li>
            <li>Build user management interface</li>
            <li>Add admin navigation layout</li>
          </ul>
          <p className="text-sm text-blue-700 mt-3">
            See <code className="bg-blue-100 px-1 rounded">ADMIN_PANEL_PLAN.md</code> for the full roadmap.
          </p>
        </div>
      )}
    </div>
  )
}
