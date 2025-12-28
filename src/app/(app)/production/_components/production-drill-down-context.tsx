"use client";

import * as React from "react";
import { createContext, useContext, useState, useCallback } from "react";

export type ProductionDrillDownType =
  | "filesDueToClient"
  | "allDue"
  | "filesOverdue"
  | "productionDue"
  | "filesInReview"
  | "filesNotInReview"
  | "filesWithIssues"
  | "filesWithCorrection"
  | "correctionReview"
  | "casesInProgress"
  | "casesImpeded"
  | "casesInReview"
  | "casesDelivered"
  | "readyForDelivery"
  | "ordersDeliveredToday"
  | "valueDeliveredToday"
  | "deliveredPast7Days"
  | "valueDeliveredPast7Days"
  | "avgTurnTime1Week"
  | "avgTurnTime30Days";

export interface DrillDownConfig {
  type: ProductionDrillDownType;
  title: string;
  description?: string;
}

interface DrillDownState {
  isOpen: boolean;
  config: DrillDownConfig | null;
}

interface DrillDownContextValue {
  state: DrillDownState;
  openDrillDown: (config: DrillDownConfig) => void;
  closeDrillDown: () => void;
}

const DrillDownContext = createContext<DrillDownContextValue | undefined>(undefined);

export function ProductionDrillDownProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DrillDownState>({
    isOpen: false,
    config: null,
  });

  const openDrillDown = useCallback((config: DrillDownConfig) => {
    setState({ isOpen: true, config });
  }, []);

  const closeDrillDown = useCallback(() => {
    setState({ isOpen: false, config: null });
  }, []);

  return (
    <DrillDownContext.Provider value={{ state, openDrillDown, closeDrillDown }}>
      {children}
    </DrillDownContext.Provider>
  );
}

export function useProductionDrillDown() {
  const context = useContext(DrillDownContext);
  if (!context) {
    throw new Error("useProductionDrillDown must be used within ProductionDrillDownProvider");
  }
  return context;
}

// Helper to create drill-down configs for each metric
export const DRILL_DOWN_CONFIGS: Record<ProductionDrillDownType, { title: string; description: string }> = {
  filesDueToClient: {
    title: "Files Due to Client",
    description: "Orders with files due to be delivered to clients",
  },
  allDue: {
    title: "All Due",
    description: "All orders with due dates approaching",
  },
  filesOverdue: {
    title: "Files Overdue",
    description: "Orders that have passed their due date",
  },
  productionDue: {
    title: "Production Due",
    description: "Orders with production deadlines approaching",
  },
  filesInReview: {
    title: "Files in Review",
    description: "Orders currently being reviewed",
  },
  filesNotInReview: {
    title: "Files Not in Review",
    description: "Orders awaiting review",
  },
  filesWithIssues: {
    title: "Files with Issues",
    description: "Orders flagged with issues",
  },
  filesWithCorrection: {
    title: "Files with Correction",
    description: "Orders requiring corrections",
  },
  correctionReview: {
    title: "Correction Review",
    description: "Corrections pending review",
  },
  casesInProgress: {
    title: "Cases in Progress",
    description: "Active cases being worked on",
  },
  casesImpeded: {
    title: "Cases Impeded",
    description: "Cases blocked or waiting for action",
  },
  casesInReview: {
    title: "Cases in Review",
    description: "Cases pending review",
  },
  casesDelivered: {
    title: "Cases Delivered",
    description: "Cases successfully delivered",
  },
  readyForDelivery: {
    title: "Ready for Delivery",
    description: "Orders ready to be delivered",
  },
  ordersDeliveredToday: {
    title: "Orders Delivered Today",
    description: "Orders delivered in the last 24 hours",
  },
  valueDeliveredToday: {
    title: "Value Delivered Today",
    description: "Total value of orders delivered today",
  },
  deliveredPast7Days: {
    title: "Delivered Past 7 Days",
    description: "Orders delivered in the past week",
  },
  valueDeliveredPast7Days: {
    title: "Value Delivered Past 7 Days",
    description: "Total value delivered in the past week",
  },
  avgTurnTime1Week: {
    title: "Average Turn Time (1 Week)",
    description: "Average completion time for orders in the past week",
  },
  avgTurnTime30Days: {
    title: "Average Turn Time (30 Days)",
    description: "Average completion time for orders in the past 30 days",
  },
};
