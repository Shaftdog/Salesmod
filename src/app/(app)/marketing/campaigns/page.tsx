import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { Megaphone } from "lucide-react";

export default function CampaignsPage() {
  return (
    <PlaceholderPage
      title="Marketing Campaigns"
      description="Create and manage marketing campaigns to reach potential clients"
      backLink="/marketing"
      backLinkLabel="Back to Marketing"
      icon={Megaphone}
    />
  );
}
