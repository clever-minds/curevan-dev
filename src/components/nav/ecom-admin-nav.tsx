
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
  ShoppingBag,
  Tags,
  Truck,
  RotateCcw,
  Percent,
  Send,
  Sparkles,
  UserCog,
  Boxes,
  Warehouse,
  BookOpen,
  Settings,
  ShoppingBasket,
  Lightbulb,
  FileText,
  GraduationCap,
  Library,
} from 'lucide-react';
import { Badge } from '../ui/badge';
import { listSupportTickets } from '@/lib/repos/support';

const ecomNavItems = (openTicketCount: number) => [
    { type: 'group', label: 'Storefront', icon: ShoppingBasket, items: [
        { href: '/dashboard/ecom-admin/products', label: 'Products', icon: Boxes },
        { href: '/dashboard/admin/products/categories', label: 'Categories', icon: Tags },
    ]},
    { type: 'group', label: 'Sales', icon: ShoppingBag, items: [
        { href: '/dashboard/ecom-admin/orders', label: 'Orders', icon: ShoppingBag },
        { href: '/dashboard/ecom-admin/shipments', label: 'Shipments', icon: Truck },
        { href: '/dashboard/ecom-admin/returns', label: 'Returns', icon: RotateCcw },
    ]},
    { type: 'group', label: 'Marketing', icon: Lightbulb, items: [
        { href: '/dashboard/ecom-admin/coupons', label: 'Coupons', icon: Percent },
    ]},
    { type: 'group', label: 'Operations', icon: Warehouse, items: [
        { href: '/dashboard/ecom-admin/inventory', label: 'Inventory', icon: Warehouse },
    ]},
    { type: 'group', label: 'Reports', icon: FileText, items: [
        { href: '/dashboard/admin/reports/ecom-financials', label: 'Financial Report', icon: ShoppingBag },
    ]},
    { type: 'group', label: 'System', icon: Settings, items: [
        { href: '/dashboard/admin/journal', label: 'Journal', icon: BookOpen },
        { href: '/dashboard/therapy-admin/trainings', label: 'Trainings', icon: GraduationCap },
        { href: '/dashboard/therapy-admin/documentation', label: 'Documentation', icon: Library },
        { href: '/dashboard/admin/support-tickets', label: 'Support Tickets', icon: Send, badgeCount: openTicketCount },
        { href: '/dashboard/ecom-admin/ai', label: 'AI Settings', icon: Sparkles },
    ]}
];


const NavItemGroup = ({ group, checkActive }: { group: any; checkActive: (href?: string, exact?: boolean) => boolean; }) => (
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
                             {subItem.badgeCount > 0 && <Badge className="bg-yellow-400 text-yellow-900 h-5">{subItem.badgeCount}</Badge>}
                            </SidebarMenuButton>
                        </Link>
                    </SidebarMenuItem>
                ))}
            </SidebarMenu>
        </AccordionContent>
    </AccordionItem>
);


export function EcomAdminNav() {
    const pathname = usePathname();
    const [openTicketCount, setOpenTicketCount] = React.useState(0);
    
    React.useEffect(() => {
        const fetchTickets = async () => {
            const tickets = await listSupportTickets({ status: 'open' });
            setOpenTicketCount(tickets.length);
        };
        fetchTickets();
    }, []);

    const checkActive = (href?: string, exact?: boolean) => {
        if (!href) return false;
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };

    const navigationItems = ecomNavItems(openTicketCount);
    const activeGroup = navigationItems.find(group => group.items.some(item => checkActive(item.href)));

    return (
        <div className="space-y-4">
            <SidebarMenu>
                <SidebarMenuItem>
                    <Link href="/dashboard/ecom-admin/my-dashboard">
                        <SidebarMenuButton isActive={checkActive('/dashboard/ecom-admin/my-dashboard', true)}>
                            <AreaChart className="w-5 h-5"/>
                            <span>E-com Dashboard</span>
                        </SidebarMenuButton>
                    </Link>
                </SidebarMenuItem>
            </SidebarMenu>
            
            <Accordion type="single" collapsible className="w-full space-y-1" defaultValue={activeGroup?.label || "Sales"}>
                {navigationItems.map((item: any, index: number) => (
                    <NavItemGroup key={index} group={item} checkActive={checkActive} />
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
