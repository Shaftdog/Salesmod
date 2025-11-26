'use client'

import { useEffect, useState, useCallback } from 'react'
import { useIsSuperAdmin } from '@/hooks/use-user-areas'
import { AREA_DISPLAY_NAMES, type AreaCode, type OverrideMode } from '@/lib/admin/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Shield,
  Save,
  RotateCcw,
  ChevronDown,
  ChevronRight,
  Loader2,
  Plus,
  Minus,
  RefreshCw,
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

interface UserAreasData {
  userId: string
  role: string
  overrideMode: OverrideMode | null
  effectiveAreas: Array<{ areaCode: string; areaName: string }>
  accessEntries: Array<{
    areaCode: string
    areaName: string
    accessType: 'grant' | 'revoke'
    includeAllSubmodules: boolean
  }>
}

interface UserAreaOverridesProps {
  userId: string
  userRole: string
  onUpdate?: () => void
}

export function UserAreaOverrides({ userId, userRole, onUpdate }: UserAreaOverridesProps) {
  const { isSuperAdmin, isLoading: authLoading } = useIsSuperAdmin()

  const [areas, setAreas] = useState<Area[]>([])
  const [userAreasData, setUserAreasData] = useState<UserAreasData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  // Override configuration
  const [overrideMode, setOverrideMode] = useState<OverrideMode | null>(null)
  const [grants, setGrants] = useState<Set<string>>(new Set())
  const [revokes, setRevokes] = useState<Set<string>>(new Set())
  const [customAreas, setCustomAreas] = useState<Set<string>>(new Set())

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true)

      const [areasRes, userAreasRes] = await Promise.all([
        fetch('/api/admin/areas'),
        fetch(`/api/admin/users/${userId}/areas`),
      ])

      if (!areasRes.ok || !userAreasRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const areasData = await areasRes.json()
      const userAreasDataResponse = await userAreasRes.json()

      setAreas(areasData.areas || [])
      setUserAreasData(userAreasDataResponse)

      // Initialize state from server data
      const mode = userAreasDataResponse.overrideMode as OverrideMode | null
      setOverrideMode(mode)

      if (mode === 'tweak') {
        const grantSet = new Set<string>()
        const revokeSet = new Set<string>()
        for (const entry of userAreasDataResponse.accessEntries || []) {
          if (entry.accessType === 'grant') {
            grantSet.add(entry.areaCode)
          } else if (entry.accessType === 'revoke') {
            revokeSet.add(entry.areaCode)
          }
        }
        setGrants(grantSet)
        setRevokes(revokeSet)
      } else if (mode === 'custom') {
        const customSet = new Set(
          (userAreasDataResponse.accessEntries || [])
            .filter((e: any) => e.accessType === 'grant')
            .map((e: any) => e.areaCode)
        )
        setCustomAreas(customSet)
      }
    } catch (err) {
      console.error('Error fetching user areas:', err)
      toast.error('Failed to load area access data')
    } finally {
      setIsLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (isSuperAdmin && isOpen) {
      fetchData()
    }
  }, [isSuperAdmin, isOpen, fetchData])

  const handleGrantToggle = (areaCode: string) => {
    setGrants(prev => {
      const next = new Set(prev)
      if (next.has(areaCode)) {
        next.delete(areaCode)
      } else {
        next.add(areaCode)
        // Remove from revokes if adding to grants
        setRevokes(r => {
          const newRevokes = new Set(r)
          newRevokes.delete(areaCode)
          return newRevokes
        })
      }
      return next
    })
  }

  const handleRevokeToggle = (areaCode: string) => {
    setRevokes(prev => {
      const next = new Set(prev)
      if (next.has(areaCode)) {
        next.delete(areaCode)
      } else {
        next.add(areaCode)
        // Remove from grants if adding to revokes
        setGrants(g => {
          const newGrants = new Set(g)
          newGrants.delete(areaCode)
          return newGrants
        })
      }
      return next
    })
  }

  const handleCustomToggle = (areaCode: string) => {
    setCustomAreas(prev => {
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
    if (!overrideMode) {
      toast.error('Please select an override mode')
      return
    }

    try {
      setIsSaving(true)

      let body: any = { overrideMode }

      if (overrideMode === 'tweak') {
        body.grants = Array.from(grants)
        body.revokes = Array.from(revokes)
      } else if (overrideMode === 'custom') {
        body.grants = Array.from(customAreas)
      }

      const response = await fetch(`/api/admin/users/${userId}/areas`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save changes')
      }

      toast.success('Area overrides updated successfully')
      await fetchData()
      onUpdate?.()
    } catch (err) {
      console.error('Error saving area overrides:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to save changes')
    } finally {
      setIsSaving(false)
    }
  }

  const handleRemoveOverrides = async () => {
    try {
      setIsSaving(true)

      const response = await fetch(`/api/admin/users/${userId}/areas`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to remove overrides')
      }

      toast.success('Overrides removed - user now uses role defaults')
      setOverrideMode(null)
      setGrants(new Set())
      setRevokes(new Set())
      setCustomAreas(new Set())
      await fetchData()
      onUpdate?.()
    } catch (err) {
      console.error('Error removing overrides:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to remove overrides')
    } finally {
      setIsSaving(false)
    }
  }

  // Non-super-admin can't see this section
  if (!isSuperAdmin && !authLoading) {
    return null
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                <CardTitle>Area Access Overrides</CardTitle>
              </div>
              {isOpen ? (
                <ChevronDown className="h-5 w-5" />
              ) : (
                <ChevronRight className="h-5 w-5" />
              )}
            </div>
            <CardDescription>
              Configure custom area access for this user (Super Admin only)
            </CardDescription>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="space-y-6">
            {isLoading || authLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : (
              <>
                {/* Current Effective Access */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Current Effective Access</Label>
                  <div className="flex flex-wrap gap-2">
                    {userAreasData?.effectiveAreas && userAreasData.effectiveAreas.length > 0 ? (
                      userAreasData.effectiveAreas.map((area) => (
                        <Badge key={area.areaCode} variant="secondary">
                          {area.areaName}
                        </Badge>
                      ))
                    ) : (
                      <Badge variant="destructive">No Access</Badge>
                    )}
                  </div>
                  {userAreasData?.overrideMode && (
                    <p className="text-xs text-muted-foreground">
                      Override mode: {userAreasData.overrideMode === 'tweak' ? 'Tweaked from role defaults' : 'Custom access'}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Override Mode Selection */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium">Override Mode</Label>
                  <RadioGroup
                    value={overrideMode || ''}
                    onValueChange={(value) => setOverrideMode(value as OverrideMode)}
                    className="grid gap-3"
                  >
                    <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="tweak" id="tweak" />
                      <Label htmlFor="tweak" className="flex-1 cursor-pointer">
                        <div className="font-medium">Tweak Role Defaults</div>
                        <div className="text-sm text-muted-foreground">
                          Start with role defaults, then grant or revoke specific areas
                        </div>
                      </Label>
                    </div>
                    <div className="flex items-center space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value="custom" id="custom" />
                      <Label htmlFor="custom" className="flex-1 cursor-pointer">
                        <div className="font-medium">Custom Access</div>
                        <div className="text-sm text-muted-foreground">
                          Ignore role defaults entirely, define access from scratch
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Tweak Mode Configuration */}
                {overrideMode === 'tweak' && (
                  <div className="space-y-4">
                    <Separator />
                    <div className="grid gap-4 sm:grid-cols-2">
                      {/* Grant Areas */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4 text-green-600" />
                          <Label className="text-sm font-medium">Grant Additional Access</Label>
                        </div>
                        <div className="space-y-2 rounded-lg border p-3">
                          {areas.map((area) => (
                            <div key={area.code} className="flex items-center space-x-2">
                              <Checkbox
                                id={`grant-${area.code}`}
                                checked={grants.has(area.code)}
                                onCheckedChange={() => handleGrantToggle(area.code)}
                              />
                              <label
                                htmlFor={`grant-${area.code}`}
                                className="text-sm cursor-pointer"
                              >
                                {area.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Revoke Areas */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Minus className="h-4 w-4 text-red-600" />
                          <Label className="text-sm font-medium">Revoke Access</Label>
                        </div>
                        <div className="space-y-2 rounded-lg border p-3">
                          {areas.map((area) => (
                            <div key={area.code} className="flex items-center space-x-2">
                              <Checkbox
                                id={`revoke-${area.code}`}
                                checked={revokes.has(area.code)}
                                onCheckedChange={() => handleRevokeToggle(area.code)}
                              />
                              <label
                                htmlFor={`revoke-${area.code}`}
                                className="text-sm cursor-pointer"
                              >
                                {area.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Mode Configuration */}
                {overrideMode === 'custom' && (
                  <div className="space-y-4">
                    <Separator />
                    <Label className="text-sm font-medium">Select Areas (replaces role defaults)</Label>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      {areas.map((area) => (
                        <div
                          key={area.code}
                          className="flex items-center space-x-3 rounded-lg border p-3 hover:bg-muted/50 transition-colors"
                        >
                          <Checkbox
                            id={`custom-${area.code}`}
                            checked={customAreas.has(area.code)}
                            onCheckedChange={() => handleCustomToggle(area.code)}
                          />
                          <label
                            htmlFor={`custom-${area.code}`}
                            className="text-sm font-medium cursor-pointer"
                          >
                            {area.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                {overrideMode && (
                  <>
                    <Separator />
                    <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
                      <Button
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        {isSaving ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="mr-2 h-4 w-4" />
                        )}
                        Save Overrides
                      </Button>

                      {userAreasData?.overrideMode && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" disabled={isSaving}>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Revert to Role Defaults
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Revert to Role Defaults?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will remove all custom overrides for this user. They will
                                inherit access based on their role ({userRole}) only.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={handleRemoveOverrides}>
                                Revert
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}
