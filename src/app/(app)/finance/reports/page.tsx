import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { PieChart } from "lucide-react";

export default function FinanceReportsPage() {
  return (
    <PlaceholderPage
      title="Financial Reports"
      description="Generate and view financial reports and analytics"
      backLink="/finance"
      backLinkLabel="Back to Finance"
      icon={PieChart}
    />
  );
}
