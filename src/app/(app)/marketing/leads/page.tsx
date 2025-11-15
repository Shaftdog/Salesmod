import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { UserPlus } from "lucide-react";

export default function LeadsPage() {
  return (
    <PlaceholderPage
      title="Marketing Leads"
      description="Track and nurture potential clients through the lead funnel"
      backLink="/marketing"
      backLinkLabel="Back to Marketing"
      icon={UserPlus}
    />
  );
}
