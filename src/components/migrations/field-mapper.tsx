"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowRight, AlertCircle } from "lucide-react";
import { WizardState } from "./migration-wizard";
import { DatabaseField, FieldMapping, TransformFunction } from "@/lib/migrations/types";
import { getPresetById } from "@/lib/migrations/presets";
import { useToast } from "@/hooks/use-toast";

interface FieldMapperProps {
  state: WizardState;
  setState: React.Dispatch<React.SetStateAction<WizardState>>;
  onNext: () => void;
  onPrev: () => void;
}

const TRANSFORM_OPTIONS: { value: TransformFunction; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'toNumber', label: 'To Number' },
  { value: 'toDate', label: 'To Date' },
  { value: 'extract_domain', label: 'Extract Domain' },
];

export function FieldMapper({ state, setState, onNext, onPrev }: FieldMapperProps) {
  const [databaseFields, setDatabaseFields] = useState<DatabaseField[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDatabaseFields();
  }, [state.entity]);

  useEffect(() => {
    // Auto-apply preset if detected
    if (state.previewData?.suggestedPreset && state.mappings.length === 0) {
      applyPreset(state.previewData.suggestedPreset);
    }
  }, [state.previewData?.suggestedPreset]);

  const fetchDatabaseFields = async () => {
    try {
      const response = await fetch(`/api/migrations/targets?entity=${state.entity}`);
      const data = await response.json();
      setDatabaseFields(data.fields || []);
    } catch (error) {
      console.error('Error fetching database fields:', error);
      toast({
        title: "Error",
        description: "Failed to load database fields",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = getPresetById(presetId);
    if (!preset) return;

    const newMappings: FieldMapping[] = preset.mappings.map((m) => ({
      ...m,
      required: databaseFields.find((f) => f.name === m.targetField)?.required || false,
    }));

    setState((prev) => ({ ...prev, mappings: newMappings }));

    toast({
      title: "Preset Applied",
      description: `Loaded ${preset.name} field mappings`,
    });
  };

  const handleMappingChange = (sourceColumn: string, targetField: string) => {
    setState((prev) => {
      const existingIndex = prev.mappings.findIndex((m) => m.sourceColumn === sourceColumn);
      const required = databaseFields.find((f) => f.name === targetField)?.required || false;

      if (existingIndex >= 0) {
        // Update existing mapping
        const updated = [...prev.mappings];
        updated[existingIndex] = {
          ...updated[existingIndex],
          targetField,
          required,
        };
        return { ...prev, mappings: updated };
      } else {
        // Add new mapping
        return {
          ...prev,
          mappings: [
            ...prev.mappings,
            {
              sourceColumn,
              targetField,
              transform: 'none',
              required,
            },
          ],
        };
      }
    });
  };

  const handleTransformChange = (sourceColumn: string, transform: TransformFunction) => {
    setState((prev) => ({
      ...prev,
      mappings: prev.mappings.map((m) =>
        m.sourceColumn === sourceColumn ? { ...m, transform } : m
      ),
    }));
  };

  const getMapping = (sourceColumn: string): FieldMapping | undefined => {
    return state.mappings.find((m) => m.sourceColumn === sourceColumn);
  };

  const requiredFields = databaseFields.filter((f) => f.required);
  const mappedRequiredFields = requiredFields.filter((f) =>
    state.mappings.some((m) => m.targetField === f.name)
  );
  const missingRequiredFields = requiredFields.filter(
    (f) => !state.mappings.some((m) => m.targetField === f.name)
  );

  const canProceed = missingRequiredFields.length === 0 && state.mappings.length > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Map Fields</CardTitle>
              <CardDescription>
                Map your CSV columns to database fields
              </CardDescription>
            </div>
            {state.previewData?.suggestedPreset && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => applyPreset(state.previewData!.suggestedPreset!)}
              >
                Re-apply Preset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Required Fields Status */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            <div className="flex-1">
              <p className="text-sm font-semibold">Required Fields</p>
              <p className="text-xs text-muted-foreground">
                {mappedRequiredFields.length} of {requiredFields.length} mapped
              </p>
            </div>
            {missingRequiredFields.length > 0 && (
              <Badge variant="destructive">{missingRequiredFields.length} missing</Badge>
            )}
            {missingRequiredFields.length === 0 && requiredFields.length > 0 && (
              <Badge variant="default">All mapped</Badge>
            )}
          </div>

          {/* Missing Required Fields Alert */}
          {missingRequiredFields.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please map the following required fields: {missingRequiredFields.map((f) => f.name).join(', ')}
              </AlertDescription>
            </Alert>
          )}

          {/* Mapping Table */}
          <div className="border rounded-lg overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>CSV Column</TableHead>
                  <TableHead className="w-32">Transform</TableHead>
                  <TableHead className="w-12"></TableHead>
                  <TableHead>Database Field</TableHead>
                  <TableHead className="w-20">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {state.previewData?.headers.map((header) => {
                  const mapping = getMapping(header);
                  const isRequired = mapping?.required;

                  return (
                    <TableRow key={header}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {header}
                          {isRequired && <Badge variant="destructive" className="text-xs">Required</Badge>}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Sample: {state.previewData?.sampleRows[0]?.[header] || '-'}
                        </div>
                      </TableCell>

                      <TableCell>
                        <Select
                          value={mapping?.transform || 'none'}
                          onValueChange={(value) => handleTransformChange(header, value as TransformFunction)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TRANSFORM_OPTIONS.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      </TableCell>

                      <TableCell>
                        <Select
                          value={mapping?.targetField || ''}
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Don't import" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Don't import</SelectItem>
                            {databaseFields.map((field) => (
                              <SelectItem key={field.name} value={field.name}>
                                {field.name} {field.required && '*'}
                              </SelectItem>
                            ))}
                            <SelectItem value={`props.${header.toLowerCase().replace(/\s+/g, '_')}`}>
                              Custom field (props.{header.toLowerCase().replace(/\s+/g, '_')})
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      <TableCell>
                        {mapping?.targetField ? (
                          <Badge variant="secondary" className="text-xs">Mapped</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs">Skipped</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{state.mappings.filter((m) => m.targetField && !m.targetField.startsWith('props.')).length} → Database columns</span>
            <span>{state.mappings.filter((m) => m.targetField?.startsWith('props.')).length} → Custom fields</span>
            <span>{(state.previewData?.headers.length || 0) - state.mappings.filter((m) => m.targetField).length} Skipped</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onPrev}>
          Previous
        </Button>
        <Button onClick={onNext} disabled={!canProceed}>
          {canProceed ? 'Next: Validate' : 'Map Required Fields First'}
        </Button>
      </div>
    </div>
  );
}


