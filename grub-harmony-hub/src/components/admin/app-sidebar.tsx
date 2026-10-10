import { Link, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  FileText,
  LayoutDashboard,
  LogOut,
  Receipt,
  Settings,
  UtensilsCrossed,
} from "lucide-react";
import { toast } from "sonner";
import { useLogout } from "@/hooks/useAuth";
import { useNavigate } from "@tanstack/react-router";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items: { title: string; url: string; icon: typeof Receipt; exact?: boolean }[] = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard, exact: true },
  { title: "Orders", url: "/admin/orders", icon: Receipt },
  { title: "Meals", url: "/admin/meals", icon: UtensilsCrossed },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Reports", url: "/admin/reports", icon: FileText },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const logoutMutation = useLogout();

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <Link to="/" className="flex items-center gap-3">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
            <UtensilsCrossed className="size-5" />
          </span>
          <span className="min-w-0 group-data-[collapsible=icon]:hidden">
            <span className="block truncate text-sm font-extrabold">
              Mukiria Cafeteria
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              Admin Portal
            </span>
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Manage</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => {
                const active = item.exact
                  ? pathname === item.url
                  : pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild
                      isActive={active}
                      tooltip={item.title}
                    >
                      <Link to={item.url as "/admin"} className="flex items-center gap-3">
                        <item.icon className="size-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <SidebarMenu>
            <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Logout"
              onClick={async () => {
                try {
                  await logoutMutation.mutateAsync();
                  toast.success("Logged out");
                  navigate({ to: "/admin/login" as any });
                } catch (err: any) {
                  toast.error(err?.response?.data?.message ?? "Logout failed");
                }
              }}
            >
              <LogOut className="size-4" />
              <span>Logout</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
