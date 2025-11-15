
"use client";
import { memo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home,
  Package,
  Settings,
  Briefcase,
  Target,
  CheckSquare,
  Brain,
  LifeBuoy,
  Bot,
  Database,
  Users,
  MapPin,
  Shield,
  Calendar,
  Megaphone,
  TrendingUp,
  FileText,
  CalendarDays,
  UsersRound,
  Mail,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useCurrentUser } from "@/hooks/use-appraisers";

function Sidebar() {
  const pathname = usePathname();
  const { data: currentUser } = useCurrentUser();

  // Create nav items with conditional admin panel
  const navItems = [
    { href: "/dashboard", icon: Home, label: "Dashboard" },
    { href: "/orders", icon: Package, label: "Orders" },
    { href: "/properties", icon: MapPin, label: "Properties" },
    { href: "/clients", icon: Briefcase, label: "Clients" },
    { href: "/contacts", icon: Users, label: "Contacts" },
    { href: "/deals", icon: Target, label: "Deals" },
    { href: "/tasks", icon: CheckSquare, label: "Tasks" },
    { href: "/cases", icon: LifeBuoy, label: "Cases" },
    { href: "/migrations", icon: Database, label: "Migrations" },
    ...(currentUser?.role === 'admin' ? [{ href: "/admin", icon: Shield, label: "Admin" }] : []),
  ];

  // Marketing submenu items
  const marketingItems = [
    { href: "/marketing", icon: TrendingUp, label: "Dashboard" },
    { href: "/marketing/campaigns", icon: Megaphone, label: "Campaigns" },
    { href: "/marketing/content", icon: FileText, label: "Content Library" },
    { href: "/marketing/calendar", icon: CalendarDays, label: "Content Calendar" },
    { href: "/marketing/audiences", icon: UsersRound, label: "Audiences" },
    { href: "/marketing/newsletters", icon: Mail, label: "Newsletters" },
    { href: "/marketing/analytics", icon: BarChart3, label: "Analytics" },
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
        <TooltipProvider>
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link
          href="#"
          className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-5 w-5"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span className="sr-only">AppraiseTrack</span>
        </Link>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    pathname.startsWith(item.href) && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}

          {/* Marketing Dropdown */}
          <DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <button
                    className={cn(
                      "flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                      pathname.startsWith('/marketing') && "bg-accent text-accent-foreground"
                    )}
                  >
                    <Megaphone className="h-5 w-5" />
                    <span className="sr-only">Marketing</span>
                  </button>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">Marketing</TooltipContent>
            </Tooltip>
            <DropdownMenuContent side="right" align="start" className="w-48">
              <DropdownMenuLabel>Marketing</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {marketingItems.map((item) => (
                <DropdownMenuItem key={item.href} asChild>
                  <Link href={item.href} className="flex items-center cursor-pointer">
                    <item.icon className="h-4 w-4 mr-2" />
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/agent"
                className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    pathname.startsWith('/agent') && !pathname.startsWith('/agent/jobs') && "bg-accent text-accent-foreground"
                )}
              >
                <Bot className="h-5 w-5" />
                <span className="sr-only">AI Agent</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">AI Agent</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/agent/jobs"
                className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    pathname.startsWith('/agent/jobs') && "bg-accent text-accent-foreground"
                )}
              >
                <Calendar className="h-5 w-5" />
                <span className="sr-only">Jobs</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Jobs</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/ai-analytics"
                className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    pathname.startsWith('/ai-analytics') && "bg-accent text-accent-foreground"
                )}
              >
                <Brain className="h-5 w-5" />
                <span className="sr-only">AI Analytics</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">AI Analytics</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={cn("flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8",
                    pathname.startsWith('/settings') && "bg-accent text-accent-foreground"
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
      </nav>
        </TooltipProvider>
    </aside>
  );
}

export default memo(Sidebar);
