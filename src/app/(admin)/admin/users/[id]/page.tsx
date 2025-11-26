'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Save, Trash2, AlertCircle, CheckCircle, Activity } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { Badge } from '@/components/ui/badge'
import { UserAreaOverrides } from '@/components/admin/user-area-overrides'
import { USER_ROLES, ROLE_DISPLAY_NAMES, type UserRole } from '@/lib/admin/types'

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  created_at: string
  updated_at?: string
}

interface ActivityLog {
  id: string
  action: string
  resource_type?: string
  created_at: string
  status: string
}

export default function UserDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string

  const [user, setUser] = useState<User | null>(null)
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('user')

  // Fetch user data
  useEffect(() => {
    async function fetchUser() {
      try {
        setIsLoading(true)
        setError(null)

        const response = await fetch(`/api/admin/users/${userId}`)

        if (!response.ok) {
          throw new Error('Failed to fetch user')
        }

        const data = await response.json()
        setUser(data.user)
        setRecentActivity(data.recentActivity || [])

        // Initialize form
        setName(data.user.name)
        setEmail(data.user.email)
        setRole(data.user.role)
      } catch (err) {
        console.error('Error fetching user:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) {
      fetchUser()
    }
  }, [userId])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, role }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update user')
      }

      const data = await response.json()
      setUser(data.user)
      setSuccessMessage('User updated successfully')

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error updating user:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsDeleting(true)
      setError(null)

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to delete user')
      }

      // Redirect to users list
      router.push('/admin/users')
    } catch (err) {
      console.error('Error deleting user:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-96 rounded-lg bg-muted animate-pulse" />
          <div className="h-96 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  if (error && !user) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/users">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{user.name}</h1>
            <p className="text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-800">Success</AlertTitle>
          <AlertDescription className="text-green-700">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Area Access Overrides (Super Admin only) */}
      <UserAreaOverrides userId={userId} userRole={role} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* User Details Form */}
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>
              Update user information and role
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter user name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter user email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select value={role} onValueChange={(value: UserRole) => setRole(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {USER_ROLES.map((roleOption) => (
                    <SelectItem key={roleOption} value={roleOption}>
                      {ROLE_DISPLAY_NAMES[roleOption]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Each role has different default area access. Super Admins have full system access.
              </p>
            </div>

            <Separator />

            <div className="flex justify-between">
              <Button
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" disabled={isDeleting}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete User
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This action cannot be undone. This will permanently delete the user
                      account for <strong>{user.name}</strong>.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </CardContent>
        </Card>

        {/* User Info & Activity */}
        <div className="space-y-6">
          {/* User Info */}
          <Card>
            <CardHeader>
              <CardTitle>Account Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">User ID</span>
                <span className="text-sm font-mono">{user.id.substring(0, 8)}...</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Created</span>
                <span className="text-sm">
                  {formatDistanceToNow(new Date(user.created_at), { addSuffix: true })}
                </span>
              </div>
              {user.updated_at && (
                <>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Last Updated</span>
                    <span className="text-sm">
                      {formatDistanceToNow(new Date(user.updated_at), { addSuffix: true })}
                    </span>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>Latest actions by this user</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium">
                          {activity.action.replace(/_/g, ' ').replace('.', ': ')}
                        </p>
                        {activity.resource_type && (
                          <p className="text-xs text-muted-foreground">
                            {activity.resource_type}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(activity.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        <Badge
                          variant={activity.status === 'success' ? 'default' : 'destructive'}
                          className="text-xs"
                        >
                          {activity.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
