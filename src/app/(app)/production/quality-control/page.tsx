import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { CheckCircle } from "lucide-react";

export default function QualityControlPage() {
  return (
    <PlaceholderPage
      title="Quality Control"
      description="Review and approve appraisals for USPAP compliance"
      backLink="/production"
      backLinkLabel="Back to Production"
      icon={CheckCircle}
    />
  );
}
