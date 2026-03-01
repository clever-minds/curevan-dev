

'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  AreaChart,
  Users,
  HandCoins,
  UserCheck,
  ShieldAlert,
  GraduationCap,
  Library,
  BookCopy,
  Send,
  Sparkles,
  UserCog,
  BookOpen,
  CalendarCheck2,
  ClipboardCheck,
  LifeBuoy,
  Briefcase,
  Settings,
  FileText,
  Banknote,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { listSosAlerts } from '@/lib/repos/alerts';
import { listSupportTickets } from '@/lib/repos/support';

const therapyNavItems = (activeAlertCount: number, openTicketCount: number) => [
     { type: 'group', label: 'Therapy Operations', icon: Briefcase, items: [
        { href: '/dashboard/therapy-admin/appointments', label: 'Appointments', icon: CalendarCheck2 },
        { href: '/dashboard/admin/pcrs', label: 'All PCRs', icon: ClipboardCheck },
        { href: '/dashboard/therapy-admin/payouts', label: 'Payouts', icon: HandCoins },
    ]},
    { type: 'group', label: 'Team & Governance', icon: Users, items: [
        { href: '/dashboard/therapy-admin/users', label: 'Users & Therapists', icon: Users },
        { href: '/dashboard/therapy-admin/profile-approvals', label: 'Profile Approvals', icon: UserCheck },
        { href: '/dashboard/therapy-admin/sos-alerts', label: 'SOS Alerts', icon: ShieldAlert, badgeCount: activeAlertCount },
    ]},
     { type: 'group', label: 'Content & Training', icon: BookCopy, items: [
        { href: '/dashboard/admin/journal', label: 'Journal', icon: BookOpen },
        { href: '/dashboard/therapy-admin/trainings', label: 'Trainings', icon: GraduationCap },
        { href: '/dashboard/therapy-admin/documentation', label: 'Documentation', icon: Library },
    ]},
     { type: 'group', label: 'Reports', icon: FileText, items: [
      { href: '/dashboard/admin/reports/financials', label: 'Financial Report', icon: Banknote },
    ]},
    { type: 'group', label: 'System & Support', icon: Settings, items: [
        { href: '/dashboard/admin/support-tickets', label: 'Support Tickets', icon: Send, badgeCount: openTicketCount },
        { href: '/dashboard/therapy-admin/ai', label: 'AI Settings', icon: Sparkles },
    ]},
];


const NavItemGroup = ({ group, checkActive, isActiveGroup }: { group: any; checkActive: (href?: string, exact?: boolean) => boolean; isActiveGroup: boolean; }) => (
    <AccordionItem value={group.label} className="border-none">
        <AccordionTrigger className="p-2 rounded-md hover:bg-white/10 text-sm font-medium [&[data-state=open]>svg]:rotate-90">
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


export function TherapyAdminNav() {
    const pathname = usePathname();
    const [activeAlertCount, setActiveAlertCount] = React.useState(0);
    const [openTicketCount, setOpenTicketCount] = React.useState(0);

    React.useEffect(() => {
        const fetchData = async () => {
            const [alerts, tickets] = await Promise.all([
                listSosAlerts(),
                listSupportTickets({ status: 'open' })
            ]);
            setActiveAlertCount(alerts.filter(a => a.status === 'active').length);
            setOpenTicketCount(tickets.length);
        }
        fetchData();
    }, []);

    const checkActive = (href?: string, exact?: boolean) => {
        if (!href) return false;
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };
    
    const navigationItems = therapyNavItems(activeAlertCount, openTicketCount);
    const activeGroup = navigationItems.find(group => group.items.some(item => checkActive(item.href)));

    return (
        <div className="space-y-4">
            <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/dashboard/therapy-admin/my-dashboard">
                        <SidebarMenuButton isActive={checkActive('/dashboard/therapy-admin/my-dashboard', true)}>
                            <AreaChart className="w-5 h-5"/>
                            <span>Therapy Dashboard</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
            
            <Accordion type="single" collapsible className="w-full space-y-1" defaultValue={activeGroup?.label || "Therapy Operations"}>
                {navigationItems.map((item: any, index: number) => (
                    <NavItemGroup key={index} group={item} checkActive={checkActive} isActiveGroup={item.label === activeGroup?.label} />
                ))}
            </Accordion>

            <SidebarMenu>
                 <SidebarMenuItem>
                    <Link href="/dashboard/account">
                        <SidebarMenuButton isActive={checkActive('/dashboard/account')}>
                            <UserCog className="w-5 h-5"/>
                            <span>My Profile</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
        </div>
    )
}
