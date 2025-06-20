
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, ClipboardList, LineChart, UserCheck, Settings, Bell, LogIn, UserCog, Target } from "lucide-react";
import type { UserRoleType } from "@/types"; // Using UserRoleType from types

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  subLinks?: NavLink[];
  roles?: UserRoleType[]; // Roles that can see this link (uppercase)
}

const allNavLinks: NavLink[] = [
  {
    href: "/", // Admin dashboard
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN"],
  },
  {
    href: "/supervisor-dashboard",
    label: "My Dashboard",
    icon: LayoutDashboard,
    roles: ["SUPERVISOR"],
  },
  {
    href: "/employee-dashboard",
    label: "My Dashboard",
    icon: LayoutDashboard,
    roles: ["EMPLOYEE"],
  },
  {
    href: "/employees",
    label: "Employee Records",
    icon: Users,
    roles: ["ADMIN", "SUPERVISOR"], 
  },
  {
    href: "/my-profile", 
    label: "My Profile",
    icon: UserCog,
    roles: ["EMPLOYEE", "SUPERVISOR", "ADMIN"], // All roles can view their profile
  },
  {
    href: "/evaluations",
    label: "Evaluations",
    icon: ClipboardList,
    roles: ["ADMIN", "SUPERVISOR"],
  },
   {
    href: "/my-evaluations", 
    label: "My Evaluations",
    icon: ClipboardList,
    roles: ["EMPLOYEE"],
  },
  {
    href: "/progress",
    label: "Progress Monitor",
    icon: LineChart,
    roles: ["ADMIN", "SUPERVISOR"],
  },
  {
    href: "/my-progress", 
    label: "My Progress",
    icon: LineChart,
    roles: ["EMPLOYEE"],
  },
  {
    href: "/goals",
    label: "Goals",
    icon: Target,
    roles: ["ADMIN", "SUPERVISOR", "EMPLOYEE"],
  },
  {
    href: "/assignments",
    label: "Supervisor Assignments",
    icon: UserCheck,
    roles: ["ADMIN"], 
  },
  {
    href: "/messaging",
    label: "Auto Messaging",
    icon: Bell,
    roles: ["ADMIN"],
  },
  {
    href: "/admin/settings", // Changed from /settings to /admin/settings to be more specific
    label: "Admin Settings",
    icon: Settings,
    roles: ["ADMIN"],
  },
  {
    href: "/login",
    label: "Login",
    icon: LogIn,
    roles: [], 
  },
];


export function getNavLinks(role: UserRoleType | null | undefined): NavLink[] {
  if (!role) {
    // For logged-out users, only show the login link if it's defined
    return allNavLinks.filter(link => link.href === '/login');
  }
  // For logged-in users, filter by role and exclude the login link
  return allNavLinks.filter(link => {
    // Show link if no roles are specified OR if the user's role is included
    return (link.roles && link.roles.includes(role)) || (link.roles && link.roles.length === 0 && link.href !== '/login');
  }).filter(link => link.href !== '/login'); // Ensure login link is not shown to authenticated users
}
