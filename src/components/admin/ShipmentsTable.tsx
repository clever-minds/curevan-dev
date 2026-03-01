
'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Package, Receipt, Truck, Undo, Ban, MessageCircle, FileDown, Printer, MapPin, FileText } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Price } from '../money/price';
import { cn } from '@/lib/utils';
import type { Shipment } from '@/lib/types';
import { Checkbox } from '../ui/checkbox';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import Link from 'next/link';
import { listShipments } from '@/lib/repos/shipments';

interface ShipmentsTableProps {
  scope: 'admin' | 'ecom-admin' | 'therapist';
  filters?: any;
}

const getStatusBadgeVariant = (status?: Shipment['status']) => {
  switch (status) {
    case 'Pending Pickup':
    case 'In Transit':
        return 'bg-blue-100 text-blue-800';
    case 'Out for Delivery':
    case 'Delivered':
        return 'bg-green-100 text-green-800';
    case 'NDR':
    case 'RTO':
        return 'bg-yellow-100 text-yellow-800';
    case 'Cancelled':
        return 'bg-red-100 text-red-800';
    default:
        return 'secondary';
  }
};

const getSafeDate = (date: any): Date | null => {
    if (!date) return null;
    if (date instanceof Date) return date;
    if (typeof date === 'string') return new Date(date);
    if (typeof date === 'object' && date._seconds) {
        return new Date(date._seconds * 1000);
    }
    return null;
}

const ActionsMenu = ({ shipment, scope, asSheetItems = false }: { shipment: Shipment, scope: ShipmentsTableProps['scope'], asSheetItems?: boolean }) => {
  const isAdmin = scope === 'admin' || scope === 'ecom-admin';

  const content = (
    <>
      <DropdownMenuItem><Package className="mr-2" />View Details</DropdownMenuItem>
      <DropdownMenuItem asChild><Link href={`/dashboard/invoices?id=INV-${shipment.orderId}`} className="flex items-center"><FileText className="mr-2"/>View Invoice</Link></DropdownMenuItem>
      {isAdmin && <DropdownMenuItem><Printer className="mr-2" />Print Label</DropdownMenuItem>}
      <DropdownMenuItem><Truck className="mr-2" />Track on Carrier Site</DropdownMenuItem>
      
      {isAdmin && (
        <>
            <DropdownMenuItem className="text-red-600 focus:text-red-700"><Ban className="mr-2" />Cancel Shipment</DropdownMenuItem>
        </>
      )}
      {scope === 'therapist' && <DropdownMenuItem><MessageCircle className="mr-2" />Contact Support</DropdownMenuItem>}
    </>
  );

  if (asSheetItems) {
    return (
      <Sheet>
        <SheetTrigger asChild>
           <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-auto">
          <SheetHeader>
            <SheetTitle>Shipment #{shipment.id}</SheetTitle>
            <SheetDescription>Select an action to perform for this shipment.</SheetDescription>
          </SheetHeader>
          <div className="py-4 space-y-2">
             <Button variant="outline" className="w-full justify-start"><Package className="mr-2" />View Details</Button>
             <Button variant="outline" className="w-full justify-start" asChild><Link href={`/dashboard/invoices?id=INV-${shipment.orderId}`}><FileText className="mr-2"/>View Invoice</Link></Button>
             {isAdmin && <Button variant="outline" className="w-full justify-start"><Printer className="mr-2" />Print Label</Button>}
             <Button variant="outline" className="w-full justify-start"><Truck className="mr-2" />Track on Carrier Site</Button>
             {isAdmin && <Button variant="destructive" className="w-full justify-start"><Ban className="mr-2" />Cancel Shipment</Button>}
             {scope === 'therapist' && <Button variant="outline" className="w-full justify-start"><MessageCircle className="mr-2" />Contact Support</Button>}
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">{content}</DropdownMenuContent>
    </DropdownMenu>
  );
};


const ShipmentCard = ({ shipment, scope }: { shipment: Shipment, scope: ShipmentsTableProps['scope'] }) => {
    const eta = getSafeDate(shipment.eta);

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex justify-between items-start">
                    <div>
                        <p className="font-bold">#{shipment.id}</p>
                        <p className="text-sm text-muted-foreground">{shipment.awb}</p>
                    </div>
                    <Badge className={cn(getStatusBadgeVariant(shipment.status))} variant="secondary">{shipment.status}</Badge>
                </div>
                <div className="mt-4 space-y-1 text-sm">
                    <p><strong>Customer:</strong> {shipment.customerName}</p>
                    <p><strong>Location:</strong> {shipment.cityState}</p>
                    <p><strong>Carrier:</strong> {shipment.carrier}</p>
                    <p><strong>ETA:</strong> {eta ? eta.toLocaleDateString() : 'N/A'}</p>
                </div>
                <div className="mt-4 flex justify-end">
                    <ActionsMenu shipment={shipment} scope={scope} asSheetItems />
                </div>
            </CardContent>
        </Card>
    );
}

export function ShipmentsTable({ scope, filters = {} }: ShipmentsTableProps) {
  const [shipments, setShipments] = React.useState<Shipment[]>([]);
  const isMobile = useIsMobile();
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchShipments = async () => {
        setLoading(true);
        const data = await listShipments(filters);
        setShipments(data);
        setLoading(false);
    };
    fetchShipments();
  }, [filters]);

  const filteredShipments = React.useMemo(() => {
    // In a real app, this filtering would happen server-side via `filters` prop
    return shipments;
  }, [shipments, filters]);

  if (isMobile) {
      return (
          <div className="space-y-3">
              {filteredShipments.map(shipment => <ShipmentCard key={shipment.id} shipment={shipment} scope={scope} />)}
          </div>
      )
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]"><Checkbox /></TableHead>
                <TableHead>Shipment #</TableHead>
                <TableHead>AWB</TableHead>
                <TableHead>Order #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>City/State</TableHead>
                <TableHead>Carrier</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>ETA/SLA</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredShipments.map((shipment) => {
                const createdAt = getSafeDate(shipment.createdAt);
                const eta = getSafeDate(shipment.eta);
                return (
                <TableRow key={shipment.id}>
                  <TableCell><Checkbox /></TableCell>
                  <TableCell className="font-mono text-xs">{shipment.id}</TableCell>
                  <TableCell className="font-mono text-xs">{shipment.awb}</TableCell>
                  <TableCell className="font-mono text-xs">{shipment.orderId}</TableCell>
                  <TableCell>{createdAt ? createdAt.toLocaleDateString() : 'N/A'}</TableCell>
                  <TableCell className="font-medium">{shipment.customerName}</TableCell>
                  <TableCell>{shipment.cityState}</TableCell>
                  <TableCell>{shipment.carrier}</TableCell>
                  <TableCell><Badge className={cn(getStatusBadgeVariant(shipment.status))} variant="secondary">{shipment.status}</Badge></TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                        <span>{eta ? eta.toLocaleDateString() : 'N/A'}</span>
                        <Badge variant={shipment.slaBreached ? 'destructive' : 'outline'} className="w-fit">{shipment.slaBreached ? 'Delayed' : 'On-time'}</Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <ActionsMenu shipment={shipment} scope={scope} />
                  </TableCell>
                </TableRow>
              )})}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
