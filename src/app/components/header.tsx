
import Link from 'next/link';
import { Button } from './ui/button';
import Logo from './logo';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Sheet, SheetContent, SheetTrigger } from './ui/sheet';
import { Menu, User, Search, ShoppingCart, LogIn } from 'lucide-react';

const navLinks = [
    { href: '/about', label: 'About Us' },
    { href: '/services', label: 'Services' },
    { href: '/therapists', label: 'Therapists' },
    { href: '/ecommerce', label: 'Shop' },
    { href: '/journal', label: 'Journal' },
    { href: '/faq', label: 'FAQ' },
    { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const isLoggedIn = true; // This would be replaced with actual auth state

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-[var(--header-height)] max-w-screen-2xl items-center">
        <div className="mr-4 hidden lg:flex">
          <Link href="/" className="mr-6 flex items-center gap-2">
            <Logo />
            <div className="border-l pl-2 border-muted">
                <p className="font-semibold text-xs text-muted-foreground leading-tight">Cure. Anywhere.</p>
            </div>
          </Link>
          <nav className="flex items-center gap-6 text-sm">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground/80 text-foreground/60 font-semibold">
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Mobile Nav */}
        <div className="lg:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
                <Link href="/" className="mb-6">
                    <Logo />
                </Link>
                <div className="flex flex-col gap-4">
                    {navLinks.map(link => (
                      <Link key={link.href} href={link.href} className="transition-colors hover:text-foreground text-foreground/80 font-semibold text-lg">
                        {link.label}
                      </Link>
                    ))}
                </div>
            </SheetContent>
          </Sheet>
        </div>

         <div className="lg:hidden flex-1 justify-center flex">
            <Link href="/">
                <Logo />
            </Link>
        </div>


        <div className="flex flex-1 items-center justify-end gap-2">
            <Button variant="ghost" size="icon"><Search /></Button>
            <Button variant="ghost" size="icon"><ShoppingCart /></Button>
            
            {isLoggedIn ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src="https://placehold.co/100x100.png" alt="@user" data-ai-hint="user avatar" />
                      <AvatarFallback><User className="w-4 h-4"/></AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">Patient User</p>
                      <p className="text-xs leading-none text-muted-foreground">patient@example.com</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/dashboard/account"><DropdownMenuItem>My Account</DropdownMenuItem></Link>
                  <Link href="/dashboard/therapist"><DropdownMenuItem>My Bookings</DropdownMenuItem></Link>
                  <Link href="/support"><DropdownMenuItem>Support</DropdownMenuItem></Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Log Out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
                 <Button asChild variant="ghost">
                    <Link href="/auth/signup">
                        <LogIn className="mr-2"/>
                        Sign In
                    </Link>
                </Button>
            )}

           <Button asChild className="hidden sm:inline-flex bg-gradient-to-r from-[hsl(256,70%,48%)] to-[hsl(173,62%,44%)] text-white hover:opacity-90 transition-opacity">
              <Link href="/discover">Book Now</Link>
            </Button>
        </div>
      </div>
    </header>
  );
}
