
"use client";

import * as React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader as CustomSidebarHeader,
  SidebarContent as CustomSidebarContent,
  SidebarFooter as CustomSidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  useSidebar
} from "@/components/ui/sidebar";
import { Button, buttonVariants } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader as ShadSheetHeader,
  SheetTitle as ShadSheetTitle,
} from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Menu, LogOut } from 'lucide-react';
import { getNavLinks, type NavLink as NavLinkType } from '@/lib/navigation';
import type { UserRoleType, AppUser } from '@/types';
import { DarkModeToggle } from '@/components/shared/DarkModeToggle';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { LoadingIndicator } from '@/components/shared/LoadingIndicator';
import { useNotifications } from '@/hooks/use-notifications';
import { NotificationBell } from '@/components/shared/NotificationBell';

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

// Define LayoutRenderer as a separate component function
function LayoutRenderer({
  user,
  logout,
  isMobileSheetOpen,
  setIsMobileSheetOpen,
  children
}: {
  user: AppUser | null,
  logout: () => void,
  isMobileSheetOpen: boolean,
  setIsMobileSheetOpen: (open: boolean) => void,
  children: React.ReactNode
}) {
  const sidebarContext = useSidebar(); // Called safely within SidebarProvider's context
  const { notifications, unreadCount, markAllAsRead } = useNotifications(user);


  const handleMobileLinkClick = () => {
    setIsMobileSheetOpen(false);
  };

  return (
    <>
      <Sidebar collapsible="icon" className="hidden md:flex border-r border-sidebar-border">
        <CustomSidebarHeader className="p-4 h-16 flex items-center justify-center border-b border-sidebar-border">
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
        <CustomSidebarFooter className="p-2 mt-auto border-t border-sidebar-border">
          <div className="flex items-center gap-x-2 w-full group-data-[collapsible=icon]:justify-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/my-profile" className="flex-shrink-0">
                  <Avatar className="h-7 w-7 group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8">
                    <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || "User"} />
                    <AvatarFallback>{user?.name ? user.name.substring(0, 1).toUpperCase() : "U"}</AvatarFallback>
                  </Avatar>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" align="center" hidden={sidebarContext.state !== "collapsed" || sidebarContext.isMobile}>
                <p>{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </TooltipContent>
            </Tooltip>
            <div className="group-data-[collapsible=icon]:hidden flex-1 min-w-0">
              <p className="text-sm font-medium text-sidebar-foreground truncate" title={user?.name}>{user?.name}</p>
              <p className="text-xs text-sidebar-foreground/70 truncate" title={user?.email}>{user?.email}</p>
            </div>
          </div>
        </CustomSidebarFooter>
      </Sidebar>

      <div className="flex flex-col flex-1 md:peer-data-[state=expanded]:peer-data-[variant!=inset]:ml-[var(--sidebar-width)] peer-data-[state=collapsed]:peer-data-[variant!=inset]:ml-[var(--sidebar-width-icon)] transition-[margin-left] duration-200 ease-linear">
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
                   <CustomSidebarHeader className="p-4 h-16 flex items-center justify-start border-b border-sidebar-border">
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
                     <Link href="/my-profile" className="flex items-center gap-2 p-1 rounded-md hover:bg-sidebar-accent" onClick={handleMobileLinkClick}>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user?.avatarUrl || undefined} alt={user?.name || "User"} />
                          <AvatarFallback>{user?.name ? user.name.substring(0, 2).toUpperCase() : "U"}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-sidebar-foreground truncate" title={user?.name}>{user?.name}</p>
                          <p className="text-xs text-sidebar-foreground/70 truncate" title={user?.email}>{user?.email}</p>
                        </div>
                      </Link>
                  </CustomSidebarFooter>
              </SheetContent>
            </Sheet>
            <div className="hidden md:block">
               <SidebarTrigger />
            </div>
          </div>

          <div className="flex items-center gap-1 md:gap-3">
            <DarkModeToggle />
            <NotificationBell 
              notifications={notifications}
              unreadCount={unreadCount}
              onOpen={markAllAsRead}
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" asChild>
                   <Link href="/my-profile">
                      <Avatar className="h-8 w-8">
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
            <AlertDialog>
              <Tooltip>
                  <TooltipTrigger asChild>
                      <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label="Logout">
                              <LogOut className="h-4 w-4" />
                          </Button>
                      </AlertDialogTrigger>
                  </TooltipTrigger>
                  <TooltipContent>
                      <p>Logout</p>
                  </TooltipContent>
              </Tooltip>
              <AlertDialogContent>
                  <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure you want to logout?</AlertDialogTitle>
                      <AlertDialogDescription>
                          You will be returned to the login page and your current session will be ended.
                      </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={logout} className={buttonVariants({ variant: "destructive" })}>Logout</AlertDialogAction>
                  </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-background">
           {children}
        </main>
      </div>
    </>
  );
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
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <LoadingIndicator text="Loading Application..." />
      </div>
    );
  }

  if (!user && pathname !== '/login') {
     return (
      <div className="flex flex-col items-center justify-center h-screen bg-background">
        <LoadingIndicator text="Redirecting to login..." />
      </div>
     );
  }

  if (pathname === '/login') {
    return <>{children}</>;
  }

  if (!user) {
    return null;
  }

  return (
    <TooltipProvider>
      <SidebarProvider defaultOpen={false}> {/* Sidebar closed by default */}
        <LayoutRenderer
          user={user}
          logout={logout}
          isMobileSheetOpen={isMobileSheetOpen}
          setIsMobileSheetOpen={setIsMobileSheetOpen}
        >
          {children}
        </LayoutRenderer>
      </SidebarProvider>
    </TooltipProvider>
  );
}
