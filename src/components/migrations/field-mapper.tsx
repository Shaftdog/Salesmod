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

    // Only include mappings where the source column exists in the CSV headers
    const csvHeaders = state.previewData?.headers || [];
    const newMappings: FieldMapping[] = preset.mappings
      .filter((m) => csvHeaders.includes(m.sourceColumn))
      .map((m) => ({
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
      
      // If user selected "Don't import", remove the mapping
      if (targetField === '__skip__') {
        if (existingIndex >= 0) {
          const updated = [...prev.mappings];
          updated.splice(existingIndex, 1);
          // Check if we need to remove composite mapping
          return updateCompositeAddressMappings({ ...prev, mappings: updated });
        }
        return prev;
      }

      const targetFieldDef = databaseFields.find((f) => f.name === targetField);
      const required = targetFieldDef?.required || false;
      const isComposite = targetFieldDef?.type === 'composite';

      if (existingIndex >= 0) {
        // Update existing mapping
        const updated = [...prev.mappings];
        updated[existingIndex] = {
          ...updated[existingIndex],
          targetField,
          required,
        };
        return isComposite ? updateCompositeAddressMappings({ ...prev, mappings: updated }) : { ...prev, mappings: updated };
      } else {
        // Add new mapping
        const newMapping = {
          sourceColumn,
          targetField,
          transform: 'none' as const,
          required,
        };
        const updatedMappings = [...prev.mappings, newMapping];
        return isComposite ? updateCompositeAddressMappings({ ...prev, mappings: updatedMappings }) : { ...prev, mappings: updatedMappings };
      }
    });
  };

  // Helper function to create/update composite address mappings
  const updateCompositeAddressMappings = (state: WizardState): WizardState => {
    const mappings = [...state.mappings];
    
    // Check for multi-line address components (Address, Address 2, Address 3)
    const addressLines = {
      line1: mappings.find(m => m.targetField === 'address.line1')?.sourceColumn,
      line2: mappings.find(m => m.targetField === 'address.line2')?.sourceColumn,
      line3: mappings.find(m => m.targetField === 'address.line3')?.sourceColumn,
    };

    // Check for component address (Street, City, State, Zip)
    const addressComponents = {
      street: mappings.find(m => m.targetField === 'address.street')?.sourceColumn,
      city: mappings.find(m => m.targetField === 'address.city')?.sourceColumn,
      state: mappings.find(m => m.targetField === 'address.state')?.sourceColumn,
      zip: mappings.find(m => m.targetField === 'address.zip')?.sourceColumn,
    };

    // Check for multi-line billing address
    const billingLines = {
      line1: mappings.find(m => m.targetField === 'billing_address.line1')?.sourceColumn,
      line2: mappings.find(m => m.targetField === 'billing_address.line2')?.sourceColumn,
      line3: mappings.find(m => m.targetField === 'billing_address.line3')?.sourceColumn,
    };

    // Check for component billing address
    const billingComponents = {
      street: mappings.find(m => m.targetField === 'billing_address.street')?.sourceColumn,
      city: mappings.find(m => m.targetField === 'billing_address.city')?.sourceColumn,
      state: mappings.find(m => m.targetField === 'billing_address.state')?.sourceColumn,
      zip: mappings.find(m => m.targetField === 'billing_address.zip')?.sourceColumn,
    };

    // Keep all mappings including composite fields (don't remove them)
    // Remove only old __composite__ special mappings
    const filtered = mappings.filter(m => 
      m.sourceColumn !== '__composite_address__' &&
      m.sourceColumn !== '__composite_billing_address__'
    );

    // Add composite address mapping - prefer line pattern if present, otherwise use components
    const hasAddressLines = Object.values(addressLines).some(v => v);
    const hasAddressComponents = Object.values(addressComponents).some(v => v);
    
    if (hasAddressLines || hasAddressComponents) {
      filtered.push({
        sourceColumn: '__composite_address__',
        targetField: 'address',
        transform: 'combineAddress',
        required: true,
        transformParams: hasAddressLines ? addressLines : addressComponents,
      });
    }

    // Add composite billing address mapping
    const hasBillingLines = Object.values(billingLines).some(v => v);
    const hasBillingComponents = Object.values(billingComponents).some(v => v);
    
    if (hasBillingLines || hasBillingComponents) {
      filtered.push({
        sourceColumn: '__composite_billing_address__',
        targetField: 'billing_address',
        transform: 'combineAddress',
        required: false,
        transformParams: hasBillingLines ? billingLines : billingComponents,
      });
    }

    return { ...state, mappings: filtered };
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
  
  // Check if composite address fields satisfy the address requirement
  const hasCompositeAddress = (fieldName: string) => {
    if (fieldName === 'address') {
      // Address is satisfied if we have address.line1 OR address.street (plus optional city/state/zip)
      return state.mappings.some((m) => 
        m.targetField === 'address.line1' || 
        m.targetField === 'address.street' ||
        m.targetField === 'address.city'
      );
    }
    return false;
  };
  
  const mappedRequiredFields = requiredFields.filter((f) =>
    state.mappings.some((m) => m.targetField === f.name) || hasCompositeAddress(f.name)
  );
  const missingRequiredFields = requiredFields.filter(
    (f) => !state.mappings.some((m) => m.targetField === f.name) && !hasCompositeAddress(f.name)
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
                          value={mapping?.targetField || '__skip__'}
                          onValueChange={(value) => handleMappingChange(header, value)}
                        >
                          <SelectTrigger className="h-8">
                            <SelectValue placeholder="Don't import" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__skip__">Don't import</SelectItem>
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

          {/* Composite Address Info */}
          {state.mappings.some(m => m.transform === 'combineAddress') && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Address fields will be combined:</strong>
                {state.mappings.filter(m => m.transform === 'combineAddress').map((mapping, idx) => {
                  const params = mapping.transformParams as Record<string, string | undefined>;
                  const parts = Object.entries(params || {})
                    .filter(([_, value]) => value)
                    .map(([key, value]) => `${value} (${key})`)
                    .join(' + ');
                  return (
                    <div key={idx} className="mt-1">
                      {parts} → <strong>{mapping.targetField}</strong>
                    </div>
                  );
                })}
              </AlertDescription>
            </Alert>
          )}

          {/* Summary */}
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span>{state.mappings.filter((m) => m.targetField && !m.targetField.startsWith('props.') && !m.sourceColumn.startsWith('__composite_')).length} → Database columns</span>
            <span>{state.mappings.filter((m) => m.sourceColumn.startsWith('__composite_')).length} → Composite fields</span>
            <span>{state.mappings.filter((m) => m.targetField?.startsWith('props.')).length} → Custom fields</span>
            <span>{(state.previewData?.headers.length || 0) - state.mappings.filter((m) => m.targetField && !m.sourceColumn.startsWith('__composite_')).length} Skipped</span>
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


