import {
  LayoutDashboard, CalendarDays, FileText, BookOpen,
  Video, MessageSquare, Star, Newspaper, Settings, Users
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Bookings", url: "/admin/bookings", icon: CalendarDays },
  { title: "Applications", url: "/admin/applications", icon: FileText },
  { title: "Resources", url: "/admin/resources", icon: BookOpen },
  { title: "Webinars", url: "/admin/webinars", icon: Video },
  { title: "Webinar Registrations", url: "/admin/webinar-registrations", icon: Users },
  { title: "Testimonials", url: "/admin/testimonials", icon: Star },
  { title: "Pages", url: "/admin/pages", icon: Newspaper },
  { title: "Contacts", url: "/admin/contacts", icon: MessageSquare },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const AdminSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
};

export default AdminSidebar;
