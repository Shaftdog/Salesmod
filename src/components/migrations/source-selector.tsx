"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download } from "lucide-react";
import { MigrationSource, MigrationEntity } from "@/lib/migrations/types";
import { WizardState } from "./migration-wizard";

interface SourceSelectorProps {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  onNext: () => void;
}

export function SourceSelector({ state, setState, onNext }: SourceSelectorProps) {
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch(`/api/migrations/templates?entity=${state.entity}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${state.entity}_template.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading template:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Select Data Source</CardTitle>
          <CardDescription>
            Choose where your data is coming from and what type of records you want to import.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Source Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Source System</Label>
            <RadioGroup
              value={state.source}
              onValueChange={(value) => {
                setState((prev) => ({
                  ...prev,
                  source: value as MigrationSource,
                  entity: value === 'asana' ? 'orders' : value === 'hubspot' ? 'contacts' : prev.entity,
                }));
              }}
            >
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="asana" id="asana" />
                <Label htmlFor="asana" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Asana</div>
                      <div className="text-sm text-muted-foreground">Import tasks and projects as orders</div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="hubspot" id="hubspot" />
                <Label htmlFor="hubspot" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">HubSpot</div>
                      <div className="text-sm text-muted-foreground">Import contacts and companies</div>
                    </div>
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="csv" id="csv" />
                <Label htmlFor="csv" className="flex-1 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold">Generic CSV</div>
                      <div className="text-sm text-muted-foreground">Import from any CSV file</div>
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Entity Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Entity Type</Label>
            <RadioGroup
              value={state.entity}
              onValueChange={(value) => setState((prev) => ({ ...prev, entity: value as MigrationEntity }))}
            >
              {state.source === 'asana' && (
                <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="orders" id="orders" />
                  <Label htmlFor="orders" className="flex-1 cursor-pointer">
                    <div className="font-semibold">Orders</div>
                    <div className="text-sm text-muted-foreground">Appraisal orders and work requests</div>
                  </Label>
                </div>
              )}

              {state.source === 'hubspot' && (
                <>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="contacts" id="contacts" />
                    <Label htmlFor="contacts" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Contacts</div>
                      <div className="text-sm text-muted-foreground">Individual contacts (linked to companies)</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="clients" id="clients" />
                    <Label htmlFor="clients" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Companies (Clients)</div>
                      <div className="text-sm text-muted-foreground">Company/organization records</div>
                    </Label>
                  </div>
                </>
              )}

              {state.source === 'csv' && (
                <>
                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="contacts" id="contacts" />
                    <Label htmlFor="contacts" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Contacts</div>
                      <div className="text-sm text-muted-foreground">Individual contacts</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="clients" id="clients" />
                    <Label htmlFor="clients" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Companies (Clients)</div>
                      <div className="text-sm text-muted-foreground">Company records</div>
                    </Label>
                  </div>

                  <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                    <RadioGroupItem value="orders" id="orders" />
                    <Label htmlFor="orders" className="flex-1 cursor-pointer">
                      <div className="font-semibold">Orders</div>
                      <div className="text-sm text-muted-foreground">Order records</div>
                    </Label>
                  </div>
                </>
              )}
            </RadioGroup>
          </div>

          {/* Import Mode */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Import Method</Label>
            <RadioGroup
              value={state.mode}
              onValueChange={(value) => setState((prev) => ({ ...prev, mode: value as 'csv' | 'api' }))}
            >
              <div className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                <RadioGroupItem value="csv" id="csv-mode" />
                <Label htmlFor="csv-mode" className="flex-1 cursor-pointer">
                  <div className="font-semibold">CSV Upload</div>
                  <div className="text-sm text-muted-foreground">Upload a CSV file from your computer</div>
                </Label>
              </div>

              <div className="flex items-center space-x-2 p-4 border rounded-lg opacity-60 cursor-not-allowed">
                <RadioGroupItem value="api" id="api-mode" disabled />
                <Label htmlFor="api-mode" className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">API Integration</span>
                    <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">Connect directly via API (future feature)</div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Download Template */}
          <div className="pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleDownloadTemplate}
              className="w-full"
            >
              <Download className="mr-2 h-4 w-4" />
              Download CSV Template for {state.entity}
            </Button>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Use this template to format your data correctly before importing
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={onNext}>
          Next: Upload File
        </Button>
      </div>
    </div>
  );
}


