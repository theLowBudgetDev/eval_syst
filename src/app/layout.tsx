import type { Metadata } from 'next';
import Link from 'next/link';
import { Inter } from 'next/font/google'; 
import './globals.css';
import { ThemeProvider } from '@/lib/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarHeader, 
  SidebarContent, 
  SidebarFooter, 
  SidebarMenu, 
  SidebarMenuItem, 
  SidebarMenuButton, 
  SidebarInset,
  SidebarTrigger
} from "@/components/ui/sidebar";
import { DarkModeToggle } from '@/components/shared/DarkModeToggle';
import { navLinks, type NavLink as NavLinkType } from '@/lib/navigation';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu, SettingsIcon } from 'lucide-react';

export const metadata: Metadata = {
  title: 'EvalTrack - Performance Management',
  description: 'Efficiently track and manage employee performance.',
};

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

// Helper to render navigation links, supports one level of sub-links
function renderNavLinks(links: NavLinkType[], isSubLink = false) {
  return links.map((link) => (
    <SidebarMenuItem key={link.href}>
      <SidebarMenuButton 
        asChild 
        className={isSubLink ? "text-sm pl-10" : ""}
        tooltip={link.label} // Tooltip for collapsed icon-only sidebar
      >
        <Link href={link.href}>
          <link.icon className="h-4 w-4" />
          <span>{link.label}</span>
          {link.badge && <span className="ml-auto inline-block px-2 py-0.5 text-xs font-medium bg-primary/20 text-primary rounded-full">{link.badge}</span>}
        </Link>
      </SidebarMenuButton>
      {link.subLinks && link.subLinks.length > 0 && (
        <SidebarMenu className="pl-4">
          {renderNavLinks(link.subLinks, true)}
        </SidebarMenu>
      )}
    </SidebarMenuItem>
  ));
}


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`${inter.variable} font-body antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <SidebarProvider defaultOpen={true}>
            <Sidebar collapsible="icon" className="hidden md:flex">
              <SidebarHeader className="p-4 flex items-center justify-center">
                 <Link href="/" className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                    <h1 className="text-xl font-semibold font-headline group-data-[collapsible=icon]:hidden">EvalTrack</h1>
                 </Link>
              </SidebarHeader>
              <SidebarContent>
                <SidebarMenu>
                  {renderNavLinks(navLinks)}
                </SidebarMenu>
              </SidebarContent>
              <SidebarFooter className="p-2 group-data-[collapsible=icon]:justify-center">
                {/* Example footer item */}
                <SidebarMenuButton className="group-data-[collapsible=icon]:w-full group-data-[collapsible=icon]:aspect-square" tooltip="Settings">
                  <SettingsIcon className="h-4 w-4" /> 
                  <span className="group-data-[collapsible=icon]:hidden">Settings</span>
                </SidebarMenuButton>
              </SidebarFooter>
            </Sidebar>
            
            <div className="flex flex-col flex-1 md:peer-data-[collapsible=icon]:ml-[var(--sidebar-width-icon)] peer-data-[collapsible=offcanvas]:ml-0 transition-[margin-left] duration-300 ease-in-out">
              <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 md:px-6 justify-between">
                <div className="flex items-center gap-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="md:hidden" aria-label="Open sidebar">
                        <Menu className="h-5 w-5" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-0 w-[var(--sidebar-width-mobile,280px)] flex flex-col">
                       <SidebarHeader className="p-4 flex items-center justify-start">
                          <Link href="/" className="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6 text-primary"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><polyline points="16 11 18 13 22 9"/></svg>
                            <h1 className="text-xl font-semibold font-headline">EvalTrack</h1>
                          </Link>
                       </SidebarHeader>
                       <SidebarContent className="flex-1">
                          <SidebarMenu>
                            {renderNavLinks(navLinks)}
                          </SidebarMenu>
                       </SidebarContent>
                    </SheetContent>
                  </Sheet>
                  <div className="hidden md:block">
                     <SidebarTrigger><Menu className="h-5 w-5" /></SidebarTrigger>
                  </div>
                </div>
                
                {/* Page Title placeholder. This could be managed with context or route inspection. */}
                {/* <h2 className="text-lg font-semibold">Dashboard</h2> */}

                <div className="flex items-center gap-4">
                  <DarkModeToggle />
                  <Avatar>
                    <AvatarImage src="https://placehold.co/40x40.png" alt="User Avatar" data-ai-hint="man face" />
                    <AvatarFallback>JD</AvatarFallback>
                  </Avatar>
                </div>
              </header>
              <main className="flex-1 p-4 sm:p-6 lg:p-8 bg-muted/30">
                 {children}
              </main>
            </div>
          </SidebarProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
