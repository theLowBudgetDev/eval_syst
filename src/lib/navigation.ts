
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, ClipboardList, LineChart, UserCheck, Settings, Bell, LogIn, UserCog } from "lucide-react"; // Changed SettingsIcon to Settings
import type { UserRole } from "@/contexts/AuthContext";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  subLinks?: NavLink[];
  roles?: UserRole[]; // Roles that can see this link
}

const allNavLinks: NavLink[] = [
  {
    href: "/", // Admin dashboard
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["admin"],
  },
  {
    href: "/supervisor-dashboard",
    label: "My Dashboard",
    icon: LayoutDashboard,
    roles: ["supervisor"],
  },
  {
    href: "/employee-dashboard",
    label: "My Dashboard",
    icon: LayoutDashboard,
    roles: ["employee"],
  },
  {
    href: "/employees",
    label: "Employee Records",
    icon: Users,
    roles: ["admin", "supervisor"], // Supervisors might see their team
  },
  {
    href: "/my-profile", 
    label: "My Profile",
    icon: UserCog,
    roles: ["employee", "supervisor"], // Supervisors can also view/edit their profile
  },
  {
    href: "/evaluations",
    label: "Evaluations",
    icon: ClipboardList,
    roles: ["admin", "supervisor"],
  },
   {
    href: "/my-evaluations", 
    label: "My Evaluations",
    icon: ClipboardList,
    roles: ["employee"],
  },
  {
    href: "/progress",
    label: "Progress Monitor",
    icon: LineChart,
    roles: ["admin", "supervisor"],
  },
  {
    href: "/my-progress", 
    label: "My Progress",
    icon: LineChart,
    roles: ["employee"],
  },
  {
    href: "/assignments",
    label: "Supervisor Assignments",
    icon: UserCheck,
    roles: ["admin"], // Only admin can assign supervisors
  },
  {
    href: "/messaging",
    label: "Auto Messaging",
    icon: Bell,
    roles: ["admin"],
  },
  // Settings link is now handled by the footer button in AppContent.tsx based on role
  // {
  //   href: "/admin/settings",
  //   label: "Admin Settings",
  //   icon: Settings,
  //   roles: ["admin"],
  // },
  {
    href: "/login",
    label: "Login",
    icon: LogIn,
    roles: [], // Represents a public link, or handle separately
  },
];


export function getNavLinks(role: UserRole | null | undefined): NavLink[] {
  if (!role) {
    // Show only login if not authenticated, or handle as needed
    return allNavLinks.filter(link => link.href === '/login');
  }
  return allNavLinks.filter(link => {
    // Show link if it has no specific roles defined (public) or if user's role is included
    return !link.roles || link.roles.length === 0 || link.roles.includes(role);
  }).filter(link => link.href !== '/login'); // Don't show login link if authenticated
}
