'use client'

import { useEffect, useState } from 'react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { AlertCircle, CheckCircle, Save, Settings as SettingsIcon } from 'lucide-react'

interface Setting {
  id: string
  key: string
  value: any
  category: string
  description: string | null
  is_public: boolean
  created_at: string
  updated_at: string
}

interface GroupedSettings {
  [category: string]: Setting[]
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [grouped, setGrouped] = useState<GroupedSettings>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Track changes
  const [changes, setChanges] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    fetchSettings()
  }, [])

  async function fetchSettings() {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/admin/settings')

      if (!response.ok) {
        throw new Error('Failed to fetch settings')
      }

      const data = await response.json()
      setSettings(data.settings)
      setGrouped(data.grouped)
    } catch (err) {
      console.error('Error fetching settings:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSettingChange = (key: string, value: any) => {
    setChanges(new Map(changes.set(key, value)))
  }

  const handleSave = async () => {
    if (changes.size === 0) {
      return
    }

    try {
      setIsSaving(true)
      setError(null)
      setSuccessMessage(null)

      const updates = Array.from(changes.entries()).map(([key, value]) => ({
        key,
        value,
      }))

      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ updates }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update settings')
      }

      setChanges(new Map())
      setSuccessMessage(`Successfully updated ${updates.length} setting(s)`)

      // Refresh settings
      await fetchSettings()

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (err) {
      console.error('Error saving settings:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setIsSaving(false)
    }
  }

  const renderSettingInput = (setting: Setting) => {
    const currentValue = changes.has(setting.key)
      ? changes.get(setting.key)
      : setting.value

    // Parse JSON value if it's a string
    let parsedValue = currentValue
    if (typeof currentValue === 'string') {
      try {
        parsedValue = JSON.parse(currentValue)
      } catch {
        parsedValue = currentValue
      }
    }

    // Boolean settings
    if (typeof parsedValue === 'boolean') {
      return (
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <Label htmlFor={setting.key}>{formatKey(setting.key)}</Label>
            {setting.description && (
              <p className="text-xs text-muted-foreground mt-1">
                {setting.description}
              </p>
            )}
          </div>
          <Switch
            id={setting.key}
            checked={parsedValue}
            onCheckedChange={(checked) =>
              handleSettingChange(setting.key, checked)
            }
          />
        </div>
      )
    }

    // Number settings
    if (typeof parsedValue === 'number') {
      return (
        <div className="space-y-2">
          <Label htmlFor={setting.key}>{formatKey(setting.key)}</Label>
          {setting.description && (
            <p className="text-xs text-muted-foreground">{setting.description}</p>
          )}
          <Input
            id={setting.key}
            type="number"
            value={parsedValue}
            onChange={(e) =>
              handleSettingChange(setting.key, parseFloat(e.target.value))
            }
            step="0.1"
          />
        </div>
      )
    }

    // String settings
    return (
      <div className="space-y-2">
        <Label htmlFor={setting.key}>{formatKey(setting.key)}</Label>
        {setting.description && (
          <p className="text-xs text-muted-foreground">{setting.description}</p>
        )}
        <Input
          id={setting.key}
          type="text"
          value={parsedValue}
          onChange={(e) => handleSettingChange(setting.key, e.target.value)}
        />
      </div>
    )
  }

  const formatKey = (key: string) => {
    return key
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ')
  }

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage system configuration</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="h-96 rounded-lg bg-muted animate-pulse" />
          <div className="h-96 rounded-lg bg-muted animate-pulse" />
        </div>
      </div>
    )
  }

  if (error && settings.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage system configuration</p>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">Manage system configuration</p>
        </div>
        <Button
          onClick={handleSave}
          disabled={isSaving || changes.size === 0}
        >
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : `Save Changes${changes.size > 0 ? ` (${changes.size})` : ''}`}
        </Button>
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

      {/* Settings Tabs */}
      <Tabs defaultValue={Object.keys(grouped)[0]} className="space-y-6">
        <TabsList>
          {Object.keys(grouped).map((category) => (
            <TabsTrigger key={category} value={category}>
              {formatCategory(category)}
            </TabsTrigger>
          ))}
        </TabsList>

        {Object.entries(grouped).map(([category, categorySettings]) => (
          <TabsContent key={category} value={category}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  {formatCategory(category)} Settings
                </CardTitle>
                <CardDescription>
                  Configure {category} settings for the application
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {categorySettings.map((setting, index) => (
                  <div key={setting.id}>
                    {renderSettingInput(setting)}
                    {index < categorySettings.length - 1 && <Separator className="mt-6" />}
                  </div>
                ))}

                {categorySettings.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No settings found in this category
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      {/* Information Card */}
      <Card>
        <CardHeader>
          <CardTitle>About Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>
            • Settings are stored in the database and persist across deployments
          </p>
          <p>
            • Changes take effect immediately after saving
          </p>
          <p>
            • Some settings may require application restart to fully apply
          </p>
          <p>
            • All setting changes are logged in the audit trail
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
