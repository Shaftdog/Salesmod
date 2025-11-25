import {
  Home,
  Package as PackageIcon,
  Settings,
  Briefcase,
  Target,
  CheckSquare,
  Brain,
  Database,
  Users,
  MapPin,
  Shield,
  LifeBuoy,
  Bot,
  Calendar,
  TrendingUp,
  Megaphone,
  Factory,
  Cog,
  Truck,
  DollarSign,
  LayoutDashboard,
  FileText,
  BarChart3,
  ClipboardList,
  UserPlus,
  CheckCircle,
  FileCheck,
  Library,
  CalendarClock,
  MapPinned,
  UserCog,
  Receipt,
  CreditCard,
  PieChart,
  ShoppingBag,
  FolderOpen,
  Mail,
  Video,
  CalendarDays,
  Star,
  Clock,
  Package,
  Kanban,
  ListTodo,
} from "lucide-react";

export interface NavItem {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}

export interface NavSection {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  dashboardHref: string;
  items: NavItem[];
}

export const DEPARTMENT_SECTIONS: NavSection[] = [
  {
    key: "sales",
    label: "Sales",
    icon: TrendingUp,
    dashboardHref: "/sales",
    items: [
      { href: "/sales", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/orders", icon: PackageIcon, label: "Orders" },
      { href: "/clients", icon: Briefcase, label: "Clients" },
      { href: "/contacts", icon: Users, label: "Contacts" },
      { href: "/deals", icon: Target, label: "Deals" },
      { href: "/cases", icon: LifeBuoy, label: "Cases" },
      { href: "/properties", icon: MapPin, label: "Properties" },
      { href: "/sales/campaigns", icon: Mail, label: "Campaigns" },
      { href: "/sales/products", icon: ShoppingBag, label: "Products" },
    ],
  },
  {
    key: "marketing",
    label: "Marketing",
    icon: Megaphone,
    dashboardHref: "/marketing",
    items: [
      { href: "/marketing", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/marketing/campaigns", icon: FileText, label: "Campaigns" },
      { href: "/marketing/content", icon: FolderOpen, label: "Content Library" },
      { href: "/marketing/audiences", icon: UserPlus, label: "Lead Scoring" },
      { href: "/marketing/newsletters", icon: Mail, label: "Newsletters" },
      { href: "/marketing/email-templates", icon: Mail, label: "Email Templates" },
      { href: "/marketing/webinars", icon: Video, label: "Webinars" },
      { href: "/marketing/reputation", icon: Star, label: "Reputation" },
      { href: "/marketing/analytics", icon: BarChart3, label: "Analytics" },
      { href: "/marketing/calendar", icon: CalendarDays, label: "Calendar" },
    ],
  },
  {
    key: "production",
    label: "Production",
    icon: Factory,
    dashboardHref: "/production",
    items: [
      { href: "/production", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/production/board", icon: Kanban, label: "Kanban Board" },
      { href: "/production/my-tasks", icon: ListTodo, label: "My Tasks" },
      { href: "/production/active-appraisals", icon: ClipboardList, label: "Active Appraisals" },
      { href: "/production/quality-control", icon: CheckCircle, label: "Quality Control" },
      { href: "/production/templates", icon: FileCheck, label: "Templates" },
      { href: "/production/library", icon: Library, label: "Task Library" },
    ],
  },
  {
    key: "operations",
    label: "Operations",
    icon: Cog,
    dashboardHref: "/operations",
    items: [
      { href: "/operations", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/tasks", icon: CheckSquare, label: "Tasks" },
      { href: "/operations/workflows", icon: Target, label: "Workflows" },
      { href: "/operations/resources", icon: UserCog, label: "Resources" },
    ],
  },
  {
    key: "logistics",
    label: "Logistics",
    icon: Truck,
    dashboardHref: "/logistics",
    items: [
      { href: "/logistics", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/logistics/resources", icon: UserCog, label: "Resources" },
      { href: "/logistics/equipment", icon: Package, label: "Equipment" },
      { href: "/logistics/territories", icon: MapPinned, label: "Territories" },
      { href: "/logistics/availability", icon: Calendar, label: "Availability" },
      { href: "/logistics/bookings", icon: CalendarClock, label: "Bookings" },
      { href: "/logistics/daily-schedule", icon: Clock, label: "Daily View" },
    ],
  },
  {
    key: "finance",
    label: "Finance",
    icon: DollarSign,
    dashboardHref: "/finance",
    items: [
      { href: "/finance", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/finance/invoicing", icon: Receipt, label: "Invoicing" },
      { href: "/finance/payments", icon: CreditCard, label: "Payments" },
      { href: "/finance/reports", icon: PieChart, label: "Reports" },
    ],
  },
];

export const AI_SECTION: NavSection = {
  key: "ai",
  label: "AI & Automation",
  icon: Brain,
  dashboardHref: "/agent",
  items: [
    { href: "/agent", icon: Bot, label: "AI Agent" },
    { href: "/agent/jobs", icon: Calendar, label: "Jobs" },
    { href: "/ai-analytics", icon: Brain, label: "AI Analytics" },
  ],
};

export const SYSTEM_ITEMS: NavItem[] = [
  { href: "/dashboard", icon: Home, label: "Overview" },
  { href: "/migrations", icon: Database, label: "Migrations" },
  { href: "/settings", icon: Settings, label: "Settings" },
];

export const ADMIN_ITEM: NavItem = {
  href: "/admin",
  icon: Shield,
  label: "Admin",
};

// Generate initial expanded state from sections
export const getInitialExpandedState = (): Record<string, boolean> => {
  const state: Record<string, boolean> = {};
  DEPARTMENT_SECTIONS.forEach((section) => {
    state[section.key] = false;
  });
  state[AI_SECTION.key] = false;
  return state;
};

// Department page mappings for breadcrumbs
export type Department = 'sales' | 'marketing' | 'production' | 'operations' | 'logistics' | 'finance';

export const DEPARTMENT_LABELS: Record<Department, string> = {
  sales: 'Sales',
  marketing: 'Marketing',
  production: 'Production',
  operations: 'Operations',
  logistics: 'Logistics',
  finance: 'Finance',
};

export const DEPARTMENT_PAGES: Record<string, Department> = {
  orders: 'sales',
  clients: 'sales',
  contacts: 'sales',
  deals: 'sales',
  cases: 'sales',
  properties: 'sales',
  campaigns: 'sales',
};
