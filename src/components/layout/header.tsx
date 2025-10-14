
"use client";

import React, { memo, useEffect } from "react";
import Link from "next/link";
import { usePathname } from 'next/navigation';
import {
  Home,
  Package,
  PanelLeft,
  Search,
  Briefcase,
  Settings,
  Target,
  CheckSquare,
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
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { cn } from "@/lib/utils";
import { useSearch } from "@/contexts/search-context";
import { useAuth } from "@/components/auth/auth-provider";
import { useCurrentUser } from "@/hooks/use-appraisers";

const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/orders", label: "Orders", icon: Package },
    { href: "/clients", label: "Clients", icon: Briefcase },
    { href: "/deals", label: "Deals", icon: Target },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/settings", label: "Settings", icon: Settings },
];

function Header() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const userAvatar = PlaceHolderImages.find(p => p.id === 'user-avatar-1');
  
  useEffect(() => {
    // We don't reset search term on navigation anymore as filtering is now on the pages.
    // setSearchTerm('');
  }, [pathname]);

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

  const breadcrumbItems = React.useMemo(() => {
    const pathParts = pathname.split('/').filter(part => part);
    if (pathParts.length === 0) return [{ label: 'Dashboard', href: '/dashboard', isPage: true }];
    
    const items = pathParts.map((part, index) => {
        const href = '/' + pathParts.slice(0, index + 1).join('/');
        const isPage = index === pathParts.length - 1;
        let label = part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' ');
        // Special case for order IDs to show "Order <ID>"
        if (pathParts[index-1] === 'orders' && part.match(/^order-\d+$/)) {
            label = `Order ${part.split('-')[1]}`;
        }
        if (pathParts[index-1] === 'clients' && part.match(/^client-\d+$/)) {
            label = `Client Details`;
        }
        return {
            label,
            href,
            isPage
        }
    });

    if (pathParts[0] !== 'dashboard') {
        items.unshift({ label: 'Dashboard', href: '/dashboard', isPage: false });
    }

    return items;
  }, [pathname]);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="#"
              className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:text-base"
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
              <span className="sr-only">AppraiseTrack</span>
            </Link>
            {navLinks.map(({ href, label, icon: Icon }) => (
                 <Link
                 key={label}
                 href={href}
                 className={cn("flex items-center gap-4 px-2.5", 
                   pathname.startsWith(href) ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                 )}
               >
                 <Icon className="h-5 w-5" />
                 {label}
               </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {breadcrumbItems.map((item, index) => (
            <React.Fragment key={item.href}>
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
            </React.Fragment>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        {/* Search has been moved to individual pages */}
      </div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <Avatar className="h-8 w-8">
              {currentUser?.avatarUrl && <AvatarImage src={currentUser.avatarUrl} alt={currentUser.name} />}
              <AvatarFallback>{userInitials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
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

export default memo(Header);
