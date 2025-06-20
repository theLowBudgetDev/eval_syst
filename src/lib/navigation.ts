
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, ClipboardList, LineChart, UserCheck, Settings, Bell, LogIn, UserCog } from "lucide-react";
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
    href: "/login",
    label: "Login",
    icon: LogIn,
    roles: [], 
  },
];


export function getNavLinks(role: UserRoleType | null | undefined): NavLink[] {
  if (!role) {
    return allNavLinks.filter(link => link.href === '/login');
  }
  return allNavLinks.filter(link => {
    return !link.roles || link.roles.length === 0 || link.roles.includes(role);
  }).filter(link => link.href !== '/login'); 
}
