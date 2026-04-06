
'use client';

import {
  Home,
  FileText,
  ShoppingBag,
  User,
  Calendar,
  PenSquare,
  DollarSign,
  LayoutGrid,
  Users,
  MoreHorizontal,
  ClipboardCheck,
  HandCoins,
  MapPinned,
  CalendarDays,
  Package,
  Bell,
  Clock,
  ClipboardList,
  Wallet,
  Boxes,
  Warehouse,
  Percent,
  CalendarCheck2,
  UserCheck as UserCheckIcon,
  LifeBuoy,
  Banknote,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';

const guestNav = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/therapists', label: 'Therapists', icon: Users },
  { href: '/shop', label: 'Shop', icon: ShoppingBag },
  { href: '/journal', label: 'Journal', icon: FileText },
  { href: '/auth/signin', label: 'Sign In', icon: User },
];

const patientNav = [
  { href: '/dashboard/patient/my-dashboard', label: 'Home', icon: Home },
  { href: '/book', label: 'Book', icon: MapPinned },
  { href: '/dashboard/patient/bookings', label: 'Bookings', icon: CalendarDays },
  { href: '/dashboard/patient/orders', label: 'Orders', icon: Package },
  { href: '/dashboard/patient/notifications', label: 'Alerts', icon: Bell, badgeCount: 2 },
];

const therapistNav = [
    { href: '/dashboard/therapist/my-dashboard', label: 'Home', icon: Home },
    { href: '/dashboard/therapist/schedule', label: 'Today', icon: Clock },
    { href: '/dashboard/therapist/pcr', label: 'PCRs', icon: ClipboardList },
    { href: '/dashboard/earnings', label: 'Earnings', icon: Wallet },
    { href: '/dashboard/new-post', label: 'Write', icon: PenSquare },
];

const ecomAdminNav = [
    { href: '/dashboard/ecom-admin/my-dashboard', label: 'Home', icon: Home },
    { href: '/dashboard/ecom-admin/products', label: 'Products', icon: Boxes },
    { href: '/dashboard/ecom-admin/orders', label: 'Orders', icon: Package },
    { href: '/dashboard/ecom-admin/inventory', label: 'Inventory', icon: Warehouse },
    { href: '/dashboard/ecom-admin/coupons', label: 'Coupons', icon: Percent },
];

const therapyAdminNav = [
    { href: '/dashboard/therapy-admin/my-dashboard', label: 'Home', icon: Home },
    { href: '/dashboard/therapy-admin/appointments', label: 'Appts', icon: CalendarCheck2 },
    { href: '/dashboard/therapy-admin/pcrs', label: 'PCRs', icon: ClipboardCheck },
    { href: '/dashboard/therapy-admin/profile-approvals', label: 'Approvals', icon: UserCheckIcon },
    { href: '/dashboard/therapy-admin/support-tickets', label: 'Support', icon: LifeBuoy },
];

const superAdminNav = [
    { href: '/dashboard/admin/my-dashboard', label: 'Home', icon: Home },
    { href: '/dashboard/admin/users', label: 'Users', icon: Users },
    { href: '/dashboard/admin/appointments', label: 'Bookings', icon: CalendarDays },
    { href: '/dashboard/admin/payouts', label: 'Payouts', icon: Banknote },
    { href: '/dashboard/admin/sos-alerts', label: 'SOS', icon: ShieldAlert, badgeCount: 1 },
];


export default function BottomNav() {
  const pathname = usePathname();
  const { user } = useAuth();

  const hideOnPages = ['/booking', '/checkout', '/pcr', '/tp/'];
  if (hideOnPages.some(page => pathname.startsWith(page))) {
    return null;
  }
  
  let navItems = guestNav; // Default for logged-out users
  if (user) {
    const roles = user.roles || [];
    if(roles.includes('admin.super')) navItems = superAdminNav;
    else if (roles.includes('admin.therapy')) navItems = therapyAdminNav;
    else if (roles.includes('admin.ecom')) navItems = ecomAdminNav;
    else if (roles.includes('therapist')) navItems = therapistNav;
    else navItems = patientNav; // Default for logged-in patients
  }


  return (
    <div className="lg:hidden fixed bottom-0 left-0 z-50 w-full h-16 bg-background/80 backdrop-blur-sm border-t no-print pb-[env(safe-area-inset-bottom)] shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="grid h-full grid-cols-5 mx-auto">
        {navItems.map(({ href, label, icon: Icon, badgeCount }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={label}
              href={href}
              className={cn(
                'relative inline-flex flex-col items-center justify-center px-1 text-center group transition-colors duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-primary/80'
              )}
              aria-label={label}
            >
              {isActive && (
                <div className="absolute top-0 h-0.5 w-8 bg-primary rounded-full transition-all" />
              )}
               <div className="relative">
                <Icon className={cn("w-6 h-6 transition-transform", isActive && 'scale-105')} strokeWidth={isActive ? 2.5 : 2} />
                {badgeCount && badgeCount > 0 && (
                    <Badge variant="destructive" className="absolute -top-1 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
                        {badgeCount}
                    </Badge>
                )}
               </div>
              <span className={cn(
                  "text-[10px] sm:text-[11px] font-semibold transition-all duration-200 mt-0.5 px-0.5 truncate w-full text-center",
                  isActive ? "opacity-100" : "opacity-90"
                )}>
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  );
}
