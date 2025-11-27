"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserAreas } from "@/hooks/use-user-areas";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  DEPARTMENT_SECTIONS,
  AI_SECTION,
  SYSTEM_ITEMS,
  ADMIN_ITEM,
  SUPER_ADMIN_ITEM,
  getInitialExpandedState,
  type NavSection,
} from "@/lib/navigation-config";
import { isActivePath } from "@/lib/breadcrumb-utils";
import type { AreaCode } from "@/lib/admin/types";

function Sidebar() {
  const pathname = usePathname();
  const { hasAccess, isSuperAdmin, isAdmin, isLoading: areasLoading } = useUserAreas();

  // Track which sections are expanded - all start collapsed
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>(
    getInitialExpandedState()
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Filter department sections based on user's area access
  const accessibleSections = useMemo(() => {
    // While loading, show all sections to prevent flash
    if (areasLoading) {
      return DEPARTMENT_SECTIONS;
    }
    // Super admin sees everything
    if (isSuperAdmin) {
      return DEPARTMENT_SECTIONS;
    }
    // Filter sections based on user's area access
    return DEPARTMENT_SECTIONS.filter((section) => {
      if (!section.areaCode) return true;
      return hasAccess(section.areaCode as AreaCode);
    });
  }, [hasAccess, isSuperAdmin, areasLoading]);

  // Check if user has access to AI section
  const showAISection = useMemo(() => {
    if (areasLoading) return true;
    if (isSuperAdmin) return true;
    return hasAccess('ai_automation' as AreaCode);
  }, [hasAccess, isSuperAdmin, areasLoading]);

  // Build system items with conditional admin links
  const systemItems = useMemo(() => {
    const items = [...SYSTEM_ITEMS];
    // Add admin link for admins and super admins
    if (isAdmin) {
      items.push(ADMIN_ITEM);
    }
    // Add role management link for super admins only
    if (isSuperAdmin) {
      items.push(SUPER_ADMIN_ITEM);
    }
    return items;
  }, [isAdmin, isSuperAdmin]);

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-background sm:flex">
      {/* Logo - Fixed at top */}
      <div className="flex-shrink-0 px-3 py-5">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-lg font-semibold"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-6 w-6 text-primary"
          >
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
            <path d="M2 12l10 5 10-5" />
          </svg>
          <span>AppraiseTrack</span>
        </Link>
      </div>

      {/* Scrollable Navigation - Middle */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {/* System Items */}
        <div className="mb-2 space-y-1">
          {systemItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                pathname === item.href && "bg-accent text-accent-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="my-2 border-t" />

        {/* Departmental Sections - filtered by user access */}
        <div className="space-y-1">
          {accessibleSections.map((section) => (
            <Collapsible
              key={section.key}
              open={expandedSections[section.key]}
              onOpenChange={() => toggleSection(section.key)}
            >
              <CollapsibleTrigger
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
                aria-label={`${section.label} department navigation`}
                aria-expanded={expandedSections[section.key]}
                aria-controls={`${section.key}-nav`}
              >
                <section.icon className="h-4 w-4" />
                <span className="flex-1 text-left">{section.label}</span>
                {expandedSections[section.key] ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </CollapsibleTrigger>
              <CollapsibleContent
                className="ml-4 space-y-1 border-l pl-2"
                id={`${section.key}-nav`}
              >
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                      isActivePath(item.href, pathname) && "bg-accent text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                ))}
              </CollapsibleContent>
            </Collapsible>
          ))}
        </div>
      </nav>

      {/* Bottom Section - AI & System - Fixed at bottom (conditionally shown) */}
      {showAISection && (
        <div className="flex-shrink-0 border-t px-3 py-5">
          <Collapsible
            open={expandedSections[AI_SECTION.key]}
            onOpenChange={() => toggleSection(AI_SECTION.key)}
          >
            <CollapsibleTrigger
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground"
              aria-label={`${AI_SECTION.label} navigation`}
              aria-expanded={expandedSections[AI_SECTION.key]}
              aria-controls={`${AI_SECTION.key}-nav`}
            >
              <AI_SECTION.icon className="h-4 w-4" />
              <span className="flex-1 text-left">{AI_SECTION.label}</span>
              {expandedSections[AI_SECTION.key] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent
              className="ml-4 space-y-1 border-l pl-2"
              id={`${AI_SECTION.key}-nav`}
            >
              {AI_SECTION.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground",
                    isActivePath(item.href, pathname) && "bg-accent text-accent-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
