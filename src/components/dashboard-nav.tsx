

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
  FilePlus,
  User,
  Bell,
  Calendar,
  Sparkles,
  ClipboardPen,
  Users,
  ShoppingBag,
  UserCog,
  BookUser,
  Settings,
  Tags,
  ShieldAlert,
  Receipt,
  HandCoins,
  GraduationCap,
  BookCopy,
  Library,
  AreaChart,
  FileText,
  Clock,
  Send,
  UserCheck,
  BookOpen,
  Wallet,
  Home,
  MapPinned,
  CalendarDays,
  Package,
  Boxes,
  Warehouse,
  Percent,
  LifeBuoy,
  Banknote,
  CalendarCheck2,
  ClipboardCheck,
  Truck,
  RotateCcw,
  BookHeart,
  Briefcase,
  HeartPulse,
  ShoppingBasket,
  Lightbulb,
  KeyRound,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EcomAdminNav } from './nav/ecom-admin-nav';
import { TherapyAdminNav } from './nav/therapy-admin-nav';
import { Skeleton } from './ui/skeleton';
import { Badge } from './ui/badge';
import { listSosAlerts } from '@/lib/repos/alerts';
import { listSupportTickets } from '@/lib/repos/support';
import { listProfileChangeRequests } from '@/lib/repos/content';

const allNavItems = {
  patient: [
    { href: '/dashboard/patient/my-dashboard', label: 'My Dashboard', icon: AreaChart, exact: true },
    { href: '/dashboard/patient/bookings', label: 'My Bookings', icon: CalendarDays },
    { href: '/dashboard/patient/health-records', label: 'Health Records', icon: FileText },
    { href: '/dashboard/patient/invoices', label: 'Invoices', icon: Receipt },
    { href: '/dashboard/patient/orders', label: 'Shop Orders', icon: Package },
    { href: '/dashboard/patient/notifications', label: 'Notifications', icon: Bell },
    { href: '/dashboard/support', label: 'My Tickets', icon: Send },
    { href: '/dashboard/account', label: 'Account Settings', icon: UserCog },
    { href: '/dashboard/account/security', label: 'Security', icon: KeyRound },
  ],
  therapist: [
    { type: 'header', label: 'Core' },
    { href: '/dashboard/therapist/my-dashboard', label: 'My Dashboard', icon: AreaChart, exact: true },
    { href: '/dashboard/therapist/schedule', label: "Today's Schedule", icon: Clock },
    { href: '/dashboard/therapist/bookings', label: 'All Bookings', icon: Calendar },
    { href: '/dashboard/therapist/pcr', label: 'PCRs', icon: ClipboardPen },
    { href: '/dashboard/earnings', label: 'My Earnings', icon: Wallet },
    { href: '/dashboard/therapist/shipments', label: 'My Shipments', icon: Truck },
    { type: 'header', label: 'Journal' },
    { href: '/dashboard/journal/new', label: 'New Entry', icon: FilePlus },
    { href: '/dashboard/my-journal', label: 'My Entries', icon: BookOpen },
    { type: 'header', label: 'Training & Resources' },
    { href: '/dashboard/therapist/training', label: 'Training', icon: GraduationCap },
    { href: '/dashboard/therapist/training/sops', label: 'SOP Library', icon: BookCopy },
    { type: 'header', label: 'Account' },
    { href: '/dashboard/notifications', label: 'Notifications', icon: Bell },
    { href: '/dashboard/account', label: 'Profile Settings', icon: UserCog },
    { href: '/dashboard/account/security', label: 'Security', icon: KeyRound },
  ],
};

const superAdminRootNav = (activeAlertCount: number, openTicketCount: number, pendingApprovalsCount: number) => [
     { type: 'group', label: 'Team & Governance', icon: Users, items: [
        { href: '/dashboard/admin/team', label: 'Team Management', icon: Users },
        { href: '/dashboard/admin/profile-approvals', label: 'Profile Approvals', icon: UserCheck, badgeCount: pendingApprovalsCount },
    ]},
     { type: 'group', label: 'Content & Training', icon: BookCopy, items: [
        { href: '/dashboard/admin/journal', label: 'Journal Approvals', icon: UserCheck },
        { href: '/dashboard/journal/new', label: 'New Journal Entry', icon: FilePlus },
        { href: '/dashboard/admin/trainings', label: 'Trainings', icon: GraduationCap },
        { href: '/dashboard/admin/documentation', label: 'Documentation', icon: Library },
    ]},
    { type: 'group', label: 'Storefront', icon: ShoppingBasket, items: [
        { href: '/dashboard/admin/products', label: 'Products', icon: Boxes },
        { href: '/dashboard/admin/products/categories', label: 'Categories', icon: Tags },
    ]},
    { type: 'group', label: 'Sales', icon: HandCoins, items: [
        { href: '/dashboard/admin/orders', label: 'Orders', icon: ShoppingBag },
        { href: '/dashboard/admin/shipments', label: 'Shipments', icon: Truck },
        { href: '/dashboard/admin/returns', label: 'Returns', icon: RotateCcw },
    ]},
     { type: 'group', label: 'Marketing', icon: Lightbulb, items: [
        { href: '/dashboard/admin/coupons', label: 'Coupons', icon: Percent },
        { href: '/dashboard/admin/offers', label: 'Offers', icon: Percent },
    ]},
    { type: 'group', label: 'Therapy Operations', icon: Briefcase, items: [
        { href: '/dashboard/admin/appointments', label: 'Appointments', icon: CalendarCheck2 },
        { href: '/dashboard/admin/pcrs', label: 'All PCRs', icon: ClipboardCheck },
        { href: '/dashboard/admin/payouts', label: 'Payouts', icon: HandCoins },
    ]},
    { type: 'group', label: 'Reports', icon: FileText, items: [
      { href: '/dashboard/admin/reports/financials', label: 'Therapy Financials', icon: Banknote },
      { href: '/dashboard/admin/reports/ecom-financials', label: 'E-com Financials', icon: ShoppingBag },
    ]},
    { type: 'group', label: 'Platform', icon: Settings, items: [
        { href: '/dashboard/admin/users', label: 'User Management', icon: UserCog },
        { href: '/dashboard/admin/sos-alerts', label: 'SOS Alerts', icon: ShieldAlert, badgeCount: activeAlertCount },
        { href: '/dashboard/admin/support-tickets', label: 'Support Tickets', icon: Send, badgeCount: openTicketCount },
        { href: '/dashboard/admin/notifications', label: 'Notifications', icon: Bell },
        { href: '/dashboard/admin/ai', label: 'AI Settings', icon: Sparkles },
        { href: '/dashboard/admin/settings', label: 'Platform Settings', icon: Settings },
    ]},
];


const NavItemGroup = ({ group, checkActive, isActiveGroup }: { group: any; checkActive: (href?: string, exact?: boolean) => boolean; isActiveGroup: boolean }) => (
    <AccordionItem value={group.label} className="border-none">
        <AccordionTrigger 
            className={cn("p-2 rounded-md hover:bg-white/10 text-sm font-medium [&[data-state=open]>svg]:rotate-90", isActiveGroup && "bg-white/10")}
        >
            <div className="flex items-center gap-3">
                <group.icon className="w-5 h-5"/>
                <span>{group.label}</span>
            </div>
        </AccordionTrigger>
        <AccordionContent className="pl-4">
            <SidebarMenu>
                {group.items.map((subItem: any, subIndex: number) => (
                    <SidebarMenuItem key={subIndex}>
                        <Link href={subItem.href!}>
                            <SidebarMenuButton isActive={checkActive(subItem.href, subItem.exact)}>
                            <subItem.icon className="w-5 h-5"/>
                            <span className="flex-1">{subItem.label}</span>
                             {subItem.badgeCount > 0 && subItem.icon === ShieldAlert && <Badge variant="destructive" className="h-5">{subItem.badgeCount}</Badge>}
                             {subItem.badgeCount > 0 && subItem.icon !== ShieldAlert && <Badge className="bg-yellow-400 text-yellow-900 h-5">{subItem.badgeCount}</Badge>}
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </AccordionContent>
    </AccordionItem>
);


export function DashboardNav() {
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [activeAlertCount, setActiveAlertCount] = React.useState(0);
  const [openTicketCount, setOpenTicketCount] = React.useState(0);
  const [pendingApprovalsCount, setPendingApprovalsCount] = React.useState(0);
  
  const roles = user?.roles || [];
  const primaryRole = user?.role || 'patient';
  
  React.useEffect(() => {
    if (roles.includes('admin.super') || roles.includes('admin.therapy')) {
        const fetchData = async () => {
            const [alerts, tickets, approvals] = await Promise.all([
                listSosAlerts(),
                listSupportTickets({ status: 'open' }),
                listProfileChangeRequests()
            ]);
            setActiveAlertCount(alerts.filter(a => a.status === 'active').length);
            setOpenTicketCount(tickets.length);
            setPendingApprovalsCount(approvals.filter(r => r.status === 'pending').length);
        }
        fetchData();
    }
  }, [roles]);

  if (isLoading || !user) {
    return (
        <div className="space-y-4 p-4">
            {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full bg-white/10" />)}
        </div>
    )
  }

  const checkActive = (href?: string, exact?: boolean) => {
    if (!href) return false;
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };
  
  if (primaryRole === 'patient' || primaryRole === 'therapist') {
      const navItems = allNavItems[primaryRole as 'patient' | 'therapist'] || allNavItems.patient;
      return (
        <SidebarMenu>
        {navItems.map((item, index) => {
            if (item.type === 'header') {
                return (
                    <p key={index} className="text-xs font-semibold text-white/50 uppercase px-2 pt-4 pb-1">
                        {item.label}
                    </p>
                )
            }
            return (
                <SidebarMenuItem key={item.href}>
                <Link href={item.href!}>
                    <SidebarMenuButton
                    isActive={checkActive(item.href, (item as any).exact)}
                    >
                    <item.icon className="w-5 h-5"/>
                    <span>{item.label}</span>
                    </SidebarMenuButton>
                </Link>
                </SidebarMenuItem>
            );
        })}
        </SidebarMenu>
      )
  }

  // New Super Admin view
  if (roles.includes('admin.super')) {
      const navigationItems = superAdminRootNav(activeAlertCount, openTicketCount, pendingApprovalsCount);
      const activeGroup = navigationItems.find(group => group.items.some(item => checkActive(item.href)));
      return (
        <div className="space-y-4">
            <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/dashboard/admin/my-dashboard">
                        <SidebarMenuButton isActive={checkActive('/dashboard/admin/my-dashboard', true)}>
                            <AreaChart className="w-5 h-5"/>
                            <span>Super Admin Dashboard</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <Link href="/dashboard/ecom-admin/my-dashboard">
                        <SidebarMenuButton isActive={checkActive('/dashboard/ecom-admin/my-dashboard', true)}>
                            <ShoppingBag className="w-5 h-5"/>
                            <span>E-com Dashboard</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                 <SidebarMenuItem>
                    <Link href="/dashboard/therapy-admin/my-dashboard">
                        <SidebarMenuButton isActive={checkActive('/dashboard/therapy-admin/my-dashboard', true)}>
                            <HeartPulse className="w-5 h-5"/>
                            <span>Therapy Dashboard</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>

             <Accordion type="single" collapsible className="w-full space-y-1" defaultValue={activeGroup?.label}>
                {navigationItems.map((item, index) => (
                    <NavItemGroup key={index} group={item} checkActive={checkActive} isActiveGroup={item.label === activeGroup?.label} />
                ))}
            </Accordion>

             <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/dashboard/account">
                        <SidebarMenuButton isActive={checkActive('/dashboard/account', true)}>
                            <UserCog className="w-5 h-5"/>
                            <span>My Profile</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <Link href="/dashboard/account/security">
                        <SidebarMenuButton isActive={checkActive('/dashboard/account/security', true)}>
                            <KeyRound className="w-5 h-5"/>
                            <span>Security</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </div>
      )
  }

  if (roles.includes('admin.ecom')) {
      return <EcomAdminNav />;
  }

  if (roles.includes('admin.therapy')) {
      return <TherapyAdminNav />;
  }

  return null;
}
