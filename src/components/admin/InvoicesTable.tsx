
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
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { MoreHorizontal, FileText, Download } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-is-mobile';
import { Price } from '../money/price';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import type { Invoice } from '@/lib/types';
import { listInvoices } from '@/lib/repos/content';
import { getSafeDate } from '@/lib/utils';

interface InvoicesTableProps {
  scope: 'admin' | 'patient';
  filters?: any;
}

const ActionsMenu = ({ invoice }: { invoice: Invoice }) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild><Link href={`/dashboard/invoices?id=${invoice.id}`} className="w-full flex items-center"><FileText className="mr-2"/>View Details</Link></DropdownMenuItem>
        <DropdownMenuItem><Download className="mr-2"/>Download PDF</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};


const InvoiceCard = ({ invoice }: { invoice: Invoice }) => (
    <Card>
        <CardContent className="p-4">
            <div className="flex justify-between items-start">
                <div>
                    <p className="font-bold font-mono">{invoice.invoiceNumber}</p>
                    <p className="text-sm text-muted-foreground">{getSafeDate(invoice.issuedAt)?.toLocaleDateString()}</p>
                </div>
                <Badge variant={invoice.status === 'cancelled' ? 'destructive' : 'secondary'}>{invoice.status}</Badge>
            </div>
            <div className="mt-4 space-y-1 text-sm">
                <p><strong>Customer:</strong> {invoice.userId}</p>
                <p><strong>Type:</strong> {invoice.source.orderId ? 'Goods' : 'Service'}</p>
                <p><strong>Amount:</strong> <Price amount={invoice.totalAmountPaise / 100} showDecimals /></p>
            </div>
            <div className="mt-4 flex justify-end">
                <Button asChild variant="outline" size="sm"><Link href={`/dashboard/invoices?id=${invoice.id}`}>View Invoice</Link></Button>
            </div>
        </CardContent>
    </Card>
);

export function InvoicesTable({ scope, filters = {} }: InvoicesTableProps) {
  const isMobile = useIsMobile();
  const [invoices, setInvoices] = React.useState<Invoice[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      const data = await listInvoices();
      setInvoices(data);
    };
    fetchData();
  }, [filters]);
  
  if (isMobile) {
      return (
          <div className="space-y-3">
              {invoices.map(invoice => <InvoiceCard key={invoice.id} invoice={invoice} />)}
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
                <TableHead>Invoice #</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-mono text-xs">{invoice.invoiceNumber}</TableCell>
                  <TableCell>{getSafeDate(invoice.issuedAt)?.toLocaleDateString()}</TableCell>
                  <TableCell><Badge variant="outline">{invoice.source.orderId ? 'Goods' : 'Service'}</Badge></TableCell>
                  <TableCell>{invoice.userId}</TableCell>
                  <TableCell><Badge variant={invoice.status === 'cancelled' ? 'destructive' : 'secondary'}>{invoice.status}</Badge></TableCell>
                  <TableCell className="text-right"><Price amount={invoice.totalAmountPaise / 100} showDecimals /></TableCell>
                  <TableCell className="text-right">
                    <ActionsMenu invoice={invoice} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
