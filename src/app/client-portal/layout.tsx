import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ClientPortalNav from "./client-portal-nav";

export default async function ClientPortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side auth check - happens before any rendering
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Load tenant info server-side
  const { data: profile } = await supabase
    .from("profiles")
    .select("tenant_id, tenants(name, type)")
    .eq("id", user.id)
    .single();

  const tenant = profile?.tenants || null;

  return (
    <div className="min-h-screen bg-background">
      <ClientPortalNav user={user} tenant={tenant} />
      <main>{children}</main>
      {/* Footer */}
      <footer className="border-t mt-auto">
        <div className="container py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Salesmod. All rights reserved.
            </p>
            <div className="flex gap-4 text-sm text-muted-foreground">
              <a href="/client-portal/help" className="hover:text-foreground">
                Help Center
              </a>
              <a href="/client-portal/privacy" className="hover:text-foreground">
                Privacy Policy
              </a>
              <a href="/client-portal/terms" className="hover:text-foreground">
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
