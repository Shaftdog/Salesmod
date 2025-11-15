"use client";

import { PlaceholderPage } from "@/components/ui/placeholder-page";
import { TrendingUp, Package, Briefcase, Users, Target, LifeBuoy, MapPin } from "lucide-react";

export default function SalesDashboard() {
  const quickLinks = [
    { href: "/orders", label: "Orders", icon: Package, description: "Manage appraisal orders" },
    { href: "/clients", label: "Clients", icon: Briefcase, description: "Client accounts and contacts" },
    { href: "/contacts", label: "Contacts", icon: Users, description: "Contact directory" },
    { href: "/deals", label: "Deals", icon: Target, description: "Sales pipeline and opportunities" },
    { href: "/cases", label: "Cases", icon: LifeBuoy, description: "Support and service cases" },
    { href: "/properties", label: "Properties", icon: MapPin, description: "Property database" },
  ];

  return (
    <PlaceholderPage
      title="Sales Dashboard"
      description="Overview of sales performance, pipeline, and key metrics"
      icon={TrendingUp}
      quickLinks={quickLinks}
    />
  );
}
