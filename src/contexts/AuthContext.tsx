
"use client";

import type { Employee } from "@/types";
import * as React from "react";
import { useRouter } from "next/navigation";

export type UserRole = "admin" | "supervisor" | "employee";

export interface AuthUser extends Employee {
  role: UserRole;
}

interface AuthContextType {
  user: AuthUser | null;
  login: (user: AuthUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Mock users for simulation
const mockAuthUsers: AuthUser[] = [
  { id: "admin01", name: "Admin User", email: "admin@example.com", department: "IT", position: "System Admin", hireDate: "2020-01-01", role: "admin", avatarUrl: "https://placehold.co/100x100.png?text=AU" },
  { id: "sup01", name: "Supervisor Sam", email: "supervisor@example.com", department: "Engineering", position: "Team Lead", hireDate: "2019-05-10", role: "supervisor", avatarUrl: "https://placehold.co/100x100.png?text=SS" },
  { id: "emp01", name: "Employee Eve", email: "employee@example.com", department: "Marketing", position: "Specialist", hireDate: "2022-03-15", role: "employee", supervisorId: "sup01", avatarUrl: "https://placehold.co/100x100.png?text=EE" },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    // Simulate checking for a logged-in user (e.g., from localStorage)
    const storedUser = localStorage.getItem("evaltrackUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AuthUser;
        if (parsedUser && parsedUser.role) { // Basic validation
            setUser(parsedUser);
        } else {
            localStorage.removeItem("evaltrackUser"); // Clear invalid stored user
        }
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("evaltrackUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (loggedInUser: AuthUser) => {
    setUser(loggedInUser);
    localStorage.setItem("evaltrackUser", JSON.stringify(loggedInUser));
    // Redirect based on role
    if (loggedInUser.role === "admin") {
      router.push("/");
    } else if (loggedInUser.role === "supervisor") {
      router.push("/supervisor-dashboard");
    } else {
      router.push("/employee-dashboard");
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("evaltrackUser");
    router.push("/login");
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

export { mockAuthUsers }; // Exporting for login page
