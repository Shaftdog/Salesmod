"use client";

import * as React from "react";
import { createContext, useContext, useState, useCallback } from "react";

export interface WorkloadDrillDownConfig {
  userId: string;
  userName: string;
  period: "day" | "week" | "month";
  startDate: string;
  endDate: string;
  taskCount: number;
  estimatedHours: number;
  capacityUsedPercent: number;
  isOverloaded: boolean;
}

interface DrillDownState {
  isOpen: boolean;
  config: WorkloadDrillDownConfig | null;
}

interface DrillDownContextValue {
  state: DrillDownState;
  openDrillDown: (config: WorkloadDrillDownConfig) => void;
  closeDrillDown: () => void;
}

const WorkloadDrillDownContext = createContext<DrillDownContextValue | undefined>(undefined);

export function WorkloadDrillDownProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DrillDownState>({
    isOpen: false,
    config: null,
  });

  const openDrillDown = useCallback((config: WorkloadDrillDownConfig) => {
    setState({ isOpen: true, config });
  }, []);

  const closeDrillDown = useCallback(() => {
    setState({ isOpen: false, config: null });
  }, []);

  return (
    <WorkloadDrillDownContext.Provider value={{ state, openDrillDown, closeDrillDown }}>
      {children}
    </WorkloadDrillDownContext.Provider>
  );
}

export function useWorkloadDrillDown() {
  const context = useContext(WorkloadDrillDownContext);
  if (!context) {
    throw new Error("useWorkloadDrillDown must be used within WorkloadDrillDownProvider");
  }
  return context;
}
