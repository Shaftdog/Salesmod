import { DEPARTMENT_LABELS, DEPARTMENT_PAGES, Department } from './navigation-config';

export interface BreadcrumbItem {
  label: string;
  href: string;
  isPage: boolean;
}

/**
 * Generates breadcrumb items from a pathname
 * @param pathname - The current URL pathname (e.g., "/sales/orders")
 * @returns Array of breadcrumb items with label, href, and isPage flag
 */
export function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const pathParts = pathname.split('/').filter(part => part);

  // Root path - show Dashboard
  if (pathParts.length === 0) {
    return [{ label: 'Dashboard', href: '/dashboard', isPage: true }];
  }

  const items = pathParts.map((part, index) => {
    const href = '/' + pathParts.slice(0, index + 1).join('/');
    const isPage = index === pathParts.length - 1;
    let label = formatLabel(part);

    // Special case for order IDs to show "Order <ID>"
    if (pathParts[index - 1] === 'orders' && part.match(/^order-\d+$/)) {
      const orderId = part.split('-')[1];
      if (orderId && /^\d+$/.test(orderId)) {
        label = `Order ${orderId}`;
      }
    }

    // Special case for client IDs
    if (pathParts[index - 1] === 'clients' && part.match(/^client-\d+$/)) {
      label = 'Client Details';
    }

    return { label, href, isPage };
  });

  // Insert department context for department pages
  const firstPart = pathParts[0];
  if (DEPARTMENT_PAGES[firstPart]) {
    const department = DEPARTMENT_PAGES[firstPart];
    items.unshift({
      label: DEPARTMENT_LABELS[department],
      href: `/${department}`,
      isPage: false
    });
  }

  // Add Dashboard prefix if not already on a department or dashboard page
  const isDepartmentPage = Object.values(DEPARTMENT_LABELS).includes(items[0]?.label);
  const isDashboard = pathParts[0] === 'dashboard';

  if (!isDepartmentPage && !isDashboard) {
    items.unshift({ label: 'Dashboard', href: '/dashboard', isPage: false });
  }

  return items;
}

/**
 * Formats a URL path segment into a readable label
 * @param part - URL path segment (e.g., "active-appraisals")
 * @returns Formatted label (e.g., "Active Appraisals")
 */
function formatLabel(part: string): string {
  return part
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Checks if a navigation item should be highlighted as active
 * @param itemHref - The href of the navigation item
 * @param currentPath - The current pathname
 * @returns True if the item should be highlighted
 */
export function isActivePath(itemHref: string, currentPath: string): boolean {
  // Special case for /agent route to avoid matching /agent/jobs
  if (itemHref === "/agent") {
    return currentPath === "/agent" ||
           (currentPath.startsWith("/agent/") && !currentPath.startsWith("/agent/jobs"));
  }

  // Exact match or starts with path (for nested routes)
  return currentPath === itemHref || currentPath.startsWith(itemHref + "/");
}
