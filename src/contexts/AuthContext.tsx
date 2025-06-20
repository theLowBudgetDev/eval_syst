
"use client";

import type { AppUser, UserRoleType } from "@/types";
import * as React from "react";
import { useRouter, usePathname } from "next/navigation";

export interface AuthContextType {
  user: AppUser | null;
  login: (user: AppUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Mock users for initial seeding and potentially for type reference if needed elsewhere
// Password field is not part of AppUser type sent to client, but needed for seed.
export const mockAuthUsers: Array<Omit<AppUser, 'password'> & { plainTextPassword?: string }> = [
  { id: "admin01", name: "Admin User", email: "admin@example.com", department: "IT", position: "System Admin", hireDate: "2020-01-01", role: "ADMIN", avatarUrl: "https://placehold.co/100x100.png?text=AU", plainTextPassword: "password123" },
  { id: "sup01", name: "Supervisor Sam", email: "supervisor@example.com", department: "Engineering", position: "Team Lead", hireDate: "2019-05-10", role: "SUPERVISOR", avatarUrl: "https://placehold.co/100x100.png?text=SS", plainTextPassword: "password123" },
  { id: "emp01", name: "Employee Eve", email: "employee@example.com", department: "Marketing", position: "Specialist", hireDate: "2022-03-15", role: "EMPLOYEE", supervisorId: "sup01", avatarUrl: "https://placehold.co/100x100.png?text=EE", plainTextPassword: "password123" },
];

// This part is mostly for the seed script's convenience for setting up supervisor relations
mockAuthUsers.forEach(u => {
  if (u.supervisorId && u.role === 'EMPLOYEE') {
    const supervisor = mockAuthUsers.find(sup => sup.id === u.supervisorId);
    if (supervisor) {
      u.supervisor = supervisor as AppUser; // Cast as AppUser for the structure, password won't be there
    }
  }
});


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const storedUser = localStorage.getItem("evaltrackUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AppUser;
        if (parsedUser && parsedUser.id && parsedUser.role &&
            ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'].includes(parsedUser.role)) {
            setUser(parsedUser);
        } else {
            localStorage.removeItem("evaltrackUser");
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("evaltrackUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (loggedInUser: AppUser) => {
    setUser(loggedInUser);
    localStorage.setItem("evaltrackUser", JSON.stringify(loggedInUser));

    // Redirect based on role
    // Ensure pathname check to avoid redirect loop if already on target dashboard
    if (loggedInUser.role === "ADMIN" && pathname !== "/") {
      router.push("/");
    } else if (loggedInUser.role === "SUPERVISOR" && pathname !== "/supervisor-dashboard") {
      router.push("/supervisor-dashboard");
    } else if (loggedInUser.role === "EMPLOYEE" && pathname !== "/employee-dashboard") {
      router.push("/employee-dashboard");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("evaltrackUser");
    if (pathname !== "/login") {
        router.push("/login");
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// mockAuthUsers is primarily for the seed script now.
// It's not directly used for login by the client anymore.
export { mockAuthUsers };
