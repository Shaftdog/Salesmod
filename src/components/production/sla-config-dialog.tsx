'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Loader2, RotateCcw, Save, Clock, Calendar } from 'lucide-react';
import { useProductionSLAConfig, useUpdateSLAConfig, useInitializeSLADefaults } from '@/hooks/use-production';
import {
  PRODUCTION_STAGES,
  PRODUCTION_STAGE_LABELS,
  SLA_REFERENCE_POINTS,
  SLA_REFERENCE_POINT_LABELS,
  DEFAULT_SLA_CONFIG,
  type ProductionStage,
  type SLAReferencePoint,
  type SLAConfigInput,
} from '@/types/production';

interface SLAConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Stages that should not have SLA configuration
const EXCLUDED_STAGES: ProductionStage[] = ['ON_HOLD', 'CANCELLED'];

// Stages that appear in the standard workflow
const WORKFLOW_STAGES = PRODUCTION_STAGES.filter(
  (stage) => !EXCLUDED_STAGES.includes(stage)
);

interface StageConfig {
  stage: ProductionStage;
  sla_days: number;
  reference_point: SLAReferencePoint;
}

// Helper to build config array from defaults
const buildDefaultConfigs = (): StageConfig[] =>
  WORKFLOW_STAGES.map((stage) => ({
    stage,
    sla_days: DEFAULT_SLA_CONFIG[stage].sla_days,
    reference_point: DEFAULT_SLA_CONFIG[stage].reference_point,
  }));

export function SLAConfigDialog({ open, onOpenChange }: SLAConfigDialogProps) {
  const { data: currentConfig, isLoading } = useProductionSLAConfig();
  const updateSLA = useUpdateSLAConfig();
  const initializeDefaults = useInitializeSLADefaults();

  // Local state for editing - initialize with defaults
  const [configs, setConfigs] = useState<StageConfig[]>(buildDefaultConfigs);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when server config loads
  useEffect(() => {
    if (currentConfig && currentConfig.length > 0) {
      const configMap = new Map(
        currentConfig.map((c) => [c.stage, c])
      );

      const updatedConfigs = WORKFLOW_STAGES.map((stage) => {
        const existing = configMap.get(stage);
        if (existing) {
          return {
            stage,
            sla_days: existing.sla_days,
            reference_point: existing.reference_point,
          };
        }
        // Fall back to defaults
        const defaultConfig = DEFAULT_SLA_CONFIG[stage];
        return {
          stage,
          sla_days: defaultConfig.sla_days,
          reference_point: defaultConfig.reference_point,
        };
      });

      setConfigs(updatedConfigs);
      setHasChanges(false);
    }
  }, [currentConfig]);

  const handleDaysChange = (stage: ProductionStage, days: number) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.stage === stage ? { ...c, sla_days: Math.max(0, days) } : c
      )
    );
    setHasChanges(true);
  };

  const handleReferencePointChange = (
    stage: ProductionStage,
    referencePoint: SLAReferencePoint
  ) => {
    setConfigs((prev) =>
      prev.map((c) =>
        c.stage === stage ? { ...c, reference_point: referencePoint } : c
      )
    );
    setHasChanges(true);
  };

  const handleSave = async () => {
    const configsToSave: SLAConfigInput[] = configs.map((c) => ({
      stage: c.stage,
      sla_days: c.sla_days,
      reference_point: c.reference_point,
    }));

    await updateSLA.mutateAsync(configsToSave);
    setHasChanges(false);
  };

  const handleResetToDefaults = async () => {
    await initializeDefaults.mutateAsync();
    setHasChanges(false);
  };

  const getReferencePointIcon = (referencePoint: SLAReferencePoint) => {
    switch (referencePoint) {
      case 'inspection_before':
      case 'inspection_after':
        return <Calendar className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  const getReferencePointBadgeVariant = (referencePoint: SLAReferencePoint) => {
    switch (referencePoint) {
      case 'inspection_before':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'inspection_after':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'card_created':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            SLA Configuration
          </DialogTitle>
          <DialogDescription>
            Configure task due date deadlines for each production stage.
            Inspection date serves as a milestone for scheduling-related stages.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Stage</TableHead>
                  <TableHead className="w-[100px]">Days</TableHead>
                  <TableHead>Reference Point</TableHead>
                  <TableHead className="w-[180px]">Due Date Formula</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {configs.map((config) => (
                  <TableRow key={config.stage}>
                    <TableCell className="font-medium">
                      {PRODUCTION_STAGE_LABELS[config.stage]}
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min={0}
                        max={30}
                        value={config.sla_days}
                        onChange={(e) =>
                          handleDaysChange(
                            config.stage,
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-20 h-8"
                      />
                    </TableCell>
                    <TableCell>
                      <Select
                        value={config.reference_point}
                        onValueChange={(v) =>
                          handleReferencePointChange(
                            config.stage,
                            v as SLAReferencePoint
                          )
                        }
                      >
                        <SelectTrigger className="w-[200px] h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SLA_REFERENCE_POINTS.map((rp) => (
                            <SelectItem key={rp} value={rp}>
                              {SLA_REFERENCE_POINT_LABELS[rp]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getReferencePointBadgeVariant(
                          config.reference_point
                        )}`}
                      >
                        {getReferencePointIcon(config.reference_point)}
                        <span className="ml-1">
                          {config.reference_point === 'inspection_before'
                            ? `${config.sla_days}d before inspection`
                            : config.reference_point === 'inspection_after'
                            ? `${config.sla_days}d after inspection`
                            : config.reference_point === 'card_created'
                            ? `${config.sla_days}d after created`
                            : `${config.sla_days}d after stage entry`}
                        </span>
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <div className="bg-muted/50 -mx-6 px-6 py-3 mt-4 border-t">
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <div>
              <strong>Inspection Date Milestone:</strong> Stages after scheduling
              use the inspection date as their reference point. If no inspection
              date is set, the system falls back to stage entry date.
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleResetToDefaults}
            disabled={initializeDefaults.isPending}
          >
            {initializeDefaults.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RotateCcw className="h-4 w-4 mr-2" />
            )}
            Reset to Defaults
          </Button>
          <Button
            onClick={handleSave}
            disabled={!hasChanges || updateSLA.isPending}
          >
            {updateSLA.isPending ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
