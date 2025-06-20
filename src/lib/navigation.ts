import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Users, ClipboardList, LineChart, UserCheck, SettingsIcon, Bell } from "lucide-react";

export interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  subLinks?: NavLink[];
}

export const navLinks: NavLink[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/employees",
    label: "Employee Records",
    icon: Users,
  },
  {
    href: "/evaluations",
    label: "Evaluations",
    icon: ClipboardList,
    // Example with badge and sublinks
    // badge: "New",
    // subLinks: [
    //   { href: "/evaluations/criteria", label: "Criteria", icon: ListChecks },
    //   { href: "/evaluations/scores", label: "Scores", icon: Star },
    // ],
  },
  {
    href: "/progress",
    label: "Progress Monitor",
    icon: LineChart,
  },
  {
    href: "/assignments",
    label: "Supervisor Assignments",
    icon: UserCheck,
  },
  {
    href: "/messaging",
    label: "Auto Messaging",
    icon: Bell,
  },
  {
    href: "/admin/settings",
    label: "Admin Settings",
    icon: SettingsIcon,
  },
];
