
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FilterBar } from "@/components/admin/FilterBar";
import { Price } from "@/components/money/price";
import { useState, useEffect, useTransition } from "react";
import type { PayoutBatch, Therapist } from "@/lib/types";
import { listPayoutBatches } from "@/lib/repos/payouts";
import { listTherapists } from "@/lib/repos/therapists";
import { MoreHorizontal, FileDown, User, PauseCircle, PlayCircle } from "lucide-react";
import { getSafeDate, downloadCsv } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { updatePayoutBatchStatus } from "@/lib/actions/payouts";

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'paid':
            return 'bg-green-100 text-green-800';
        case 'processing':
            return 'bg-blue-100 text-blue-800';
        case 'draft':
            return 'bg-gray-200 text-gray-800';
        case 'onHold':
            return 'bg-yellow-100 text-yellow-800';
        default:
            return 'bg-gray-100 text-gray-800';
    }
}

const ActionsMenu = ({ payout, therapistName, onStatusChange }: { payout: PayoutBatch, therapistName: string, onStatusChange: () => void }) => {
    const { toast } = useToast();
    const [isPending, startTransition] = useTransition();

    const handleStatusUpdate = (newStatus: 'onHold' | 'processing') => {
        startTransition(async () => {
            const result = await updatePayoutBatchStatus(payout.id, newStatus);
            if (result.success) {
                toast({ title: "Status Updated", description: `Payout batch ${payout.id} has been ${newStatus === 'onHold' ? 'put on hold' : 'released for processing'}.` });
                onStatusChange(); // Trigger a refetch
            } else {
                toast({ variant: 'destructive', title: "Update Failed", description: result.error });
            }
        });
    }
    
    // Determine button disabled states based on status
    const canHold = payout.status === 'processing' || payout.status === 'draft';
    const canRelease = payout.status === 'onHold';
    const isActionable = canHold || canRelease;

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isPending}><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                    <Link href={`/therapists/${therapistName.toLowerCase().replace(/ /g, '-')}`}><User className="mr-2"/>View Therapist</Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem onClick={() => handleStatusUpdate('onHold')} disabled={!canHold || isPending}>
                    <PauseCircle className="mr-2"/>Hold Payment
                </DropdownMenuItem>

                <DropdownMenuItem onClick={() => handleStatusUpdate('processing')} disabled={!canRelease || isPending}>
                    <PlayCircle className="mr-2"/>Release Payment
                </DropdownMenuItem>

            </DropdownMenuContent>
        </DropdownMenu>
    )
}

export default function AdminPayoutsPage() {
    const [payouts, setPayouts] = useState<PayoutBatch[]>([]);
    const [therapists, setTherapists] = useState<Therapist[]>([]);
    const [filters, setFilters] = useState({});
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();

    const fetchPayouts = async () => {
        setLoading(true);
        const payoutData = await listPayoutBatches(filters);
        setPayouts(payoutData);
        setLoading(false);
    };

    useEffect(() => {
        const fetchTherapists = async () => {
            const therapistData = await listTherapists();
            setTherapists(therapistData);
        };
        fetchTherapists();
        fetchPayouts();
    }, [filters]);

    const getTherapistName = (id: string) => {
        return therapists.find(t => t.id === id)?.name || id;
    };

    const handleExport = async () => {
        toast({ title: "Exporting...", description: "Fetching all payout data..." });
        const allPayouts = await listPayoutBatches(); // Fetch all for a full export
        const data = allPayouts.map(payout => [
            payout.id,
            getSafeDate(payout.payoutDate)?.toLocaleDateString() || '',
            `${getSafeDate(payout.weekStart)?.toLocaleDateString()} - ${getSafeDate(payout.weekEnd)?.toLocaleDateString()}`,
            payout.therapistId,
            getTherapistName(payout.therapistId),
            payout.totals.gross,
            payout.totals.commission,
            payout.totals.penalties,
            payout.totals.net,
            payout.status,
            payout.payoutRef || '',
        ]);
        const headers = [
            "Batch ID", "Payout Date", "Period", "Therapist ID", "Therapist Name",
            "Gross (Paise)", "Commission (Paise)", "Penalties (Paise)", "Net (Paise)", "Status", "Reference #"
        ];
        downloadCsv(headers, data, 'all-payouts-export.csv');
        toast({ title: "Export Complete", description: `${allPayouts.length} payout batches exported.` });
    };

    return (
        <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold tracking-tight font-headline">Therapist Payouts</h1>
                <p className="text-muted-foreground">Monitor and manage therapist payout batches.</p>
            </div>
            <Button onClick={handleExport}><FileDown className="mr-2"/>Export All</Button>
        </div>

        <FilterBar 
            showDatePicker 
            showTherapyFilters 
            showAppointmentFilters // This now includes the therapist dropdown and status
            onFilterChange={setFilters} 
        />
        
        <Card>
            <CardHeader>
                <CardTitle>Payout Batches</CardTitle>
                <CardDescription>Weekly payout batches sent to therapists.</CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Payout Date</TableHead>
                            <TableHead>Period</TableHead>
                            <TableHead>Therapist</TableHead>
                            <TableHead>Gross</TableHead>
                            <TableHead>Net</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Reference #</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                    {loading ? (
                        <TableRow><TableCell colSpan={8}><Skeleton className="h-24 w-full" /></TableCell></TableRow>
                    ) : payouts.map((payout) => (
                        <TableRow key={payout.id}>
                            <TableCell>{getSafeDate(payout.payoutDate)?.toLocaleDateString()}</TableCell>
                            <TableCell>{`${getSafeDate(payout.weekStart)?.toLocaleDateString()} - ${getSafeDate(payout.weekEnd)?.toLocaleDateString()}`}</TableCell>
                            <TableCell>{getTherapistName(payout.therapistId)}</TableCell>
                            <TableCell><Price amount={payout.totals.gross / 100} showDecimals /></TableCell>
                            <TableCell className="font-semibold"><Price amount={payout.totals.net / 100} showDecimals /></TableCell>
                            <TableCell><Badge className={cn(getStatusBadgeClass(payout.status), "capitalize")}>{payout.status}</Badge></TableCell>
                            <TableCell className="font-mono text-xs">{payout.payoutRef}</TableCell>
                            <TableCell className="text-right">
                                <ActionsMenu payout={payout} therapistName={getTherapistName(payout.therapistId)} onStatusChange={fetchPayouts} />
                            </TableCell>
                        </TableRow>
                    ))}
                    {payouts.length === 0 && !loading && (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center h-24">No payouts found for the selected filters.</TableCell>
                        </TableRow>
                    )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
        </div>
    );
}
