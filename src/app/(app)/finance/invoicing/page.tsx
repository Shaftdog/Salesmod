import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { Receipt } from "lucide-react";

export default function InvoicingPage() {
  return (
    <PlaceholderPage
      title="Invoicing"
      description="Create, send, and manage client invoices"
      backLink="/finance"
      backLinkLabel="Back to Finance"
      icon={Receipt}
    />
  );
}
