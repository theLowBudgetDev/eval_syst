
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader as CustomSidebarHeader, // Renamed to avoid conflict
  SidebarContent as CustomSidebarContent, // Renamed to avoid conflict
  SidebarFooter as CustomSidebarFooter, // Renamed to avoid conflict
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader as ShadSheetHeader,
  SheetTitle as ShadSheetTitle,
} from '@/components/ui/sheet';
import { Menu, Settings, LogOut } from 'lucide-react';
import { getNavLinks, type NavLink as NavLinkType } from '@/lib/navigation';
import type { UserRoleType } from '@/types';
import { DarkModeToggle } from '@/components/shared/DarkModeToggle';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function RenderNavLinks({ role, onLinkClick }: { role: UserRoleType | null, onLinkClick?: () => void }) {
  const navLinks = getNavLinks(role);
  const renderLinks = (links: NavLinkType[], isSubLink = false) => {
    return links.map((link) => (
      <SidebarMenuItem key={link.href}>
        <SidebarMenuButton
          asChild
          className={isSubLink ? "text-sm pl-10" : ""}
          tooltip={link.label}
          onClick={onLinkClick} // Close mobile sidebar on link click
        >
          <Link href={link.href}>
            <link.icon className="h-4 w-4" />
            <span>{link.label}</span>
            {link.badge && <span className="ml-auto inline-block px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">{link.badge}</span>}
          </Link>
        </SidebarMenuButton>
        {link.subLinks && link.subLinks.length > 0 && (
          <SidebarMenu className="pl-4">
            {renderLinks(link.subLinks, true)}
          </SidebarMenu>
        )}
      </SidebarMenuItem>
    ));
  };
  return <>{renderLinks(navLinks)}</>;
}

export default function AppContent({ children }: { children: React.ReactNode }) {
  const { user, logout, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileSheetOpen, setIsMobileSheetOpen] = React.useState(false);


  React.useEffect(() => {
    if (!isLoading && !user && pathname !== '/login') {
      router.push('/login');
    }
  }, [user, isLoading, router, pathname]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="space-y-4 w-64">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-8 w-1/2" />
        </div>
      </div>
    );
  }

  if (!user && pathname !== '/login') {
     return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="space-y-2 text-center">
          <p className="text-lg font-medium">Redirecting to login...</p>
          <Skeleton className="h-4 w-32 mx-auto" />
        </div>
      </div>
    );
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }
  
  const handleMobileLinkClick = () => {
    setIsMobileSheetOpen(false);
  };
  
  const settingsPath = user?.role === 'ADMIN' ? "/admin/settings" : "/my-profile";


  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={false}>
        <Sidebar collapsible="icon" className="hidden md:flex border-r border-sidebar-border">
          <CustomSidebarHeader className="p-4 flex items-center justify-center border-b border-sidebar-border">
             <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                <h1 className="text-xl font-bold font-headline tracking-tight group-data-[collapsible=icon]:hidden">EvalTrack</h1>
             </Link>
          </CustomSidebarHeader>
          <CustomSidebarContent className="p-2">
            <SidebarMenu>
              <RenderNavLinks role={user?.role || null} />
            </SidebarMenu>
          </CustomSidebarContent>
          <CustomSidebarFooter className="p-2 mt-auto border-t border-sidebar-border group-data-[collapsible=icon]:justify-center">
            <SidebarMenuButton className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:aspect-square" tooltip="Settings" asChild>
              <Link href={settingsPath}>
                  <Settings className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">Settings</span>
              </Link>
            </SidebarMenuButton>
          </CustomSidebarFooter>
        </Sidebar>

        {/* Main content area wrapper: Removed md:peer-data-[collapsible=icon]:ml-[var(--sidebar-width-icon)] */}
        <div className="flex flex-col flex-1 peer-data-[collapsible=offcanvas]:ml-0 transition-[margin-left] duration-300 ease-in-out">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur-sm px-4 md:px-6 justify-between">
            <div className="flex items-center gap-2">
              <Sheet open={isMobileSheetOpen} onOpenChange={setIsMobileSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open sidebar">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="left"
                  className="p-0 w-[var(--sidebar-width-mobile,280px)] flex flex-col bg-sidebar"
                  aria-label="Main Navigation Menu" 
                >
                  <ShadSheetHeader className="p-0"> 
                    <ShadSheetTitle className="sr-only">Main Navigation Menu</ShadSheetTitle>
                     <CustomSidebarHeader className="p-4 flex items-center justify-start border-b border-sidebar-border">
                        <Link href="/" className="flex items-center gap-2" onClick={handleMobileLinkClick}>
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-7 w-7 text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                          <h1 className="text-xl font-bold font-headline tracking-tight">EvalTrack</h1>
                        </Link>
                     </CustomSidebarHeader>
                  </ShadSheetHeader>
                   <CustomSidebarContent className="flex-1 p-2">
                      <SidebarMenu>
                        <RenderNavLinks role={user?.role || null} onLinkClick={handleMobileLinkClick} />
                      </SidebarMenu>
                   </CustomSidebarContent>
                    <CustomSidebarFooter className="p-2 mt-auto border-t border-sidebar-border">
                      <SidebarMenuButton tooltip="Settings" asChild onClick={handleMobileLinkClick}>
                          <Link href={settingsPath}>
                              <Settings className="h-4 w-4" />
                              <span>Settings</span>
                          </Link>
                      </SidebarMenuButton>
                  </CustomSidebarFooter>
                </SheetContent>
              </Sheet>
              <div className="hidden md:block">
                 <SidebarTrigger><Menu className="h-5 w-5" /></SidebarTrigger>
              </div>
            </div>

            <div className="flex items-center gap-1 md:gap-3">
              <DarkModeToggle />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" asChild>
                     <Link href="/my-profile">
                        <Avatar className="h-8 w-8"> {/* Adjusted size */}
                            <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || "User"} data-ai-hint="person face"/>
                            <AvatarFallback>{user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}</AvatarFallback>
                        </Avatar>
                        <span className="sr-only">My Profile</span>
                     </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>My Profile</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={logout} aria-label="Logout">
                    <LogOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Logout</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </header>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
             {children}
          </main>
        </div>
      </SidebarProvider>
    </TooltipProvider>
  );
}
