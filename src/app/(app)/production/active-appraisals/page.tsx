import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { ClipboardList } from "lucide-react";

export default function ActiveAppraisalsPage() {
  return (
    <PlaceholderPage
      title="Active Appraisals"
      description="Track all appraisals currently in production"
      backLink="/production"
      backLinkLabel="Back to Production"
      icon={ClipboardList}
    />
  );
}
