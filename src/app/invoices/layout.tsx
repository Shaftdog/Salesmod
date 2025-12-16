/**
 * Public Invoice Layout
 * This layout is used for public-facing invoice pages (no auth required)
 * It provides a clean layout without the app sidebar/header
 */

export default function PublicInvoiceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // No auth check - this is a public page
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
