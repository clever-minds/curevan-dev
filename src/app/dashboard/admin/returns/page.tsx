

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { FilterBar } from "@/components/admin/FilterBar";
import { ReturnsTable } from "@/components/admin/ReturnsTable";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { listReturns } from "@/lib/repos/returns";
import { downloadCsv, getSafeDate } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export const dynamic = 'force-dynamic';

export default function AdminReturnsPage() {
  const [filters, setFilters] = useState({});
  const { toast } = useToast();

  const handleExport = async () => {
    toast({ title: 'Exporting...', description: 'Fetching all returns data.' });
    const allReturns = await listReturns();
    const headers = [
      "RMA ID", "Order ID", "Created At", "Customer Name", "City/State",
      "Reason", "Method", "Status", "Refund Status", "Total Refund Amount",
      "Items SKU", "Items Name", "Items Qty"
    ];
    
    const data = allReturns.map(r => [
        r.id,
        r.orderId,
        getSafeDate(r.createdAt)?.toISOString() || '',
        r.customerName,
        r.cityState,
        r.reason,
        r.method,
        r.status,
        r.refundStatus,
        r.totalRefundAmount,
        r.items.map(i => i.sku).join('; '),
        r.items.map(i => i.name).join('; '),
        r.items.map(i => i.qty).join('; '),
    ]);

    downloadCsv(headers, data, 'returns-export-all.csv');
    toast({ title: 'Export Complete!', description: `${allReturns.length} return records exported.` });
  };


  return (
    <div className="space-y-6">
       <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-bold tracking-tight font-headline">Manage Returns</h1>
            <p className="text-muted-foreground">Review and process customer return requests.</p>
        </div>
        <Button onClick={handleExport}><FileDown className="mr-2"/>Export All</Button>
      </div>
      
       <FilterBar
            showDatePicker={true}
            showLocationFilters={true}
            showSearch={true}
            showEcomFilters={true}
            onFilterChange={setFilters}
        />
        
      <ReturnsTable scope="admin" filters={filters} />
    </div>
  );
}
