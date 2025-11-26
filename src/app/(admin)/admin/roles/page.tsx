'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useIsSuperAdmin } from '@/hooks/use-user-areas'
import { USER_ROLES, ROLE_DISPLAY_NAMES, AREA_DISPLAY_NAMES, type UserRole, type AreaCode } from '@/lib/admin/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertCircle,
  Save,
  RotateCcw,
  Shield,
  Users,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface Area {
  id: string
  code: string
  name: string
  description?: string
  icon?: string
  displayOrder: number
}

interface RoleTemplate {
  role: UserRole
  areas: Array<{
    areaCode: string
    areaName: string
    includeAllSubmodules: boolean
  }>
}

export default function RoleTemplatesPage() {
  const router = useRouter()
  const { isSuperAdmin, isLoading: authLoading } = useIsSuperAdmin()

  const [areas, setAreas] = useState<Area[]>([])
  const [roleTemplates, setRoleTemplates] = useState<RoleTemplate[]>([])
  const [selectedRole, setSelectedRole] = useState<UserRole>('user')
  const [selectedAreas, setSelectedAreas] = useState<Set<string>>(new Set())
  const [originalAreas, setOriginalAreas] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Redirect non-super-admins
  useEffect(() => {
    if (!authLoading && !isSuperAdmin) {
      router.replace('/unauthorized')
    }
  }, [authLoading, isSuperAdmin, router])

  // Fetch areas and role templates
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const [areasRes, templatesRes] = await Promise.all([
        fetch('/api/admin/areas'),
        fetch('/api/admin/role-templates'),
      ])

      if (!areasRes.ok || !templatesRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const areasData = await areasRes.json()
      const templatesData = await templatesRes.json()

      setAreas(areasData.areas || [])
      setRoleTemplates(templatesData.roleTemplates || [])

      // Set initial selected areas for the default role
      const roleTemplate = templatesData.roleTemplates?.find(
        (t: RoleTemplate) => t.role === selectedRole
      )
      const initialAreas = new Set(
        (roleTemplate?.areas || []).map((a: { areaCode: string }) => a.areaCode)
      )
      setSelectedAreas(initialAreas)
      setOriginalAreas(new Set(initialAreas))
    } catch (err) {
      console.error('Error fetching role templates:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }, [selectedRole])

  useEffect(() => {
    if (isSuperAdmin) {
      fetchData()
    }
  }, [isSuperAdmin, fetchData])

  // Update selected areas when role changes
  useEffect(() => {
    const roleTemplate = roleTemplates.find((t) => t.role === selectedRole)
    const roleAreas = new Set(
      (roleTemplate?.areas || []).map((a) => a.areaCode)
    )
    setSelectedAreas(roleAreas)
    setOriginalAreas(new Set(roleAreas))
  }, [selectedRole, roleTemplates])

  const handleAreaToggle = (areaCode: string) => {
    setSelectedAreas((prev) => {
      const next = new Set(prev)
      if (next.has(areaCode)) {
        next.delete(areaCode)
      } else {
        next.add(areaCode)
      }
      return next
    })
  }

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await fetch('/api/admin/role-templates', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roleName: selectedRole,
          areaCodes: Array.from(selectedAreas),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save changes')
      }

      toast.success('Role template updated successfully')
      setOriginalAreas(new Set(selectedAreas))

      // Refresh data
      await fetchData()
    } catch (err) {
      console.error('Error saving role template:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleReset = () => {
    setSelectedAreas(new Set(originalAreas))
  }

  const hasChanges = () => {
    if (selectedAreas.size !== originalAreas.size) return true
    for (const area of selectedAreas) {
      if (!originalAreas.has(area)) return true
    }
    return false
  }

  // Loading state
  if (authLoading || isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Templates</h1>
          <p className="text-muted-foreground">
            Configure default area access for each role
          </p>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </div>
    )
  }

  // Auth error
  if (!isSuperAdmin) {
    return null // Redirecting
  }

  // Data error
  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Templates</h1>
          <p className="text-muted-foreground">
            Configure default area access for each role
          </p>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error}. Please try refreshing the page.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Role Templates</h1>
          <p className="text-muted-foreground">
            Configure default area access for each role. Users inherit these permissions unless overridden.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={!hasChanges() || isSaving}
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges() || isSaving}
          >
            {isSaving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {/* Role Tabs */}
      <Tabs
        value={selectedRole}
        onValueChange={(value) => setSelectedRole(value as UserRole)}
      >
        <TabsList className="grid w-full grid-cols-3 lg:grid-cols-9">
          {USER_ROLES.map((role) => (
            <TabsTrigger
              key={role}
              value={role}
              className="text-xs"
            >
              {role === 'super_admin' ? (
                <Shield className="mr-1 h-3 w-3" />
              ) : (
                <Users className="mr-1 h-3 w-3" />
              )}
              <span className="hidden sm:inline">
                {ROLE_DISPLAY_NAMES[role]}
              </span>
              <span className="sm:hidden">
                {role.split('_')[0].charAt(0).toUpperCase()}
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {USER_ROLES.map((role) => (
          <TabsContent key={role} value={role} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {role === 'super_admin' ? (
                    <Shield className="h-5 w-5 text-primary" />
                  ) : (
                    <Users className="h-5 w-5 text-primary" />
                  )}
                  {ROLE_DISPLAY_NAMES[role]} Role
                </CardTitle>
                <CardDescription>
                  {role === 'super_admin' ? (
                    'Super Admins have access to all areas by default and cannot be restricted.'
                  ) : (
                    `Select which areas users with the ${ROLE_DISPLAY_NAMES[role]} role should have access to by default.`
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {role === 'super_admin' ? (
                  <div className="flex flex-wrap gap-2">
                    {areas.map((area) => (
                      <Badge key={area.code} variant="secondary">
                        {area.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {areas.map((area) => (
                      <div
                        key={area.code}
                        className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors"
                      >
                        <Checkbox
                          id={`${role}-${area.code}`}
                          checked={selectedAreas.has(area.code)}
                          onCheckedChange={() => handleAreaToggle(area.code)}
                        />
                        <div className="space-y-1">
                          <label
                            htmlFor={`${role}-${area.code}`}
                            className="text-sm font-medium leading-none cursor-pointer"
                          >
                            {area.name}
                          </label>
                          {area.description && (
                            <p className="text-xs text-muted-foreground">
                              {area.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Summary Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Access Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {role === 'super_admin' ? (
                    <Badge variant="default">All Areas (Full Access)</Badge>
                  ) : selectedAreas.size > 0 ? (
                    Array.from(selectedAreas).map((areaCode) => {
                      const area = areas.find((a) => a.code === areaCode)
                      return (
                        <Badge key={areaCode} variant="outline">
                          {area?.name || areaCode}
                        </Badge>
                      )
                    })
                  ) : (
                    <Badge variant="destructive">No Access</Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
