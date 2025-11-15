import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { BarChart3 } from "lucide-react";

export default function MarketingAnalyticsPage() {
  return (
    <PlaceholderPage
      title="Marketing Analytics"
      description="Analyze campaign performance and marketing ROI"
      backLink="/marketing"
      backLinkLabel="Back to Marketing"
      icon={BarChart3}
    />
  );
}
