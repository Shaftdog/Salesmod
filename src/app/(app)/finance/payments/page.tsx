import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  return (
    <PlaceholderPage
      title="Payment Processing"
      description="Process and track client payments and transactions"
      backLink="/finance"
      backLinkLabel="Back to Finance"
      icon={CreditCard}
    />
  );
}
