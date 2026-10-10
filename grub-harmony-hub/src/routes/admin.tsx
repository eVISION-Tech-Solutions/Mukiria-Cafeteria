import {
  createFileRoute,
  Outlet,
  redirect,
  useRouter,
} from "@tanstack/react-router";
import { Bell, Moon, Sun } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "@/components/admin/app-sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useApp } from "@/lib/app-store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin Portal — Mukiria Technical Cafeteria" },
      {
        name: "description",
        content:
          "Manage cafeteria orders, meals, analytics and reports for Mukiria Technical Training Institute.",
      },
      { property: "og:title", content: "Admin Portal — Mukiria Cafeteria" },
      {
        property: "og:description",
        content: "Manage orders, meals, analytics and reports.",
      },
    ],
  }),
  beforeLoad: ({ location }) => {
    const isLoginPath = location.pathname === "/admin/login";
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem("access_token");
    if (!token && !isLoginPath) {
      throw redirect({ to: "/admin/login" });
    }
  },
  component: AdminLayout,
});

function AdminLayout() {
  const { theme, toggleTheme } = useApp();
  const router = useRouter();
  const isLoginPath = router.state.location.pathname === "/admin/login";

  if (isLoginPath) {
    return <Outlet />;
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-dvh w-full">
        <AdminSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/85 px-4 backdrop-blur-lg">
            <SidebarTrigger aria-label="Toggle sidebar" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">
                Mukiria Technical Cafeteria
              </p>
              <p className="truncate text-xs text-muted-foreground">
                Staff dashboard
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11 rounded-full"
              aria-label="Toggle theme"
              onClick={toggleTheme}
            >
              {theme === "light" ? (
                <Moon className="size-5" />
              ) : (
                <Sun className="size-5" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="relative min-h-11 min-w-11 rounded-full"
              aria-label="Notifications"
            >
              <Bell className="size-5" />
              <span className="absolute top-2.5 right-2.5 size-2 rounded-full bg-accent" />
            </Button>
            <Avatar className="size-9">
              <AvatarFallback className="bg-primary text-primary-foreground">
                EM
              </AvatarFallback>
            </Avatar>
          </header>
          <main className="min-w-0 flex-1 p-4 sm:p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
