
"use client";

import type { AppUser, UserRoleType } from "@/types"; // Updated import
import * as React from "react";
import { useRouter } from "next/navigation";

// UserRoleType is now imported from @/types

export interface AuthContextType {
  user: AppUser | null;
  login: (user: AppUser) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

// Mock users for simulation - roles are now UPPERCASE
export const mockAuthUsers: AppUser[] = [
  { id: "admin01", name: "Admin User", email: "admin@example.com", department: "IT", position: "System Admin", hireDate: "2020-01-01", role: "ADMIN", avatarUrl: "https://placehold.co/100x100.png?text=AU" },
  { id: "sup01", name: "Supervisor Sam", email: "supervisor@example.com", department: "Engineering", position: "Team Lead", hireDate: "2019-05-10", role: "SUPERVISOR", avatarUrl: "https://placehold.co/100x100.png?text=SS" },
  { id: "emp01", name: "Employee Eve", email: "employee@example.com", department: "Marketing", position: "Specialist", hireDate: "2022-03-15", role: "EMPLOYEE", supervisorId: "sup01", avatarUrl: "https://placehold.co/100x100.png?text=EE" },
];

// Helper to find mock supervisor name for initial mock data context (if needed, though API should provide this)
mockAuthUsers.forEach(u => {
  if (u.supervisorId && u.role === 'EMPLOYEE') {
    const supervisor = mockAuthUsers.find(sup => sup.id === u.supervisorId);
    if (supervisor) {
      // For mock data consistency, we'd populate the nested supervisor object
      // This is more for the initial state of AuthContext if it relies on mockAuthUsers directly for complex objects
      // In a real app, the user object from login API would have this.
      u.supervisor = supervisor;
    }
  }
});


export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();

  React.useEffect(() => {
    const storedUser = localStorage.getItem("evaltrackUser");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser) as AppUser;
        // Basic validation: check for id and role (now uppercase)
        if (parsedUser && parsedUser.id && parsedUser.role && 
            ['ADMIN', 'SUPERVISOR', 'EMPLOYEE'].includes(parsedUser.role)) {
            setUser(parsedUser);
        } else {
            console.warn("Invalid stored user data, clearing.");
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
    // Redirect based on role (uppercase)
    if (loggedInUser.role === "ADMIN") {
      router.push("/");
    } else if (loggedInUser.role === "SUPERVISOR") {
      router.push("/supervisor-dashboard");
    } else { // EMPLOYEE
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

export { mockAuthUsers }; // Exporting for login page or initial seeding if needed
