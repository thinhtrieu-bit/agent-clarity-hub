import { Bell, Bot, Home, Mail, MessageSquareText, Settings2, Workflow } from "lucide-react";
import { Outlet, useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NavLink } from "@/components/NavLink";

const navigationItems = [
  { to: "/", label: "Overview", icon: Home },
  { to: "/agents", label: "Agents", icon: Bot },
  { to: "/tasks", label: "Tasks", icon: Workflow },
  { to: "/conversations", label: "Comms", icon: MessageSquareText },
  { to: "/emails", label: "Emails", icon: Mail },
  { to: "/settings", label: "Settings", icon: Settings2 },
];

export default function DashboardLayout() {
  const location = useLocation();

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" variant="inset">
        <SidebarHeader className="px-3 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Bell className="h-4 w-4" />
            </div>
            <div className="group-data-[collapsible=icon]:hidden">
              <p className="text-sm font-semibold text-sidebar-foreground">Agent Clarity Hub</p>
              <p className="text-xs text-sidebar-foreground/70">Monitoring Dashboard</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigationItems.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to);
                  return (
                    <SidebarMenuItem key={item.to}>
                      <SidebarMenuButton asChild isActive={isActive} tooltip={item.label}>
                        <NavLink to={item.to}>
                          <Icon />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur-sm">
          <div className="flex h-14 items-center gap-3 px-4 md:px-6">
            <SidebarTrigger />
            <div>
              <h1 className="text-sm font-semibold text-foreground md:text-base">Agent Monitoring Dashboard</h1>
              <p className="text-xs text-muted-foreground">Real-time pipeline and integration activity</p>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
