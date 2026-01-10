"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import {
  PanelLeft,
  ChevronDown,
  ChevronRight,
  Settings,
  Shield,
} from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/auth-provider";
import { useCurrentUser } from "@/hooks/use-appraisers";
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
  getInitialExpandedState,
} from "@/lib/navigation-config";
import { generateBreadcrumbs, isActivePath } from "@/lib/breadcrumb-utils";

function Header() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { data: currentUser, isLoading, error } = useCurrentUser();
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');
  const [mobileExpandedSections, setMobileExpandedSections] = useState<Record<string, boolean>>(
    getInitialExpandedState()
  );

  const toggleMobileSection = (section: string) => {
    setMobileExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Log user data loading errors
  if (error) {
    console.error('Failed to load user data:', error);
  }

  const handleSignOut = async () => {
    await signOut();
  };

  const userInitials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'AT';

  const breadcrumbItems = generateBreadcrumbs(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs overflow-y-auto">
          <nav className="grid gap-4 text-sm font-medium">
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 text-lg font-semibold"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-5 w-5 transition-all group-hover:scale-110"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              <span>AppraiseTrack</span>
            </Link>

            {/* System Items */}
            <div className="space-y-1">
              {SYSTEM_ITEMS.map((item) => (
                <SheetClose asChild key={item.href}>
                  <Link
                    href={item.href}
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent",
                      isActivePath(item.href, pathname) && "bg-accent"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                </SheetClose>
              ))}
            </div>

            <div className="border-t pt-4 space-y-1">
              {/* Department Sections */}
              {DEPARTMENT_SECTIONS.map((section) => (
                <Collapsible
                  key={section.key}
                  open={mobileExpandedSections[section.key]}
                  onOpenChange={() => toggleMobileSection(section.key)}
                >
                  <CollapsibleTrigger
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-medium hover:bg-accent"
                    aria-label={`${section.label} department navigation`}
                    aria-expanded={mobileExpandedSections[section.key]}
                    aria-controls={`mobile-${section.key}-nav`}
                  >
                    <section.icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{section.label}</span>
                    {mobileExpandedSections[section.key] ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent
                    className="ml-4 space-y-1 border-l pl-2"
                    id={`mobile-${section.key}-nav`}
                  >
                    {section.items.map((item) => (
                      <SheetClose asChild key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent",
                            isActivePath(item.href, pathname) && "bg-accent"
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      </SheetClose>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>

            <div className="border-t pt-4 space-y-1">
              {/* AI Section */}
              <Collapsible
                open={mobileExpandedSections[AI_SECTION.key]}
                onOpenChange={() => toggleMobileSection(AI_SECTION.key)}
              >
                <CollapsibleTrigger
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 font-medium hover:bg-accent"
                  aria-label={`${AI_SECTION.label} navigation`}
                  aria-expanded={mobileExpandedSections[AI_SECTION.key]}
                  aria-controls={`mobile-${AI_SECTION.key}-nav`}
                >
                  <AI_SECTION.icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{AI_SECTION.label}</span>
                  {mobileExpandedSections[AI_SECTION.key] ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </CollapsibleTrigger>
                <CollapsibleContent
                  className="ml-4 space-y-1 border-l pl-2"
                  id={`mobile-${AI_SECTION.key}-nav`}
                >
                  {AI_SECTION.items.map((item) => (
                    <SheetClose asChild key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-accent",
                          isActivePath(item.href, pathname) && "bg-accent"
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </CollapsibleContent>
              </Collapsible>

              <SheetClose asChild>
                <Link
                  href="/settings"
                  className={cn("flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent",
                    pathname.startsWith('/settings') && "bg-accent"
                  )}
                >
                  <Settings className="h-4 w-4" />
                  Settings
                </Link>
              </SheetClose>
              {currentUser?.role === 'admin' && (
                <SheetClose asChild>
                  <Link
                    href="/admin"
                    className={cn("flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent",
                      pathname.startsWith('/admin') && "bg-accent"
                    )}
                  >
                    <Shield className="h-4 w-4" />
                    Admin
                  </Link>
                </SheetClose>
              )}
            </div>
          </nav>
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <Fragment key={item.href}>
              <BreadcrumbItem>
                {item.isPage ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.href}>{item.label}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {index < breadcrumbItems.length - 1 && <BreadcrumbSeparator />}
            </Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Search has been moved to individual pages */}
      </div>
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="overflow-hidden rounded-full"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  {currentUser?.avatarUrl && <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />}
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>User menu</TooltipContent>
        </Tooltip>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>
            {currentUser?.name || 'My Account'}
            {currentUser?.email && (
              <div className="text-xs font-normal text-muted-foreground">
                {currentUser.email}
              </div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/settings">Settings</Link>
          </DropdownMenuItem>
          {currentUser?.role === 'admin' && (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex items-center">
                <Shield className="h-4 w-4 mr-2" />
                Admin Panel
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>
            Logout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}

export default Header;
