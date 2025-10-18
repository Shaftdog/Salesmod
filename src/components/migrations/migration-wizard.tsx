"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Check } from "lucide-react";
import {
  MigrationSource,
  MigrationEntity,
  FieldMapping,
  DuplicateStrategy,
  PreviewData,
  DryRunResult,
} from "@/lib/migrations/types";

export interface WizardState {
  // Step 1: Source Selection
  source: MigrationSource;
  entity: MigrationEntity;
  mode: 'csv' | 'api';
  
  // Step 2: File Upload
  file: File | null;
  previewData: PreviewData | null;
  
  // Step 3: Field Mapping
  mappings: FieldMapping[];
  
  // Step 4: Dry Run
  dryRunResult: DryRunResult | null;
  duplicateStrategy: DuplicateStrategy;
  
  // Step 5: Execution
  jobId: string | null;
  
  // Step 6: Results
  completed: boolean;
}

const initialState: WizardState = {
  source: 'csv',
  entity: 'contacts',
  mode: 'csv',
  file: null,
  previewData: null,
  mappings: [],
  dryRunResult: null,
  duplicateStrategy: 'update',
  jobId: null,
  completed: false,
};

const steps = [
  { id: 1, name: 'Source' },
  { id: 2, name: 'Upload' },
  { id: 3, name: 'Map Fields' },
  { id: 4, name: 'Validate' },
  { id: 5, name: 'Import' },
  { id: 6, name: 'Results' },
];

interface MigrationWizardProps {
  children: (props: {
    state: WizardState;
    setState: React.Dispatch<React.SetStateAction<WizardState>>;
    currentStep: number;
    setCurrentStep: (step: number) => void;
    nextStep: () => void;
    prevStep: () => void;
    canProceed: boolean;
    resetWizard: () => void;
  }) => React.ReactNode;
}

export function MigrationWizard({ children }: MigrationWizardProps) {
  const [state, setState] = useState<WizardState>(initialState);
  const [currentStep, setCurrentStep] = useState(1);

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const resetWizard = () => {
    setState(initialState);
    setCurrentStep(1);
  };

  // Determine if we can proceed from current step
  const canProceed = (() => {
    switch (currentStep) {
      case 1:
        return true; // Source selection always allows proceed
      case 2:
        return state.previewData !== null;
      case 3:
        return state.mappings.length > 0;
      case 4:
        return state.dryRunResult !== null && (state.dryRunResult.errors.length === 0 || true); // Allow proceed even with errors for now
      case 5:
        return state.jobId !== null;
      case 6:
        return true;
      default:
        return false;
    }
  })();

  const progress = (currentStep / steps.length) * 100;

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <Card className="p-6">
        <div className="mb-4">
          <Progress value={progress} className="h-2" />
        </div>
        
        <div className="flex justify-between">
          {steps.map((step, index) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            
            return (
              <div key={step.id} className="flex flex-col items-center flex-1">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                    ${isCompleted ? 'bg-primary text-primary-foreground' : ''}
                    ${isCurrent ? 'bg-primary/20 text-primary border-2 border-primary' : ''}
                    ${!isCompleted && !isCurrent ? 'bg-muted text-muted-foreground' : ''}
                  `}
                >
                  {isCompleted ? <Check className="h-5 w-5" /> : step.id}
                </div>
                <span className={`text-xs mt-2 ${isCurrent ? 'font-semibold' : 'text-muted-foreground'}`}>
                  {step.name}
                </span>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Wizard Content */}
      {children({
        state,
        setState,
        currentStep,
        setCurrentStep,
        nextStep,
        prevStep,
        canProceed,
        resetWizard,
      })}
    </div>
  );
}

