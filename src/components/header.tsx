'use client';

import Link from 'next/link';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, User, Search, ShoppingCart, LogIn, Mail, Phone, Facebook, Instagram, Linkedin, Youtube, ShieldAlert } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { useCart } from '@/context/cart-context';
import { CartSheet } from './ecommerce/cart-sheet';
import Logo from './logo';
import { resolveMyDashboardHref } from '@/lib/resolveDashboard';
import { Badge } from './ui/badge';
import type { SOSAlert } from '@/lib/types';
import { listSosAlerts } from '@/lib/repos/alerts';


const navLinks = [
    { href: '/about', label: 'About Us' },
    { href: '/therapists', label: 'Therapists' },
    { href: '/shop', label: 'Shop' },
    { href: '/journal', label: 'Journal' },
    { href: '/contact', label: 'Contact' },
];

const XLogo = () => (
    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.931L18.901 1.153zm-1.61 19.932h2.5l-10.8-12.076H7.13l10.16 12.076z" />
    </svg>
);

const LogoWithText = () => (
     <Link href="/" className="group flex items-center gap-2 no-underline">
        <Logo />
        <div className="flex flex-col items-start justify-center leading-none min-w-0">
            <span className="font-bold text-lg md:text-xl whitespace-nowrap text-primary">Curevan</span>
            <span className="font-semibold text-xs whitespace-nowrap text-accent">Cure. Anywhere.</span>
        </div>
     </Link>
  );

export default function Header() {
  const { user, logout } = useAuth();
  const { cart } = useCart();
  const router = useRouter();
  const [showTopBar, setShowTopBar] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const [isClient, setIsClient] = useState(false);
  const [activeAlertCount, setActiveAlertCount] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const isAdmin = user?.roles?.includes('admin.super') || user?.roles?.includes('admin.therapy');

  useEffect(() => {
    if (isAdmin) {
      const fetchAlerts = async () => {
        const alerts = await listSosAlerts();
        const activeAlerts = alerts.filter(a => a.status === 'active');
        setActiveAlertCount(activeAlerts.length);
      };
      fetchAlerts();
      // Optionally, set up a listener for real-time updates
    }
  }, [isAdmin]);


  const handleLogout = () => {
    logout();
    router.push('/');
  }

  useEffect(() => {
    let lastScrollY = window.scrollY;
    
    const handleScroll = () => {
      if (window.scrollY === 0) {
        setShowTopBar(true);
      } else if (window.scrollY > lastScrollY) {
        setShowTopBar(false);
      }
      lastScrollY = window.scrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 pt-[env(safe-area-inset-top)]">
      <div className={cn(
          "bg-animated-gradient text-white transition-all duration-300",
          showTopBar ? "h-10 opacity-100" : "h-0 opacity-0 overflow-hidden"
          )}>
        <div className="container hidden h-full max-w-screen-2xl items-center justify-between lg:flex">
            <div className="flex items-center gap-6 text-sm font-medium">
              <a href="mailto:care@curevan.com" className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
                <span>care@curevan.com</span>
              </a>
              <a href="tel:+917990602143" className="flex items-center gap-2 text-white/90 hover:text-white transition-colors">
                <Phone className="w-5 h-5" />
                <span>+91 79 9060 2143</span>
              </a>
            </div>
             <div className="flex items-center gap-4">
                <Link href="#" aria-label="Facebook" className="text-white/90 hover:text-white"><Facebook className="w-5 h-5"/></Link>
                <Link href="#" aria-label="X" className="text-white/90 hover:text-white"><XLogo/></Link>
                <Link href="#" aria-label="Instagram" className="text-white/90 hover:text-white"><Instagram className="w-5 h-5"/></Link>
                <Link href="#" aria-label="LinkedIn" className="text-white/90 hover:text-white"><Linkedin className="w-5 h-5"/></Link>
                <Link href="#" aria-label="YouTube" className="text-white/90 hover:text-white"><Youtube className="w-5 h-5"/></Link>
            </div>
        </div>
      </div>
      <div className="container flex h-[var(--header-height)] max-w-screen-2xl items-center border-b">
        <div className="mr-4 hidden lg:flex">
          <div className="mr-6">
            <LogoWithText />
          </div>
          <nav className="flex items-center gap-6 text-sm">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className={cn(
                  "transition-colors hover:text-primary font-semibold",
                  pathname === link.href ? "text-primary" : "text-foreground/80"
                )}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Nav */}
        <div className="flex items-center justify-between w-full lg:hidden">
            <div className="flex items-center gap-2">
                <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" aria-label="Toggle Menu">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left">
                      <div className="mb-6"><LogoWithText /></div>
                      <div className="flex flex-col gap-4">
                          {navLinks.map(link => (
                            <Link key={link.href} href={link.href} onClick={() => setIsMobileMenuOpen(false)} className="transition-colors hover:text-foreground text-foreground/80 font-semibold text-lg">
                              {link.label}
                            </Link>
                          ))}
                           <div className="border-t pt-4 space-y-4">
                              <a href="mailto:care@curevan.com" className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors font-semibold text-lg">
                                <Mail className="w-5 h-5" />
                                <span>care@curevan.com</span>
                              </a>
                              <a href="tel:+917990602143" className="flex items-center gap-2 text-foreground/80 hover:text-foreground transition-colors font-semibold text-lg">
                                <Phone className="w-5 h-5" />
                                <span>+91 79 9060 2143</span>
                              </a>
                          </div>
                      </div>
                  </SheetContent>
                </Sheet>
                <div className="md:hidden"><LogoWithText /></div>
            </div>

            <div className="hidden md:block"><LogoWithText /></div>

            <div className="flex items-center justify-end gap-0">
              <Button variant="ghost" size="icon" aria-label="Search"><Search /></Button>
              
              {user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative" aria-label="User Menu">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src="https://placehold.co/100x100.png" alt={user?.name || 'User'} data-ai-hint="user avatar" />
                        <AvatarFallback><User className="w-4 h-4"/></AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href={resolveMyDashboardHref(user?.roles)}><DropdownMenuItem>My Dashboard</DropdownMenuItem></Link>
                    <Link href="/dashboard/notifications"><DropdownMenuItem>Notifications</DropdownMenuItem></Link>
                    <Link href="/dashboard/support"><DropdownMenuItem>Support</DropdownMenuItem></Link>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>Log Out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                   <Button asChild variant="ghost" size="icon" aria-label="Sign In">
                      <Link href="/auth/signin">
                          <LogIn />
                      </Link>
                  </Button>
              )}
            </div>
        </div>

        <div className="hidden lg:flex flex-1 items-center justify-end gap-2">
            <Button variant="ghost" size="icon" aria-label="Search"><Search /></Button>
            
            <CartSheet>
                <Button variant="ghost" size="icon" aria-label="Shopping Cart" className="relative">
                    <ShoppingCart />
                    {isClient && cart.length > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                            {cart.length}
                        </span>
                    )}
                </Button>
            </CartSheet>

            {isAdmin && activeAlertCount > 0 && (
                <Button variant="ghost" size="icon" asChild className="relative">
                    <Link href="/dashboard/admin/sos-alerts" aria-label="SOS Alerts">
                        <ShieldAlert className="text-destructive" />
                        <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                            {activeAlertCount}
                        </Badge>
                    </Link>
                </Button>
            )}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full" aria-label="User Menu">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://placehold.co/100x100.png" alt={user?.name || 'User'} data-ai-hint="user avatar" />
                      <AvatarFallback><User className="w-4 h-4"/></AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href={resolveMyDashboardHref(user.roles)}><DropdownMenuItem>My Dashboard</DropdownMenuItem></Link>
                  <Link href="/dashboard/notifications"><DropdownMenuItem>Notifications</DropdownMenuItem></Link>
                  <Link href="/dashboard/support"><DropdownMenuItem>Support</DropdownMenuItem></Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>Log Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
                 <Button asChild>
                    <Link href="/auth/signin">
                        <LogIn className="mr-2"/>
                        Sign In
                    </Link>
                </Button>
            )}

           <Button asChild className="hidden sm:inline-flex bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] text-white hover:opacity-90 transition-opacity">
              <Link href="/book">Book Now</Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
