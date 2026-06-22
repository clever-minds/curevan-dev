'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DollarSign,
  Users,
  Calendar,
  TrendingUp,
  HandCoins,
  Hourglass,
  Banknote,
  GitCompareArrows,
  AlertCircle,
  FileDown,
  Info,
  Copy,
  QrCode,
  Share2,
  Loader2,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import { getNextPayoutDate, fetchEarningsData, EarningsData } from "@/services/earnings-service";
import { useMemo, useState, useEffect } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Price } from "@/components/money/price";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from "next/link";
import { getTherapistById } from "@/lib/repos/therapists";
import { listOrders } from "@/lib/repos/orders";
import type { Therapist, Order } from '@/lib/types';


const SectionPills = () => (
    <div className="lg:hidden sticky top-[var(--header-height)] z-10 bg-background/90 backdrop-blur-sm py-2 mb-4 -mx-4 px-4 border-b">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <Button asChild variant="outline" size="sm" className="shrink-0"><a href="#overview">Overview</a></Button>
            <Button asChild variant="outline" size="sm" className="shrink-0"><a href="#this-week">This Week</a></Button>
            <Button asChild variant="outline" size="sm" className="shrink-0"><a href="#wallet">Wallet</a></Button>
            <Button asChild variant="outline" size="sm" className="shrink-0"><a href="#history">History</a></Button>
            <Button asChild variant="outline" size="sm" className="shrink-0"><a href="#eligibility">Eligibility</a></Button>
        </div>
    </div>
)


export default function EarningsPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const nextPayoutDate = getNextPayoutDate();
  const [filterType, setFilterType] = useState<'all' | 'service' | 'product'>('all');
  const [therapist, setTherapist] = useState<Therapist | null>(null);
  const [referralOrders, setReferralOrders] = useState<Order[]>([]);
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        setIsLoading(true);
        const [therapistData, eData] = await Promise.all([
            getTherapistById(user.id),
            fetchEarningsData(user.id)
        ]);
        
        setTherapist(therapistData);
        setEarningsData(eData);

        if (therapistData?.referralCode) {
          const orderData = await listOrders({ couponCode: therapistData.referralCode });
          setReferralOrders(orderData);
        }
      } catch (error) {
        console.error("Failed to load earnings data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const filteredHistory = useMemo(() => {
      if (!earningsData?.earningsHistory) return [];
      if (filterType === 'all') return earningsData.earningsHistory;
      return earningsData.earningsHistory.filter(item => item.type === filterType);
  }, [filterType, earningsData]);
  

  const handleCopyCode = () => {
    const referralCode = therapist?.referralCode;
    if (!referralCode) return;
    navigator.clipboard.writeText(referralCode);
    toast({
        title: "Code Copied!",
        description: `Your referral code ${referralCode} is ready to be shared.`
    })
  }

  if (isLoading) {
      return (
          <div className="flex justify-center items-center h-96">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
      );
  }

  const isPremium = therapist?.membershipPlan === 'premium';
  const platformFeePct = isPremium ? (therapist?.platformFeePct || 0.1) * 100 : 0;

  const includedBookings = earningsData?.earningsHistory?.filter(e => e.status === 'Payout Scheduled') || [];
  const excludedBookings = earningsData?.earningsHistory?.filter(e => e.status === 'On-Hold') || [];

  const totalPayoutBalance = includedBookings.reduce((sum, item) => sum + item.netPayable, 0);
  const totalOnHold = excludedBookings.reduce((sum, item) => sum + item.netPayable, 0);

  return (
    <div className="space-y-8">
      {/* --- Referral Banner --- */}
        <Alert className="bg-primary/5 border-primary/20">
            <Info className="h-4 w-4" />
            <AlertTitle className="font-semibold">Boost Your Earnings!</AlertTitle>
            <AlertDescription>
                Increase your earnings by sharing this referral code with your patients. They will receive a 5% discount, and you will earn a 10% referral fee on every purchase.
            </AlertDescription>
        </Alert>

      {/* --- Sticky Header --- */}
      <Card className="sticky top-[calc(var(--header-height)+1rem)] z-20 shadow-md">
          <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                  <Badge variant="outline" className={cn("text-base p-2", isPremium ? "border-green-500 bg-green-50 text-green-700" : "border-gray-300 bg-gray-50 text-gray-700")}>
                      {isPremium ? `Premium Plan (${platformFeePct}% Fee)` : "Standard Plan (0% Fee)"}
                  </Badge>
                  <p className="text-sm text-muted-foreground hidden md:block">
                      Next Payout: <strong className="text-primary">{nextPayoutDate}</strong>
                  </p>
              </div>
              <div className="flex items-center gap-x-6 gap-y-2 flex-wrap">
                  <div className="text-center md:text-right">
                    <p className="text-sm font-medium text-muted-foreground">Payout Balance</p>
                    <p className="text-xl font-bold text-green-600"><Price amount={totalPayoutBalance} showDecimals /></p>
                  </div>
                   <div className="text-center md:text-right">
                    <p className="text-sm font-medium text-muted-foreground">On-Hold</p>
                    <p className="text-xl font-bold"><Price amount={totalOnHold} showDecimals /></p>
                  </div>
              </div>
               <div className="w-full sm:w-auto">
                 <Select defaultValue="mtd">
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="mtd">Month-to-Date</SelectItem>
                        <SelectItem value="last7">Last 7 Days</SelectItem>
                        <SelectItem value="last30">Last 30 Days</SelectItem>
                    </SelectContent>
                </Select>
            </div>
          </CardContent>
      </Card>
      
      <SectionPills />

      {/* --- Section 1: Overview --- */}
      <section id="overview" className="scroll-mt-32">
        <h2 className="text-2xl font-bold font-headline mb-4">Overview</h2>
        <div className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
             <Card>
              <CardHeader>
                <CardTitle>Share Your Code</CardTitle>
                <CardDescription>Patients get 5% off products, you get 10% commission.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                 <div className="flex items-center justify-between p-4 pt-0 border rounded-md">
                    <span className="font-mono text-lg font-bold">{therapist?.referralCode || "N/A"}</span>
                    <div className="flex items-center">
                        <Button size="icon" variant="ghost" onClick={handleCopyCode}><Copy className="w-4 h-4"/></Button>
                        <Button size="icon" variant="ghost"><Share2 className="w-4 h-4"/></Button>
                        <Button size="icon" variant="ghost"><QrCode className="w-4 h-4"/></Button>
                    </div>
                </div>
                <Button className="w-full" asChild><Link href={`/ecommerce?ref=${therapist?.referralCode}`}>Open Shop</Link></Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Service Earnings</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold"><Price amount={earningsData?.summary?.totalServices || 0} /></div></CardContent>
            </Card>
             <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Product Commissions</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-bold"><Price amount={earningsData?.summary?.totalProducts || 0} /></div></CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-7">
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Daily Net Earnings (Last 30d)</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                <ResponsiveContainer width="100%" height={300}>
                   <LineChart data={earningsData?.dailyEarningsData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#888888" fontSize={12} tickFormatter={(val) => new Date(val).toLocaleDateString('en-US', { day: 'numeric', month: 'short' })} tickLine={false} axisLine={false}/>
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip formatter={(value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(value)} />
                    <Line type="monotone" dataKey="net" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="md:col-span-3">
              <CardHeader>
                <CardTitle>Session Mode Split</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                        <Pie data={earningsData?.modeSplitData || []} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} label>
                             {(earningsData?.modeSplitData || []).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.fill} />
                            ))}
                        </Pie>
                        <Tooltip />
                         <Legend />
                    </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
            <Card className="bg-muted/50 border-dashed">
                <CardContent className="p-4 text-sm text-muted-foreground flex items-center gap-2">
                    <Info className="w-5 h-5 shrink-0"/>
                    <p>Note: Service earnings from Mon-Sun are paid out on the following Friday. Product commissions are paid after the order's return window closes.</p>
                </CardContent>
            </Card>
        </div>
      </section>

      <Separator className="my-12"/>
      
      {/* --- Section 2: This Week's Payout --- */}
      <section id="this-week" className="scroll-mt-32">
        <h2 className="text-2xl font-bold font-headline mb-4">This Week’s Payout</h2>
         <Card>
            <CardHeader>
                <div className="flex flex-wrap justify-between items-baseline gap-4">
                    <div>
                        <CardTitle>Upcoming Payout</CardTitle>
                        <CardDescription>Payout Date: {nextPayoutDate}</CardDescription>
                    </div>
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Status: Draft</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="font-semibold mb-2">Included Items ({includedBookings.length})</h4>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Source ID</TableHead>
                                        <TableHead>Gross</TableHead>
                                        <TableHead>Platform Fee</TableHead>
                                        <TableHead className="text-right">Net</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {includedBookings.map(item => (
                                        <TableRow key={item.source}>
                                            <TableCell>{item.source}</TableCell>
                                            <TableCell><Price amount={item.grossAmount} showDecimals /></TableCell>
                                            <TableCell><Price amount={item.platformFee} showDecimals /></TableCell>
                                            <TableCell className="text-right"><Price amount={item.netPayable} showDecimals /></TableCell>
                                        </TableRow>
                                    ))}
                                    {includedBookings.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground py-4">No pending items.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                     <div>
                        <h4 className="font-semibold mb-2">Excluded Items ({excludedBookings.length})</h4>
                         <Accordion type="single" collapsible className="w-full">
                            {excludedBookings.map(item => (
                                <AccordionItem key={item.source} value={item.source}>
                                    <AccordionTrigger className="p-2 border rounded-md text-sm">
                                        <span className="font-mono">{item.source}</span> - <span className="text-destructive">{item.reason || 'Verification Pending'}</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="p-2 text-xs text-muted-foreground">
                                        <strong>What to do:</strong> Lock the PCR to include this booking in the next payout cycle.
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                            {excludedBookings.length === 0 && (
                                <div className="text-center text-muted-foreground py-4 border rounded-md">No excluded items.</div>
                            )}
                        </Accordion>
                    </div>
                </div>
            </CardContent>
        </Card>
      </section>

      <Separator className="my-12"/>

      {/* --- Section 3: Referral Orders --- */}
      <section id="referrals" className="scroll-mt-32">
        <h2 className="text-2xl font-bold font-headline mb-4">Referral Orders</h2>
        <Card>
            <CardContent className="pt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Order #</TableHead>
                            <TableHead>Buyer</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead>Commission</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {referralOrders.map(order => (
                             <TableRow key={order.id}>
                                <TableCell>{new Date(order.createdAt as string).toLocaleDateString()}</TableCell>
                                <TableCell>{order.id}</TableCell>
                                <TableCell>{order.customerName}</TableCell>
                                <TableCell><Price amount={(order.couponDiscount || 0)} showDecimals /></TableCell>
                                <TableCell><Price amount={(order.commissionAmount || 0)} showDecimals /></TableCell>
                                <TableCell><Badge variant="secondary">{order.commissionState || 'onHold'}</Badge></TableCell>
                            </TableRow>
                        ))}
                        {referralOrders.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center text-muted-foreground py-4">No referral orders yet.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </section>

      <Separator className="my-12"/>

      {/* --- Section 4: Wallet (Ledger) --- */}
      <section id="wallet" className="scroll-mt-32">
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold font-headline">Wallet (Ledger)</h2>
            <div className="w-[150px]">
                <Select value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="service">Service</SelectItem>
                        <SelectItem value="product">Product</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
        <Card>
            <CardContent className="pt-6">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Source ID</TableHead>
                            <TableHead className="text-right">Gross</TableHead>
                            <TableHead className="text-right">Platform Fee</TableHead>
                            <TableHead className="text-right">GST on Fee</TableHead>
                            <TableHead className="text-right">TDS</TableHead>
                            <TableHead className="text-right">Net</TableHead>
                            <TableHead>Status</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredHistory.map(item => (
                            <TableRow key={item.source}>
                                <TableCell>{new Date(item.sessionDate).toLocaleDateString()}</TableCell>
                                <TableCell>{item.source}</TableCell>
                                <TableCell className="text-right"><Price amount={item.grossAmount} showDecimals /></TableCell>
                                <TableCell className="text-right text-destructive">-<Price amount={item.platformFee} showDecimals /></TableCell>
                                <TableCell className="text-right text-destructive">-<Price amount={item.gstOnPlatformFee} showDecimals /></TableCell>
                                <TableCell className="text-right text-destructive">-<Price amount={item.tdsDeducted} showDecimals /></TableCell>
                                <TableCell className="text-right font-bold"><Price amount={item.netPayable} showDecimals /></TableCell>
                                <TableCell><Badge variant="secondary">{item.status}</Badge></TableCell>
                            </TableRow>
                        ))}
                        {filteredHistory.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center text-muted-foreground py-4">No earnings found.</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      </section>

      <Separator className="my-12"/>
      
      {/* --- Section 5: Payout History --- */}
      <section id="history" className="scroll-mt-32">
        <h2 className="text-2xl font-bold font-headline mb-4">Payout History</h2>
         <Card>
             <CardContent className="pt-6 space-y-4">
                {earningsData?.payoutHistory?.map(payout => (
                    <div key={payout.payoutId} className="p-4 border rounded-md flex justify-between items-center">
                        <div>
                            <p className="font-semibold">{payout.period}</p>
                            <p className="text-sm text-muted-foreground">Paid on {new Date(payout.payoutDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                             <p className="font-bold text-lg text-green-600"><Price amount={payout.totalAmount} showDecimals /></p>
                             <Button variant="link" size="sm" className="p-0 h-auto">Download Statement</Button>
                        </div>
                    </div>
                ))}
                {(!earningsData?.payoutHistory || earningsData.payoutHistory.length === 0) && (
                    <div className="text-center text-muted-foreground py-4">No previous payouts.</div>
                )}
             </CardContent>
        </Card>
      </section>

       <Separator className="my-12"/>
      
      {/* --- Section 6: Eligibility --- */}
      <section id="eligibility" className="scroll-mt-32">
        <h2 className="text-2xl font-bold font-headline mb-4">Eligibility Check</h2>
        <Card>
            <CardContent className="pt-6">
                 <p className="text-muted-foreground">This section helps you debug why a booking might be on hold. The same information is available in "This Week's Payout" section.</p>
            </CardContent>
        </Card>
      </section>

    </div>
  );
}
