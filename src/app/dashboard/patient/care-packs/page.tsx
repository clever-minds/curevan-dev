'use client';

import * as React from 'react';
import Link from 'next/link';
import { Package, CheckCircle2, Shield, Calendar, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import useRazorpay from '@/hooks/use-razorpay';
import {
  getCarePackPlans,
  getMyCarePacks,
  createCarePackOrder,
  verifyCarePackPurchase,
  type CarePackPlan,
  type CarePack,
} from '@/lib/repos/carePacks';

export default function PatientCarePacksPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { openPayment } = useRazorpay();
  const [plans, setPlans] = React.useState<CarePackPlan[]>([]);
  const [myPacks, setMyPacks] = React.useState<CarePack[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [buyingPlanId, setBuyingPlanId] = React.useState<number | null>(null);

  const loadData = React.useCallback(async () => {
    try {
      const [fetchedPlans, fetchedPacks] = await Promise.all([
        getCarePackPlans(),
        getMyCarePacks(),
      ]);
      setPlans(fetchedPlans);
      setMyPacks(fetchedPacks);
    } catch (err) {
      console.error('Failed to load care pack data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadData();
  }, [loadData]);

  const handleBuyPack = async (plan: CarePackPlan) => {
    if (!user) {
      toast({ title: 'Please sign in', description: 'Sign in to purchase a Care Package', variant: 'destructive' });
      return;
    }

    setBuyingPlanId(plan.id);
    try {
      const order = await createCarePackOrder(plan.id);

      openPayment({
        amount: order.amountPaise,
        currency: 'INR',
        receipt: `cp-${plan.id}`,
        orderId: order.razorpayOrderId,
        keyId: order.keyId,
        productName: 'Curevan Care Pack',
        productDescription: `${plan.name} (${plan.sessions} sessions)`,
        prefill: {
          name: user.name || '',
          email: user.email || '',
          contact: user.phone || '',
        },
        onSuccess: async (response) => {
          try {
            await verifyCarePackPurchase({
              planId: plan.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            toast({
              title: 'Purchase Successful!',
              description: `Your ${plan.name} has been activated with ${plan.sessions} sessions.`,
            });
            await loadData();
          } catch (verifyErr) {
            toast({
              title: 'Verification Failed',
              description: verifyErr instanceof Error ? verifyErr.message : 'Please contact support',
              variant: 'destructive',
            });
          }
        },
        onFailure: (err) => {
          toast({
            title: 'Payment Failed',
            description: err.reason || 'Please try again',
            variant: 'destructive',
          });
        },
      });
    } catch (err) {
      console.error('Purchase error:', err);
      toast({
        title: 'Could not initiate purchase',
        description: err instanceof Error ? err.message : 'Please try again',
        variant: 'destructive',
      });
    } finally {
      setBuyingPlanId(null);
    }
  };

  const activePacks = myPacks.filter((p) => p.status === 'active');
  const pastPacks = myPacks.filter((p) => p.status !== 'active');

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight font-headline">Care Packages</h1>
        <p className="text-muted-foreground mt-1 text-sm md:text-base">
          Save on multi-session physiotherapy and rehabilitation packs. Book sessions one-by-one with ₹0 checkout.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Active Packs Section */}
          {activePacks.length > 0 && (
            <section className="space-y-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" /> My Active Packages
              </h2>
              <div className="grid gap-4 md:grid-cols-2">
                {activePacks.map((pack) => {
                  const remaining = pack.sessions_total - pack.sessions_used;
                  const expiresText = pack.expires_at
                    ? new Date(pack.expires_at).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : '';

                  return (
                    <Card key={pack.id} className="border-primary/40 bg-gradient-to-br from-primary/5 via-background to-background">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{pack.plan_name}</CardTitle>
                            <CardDescription>
                              Purchased on {new Date(pack.purchased_at).toLocaleDateString('en-IN')}
                            </CardDescription>
                          </div>
                          <Badge variant="outline" className="border-primary text-primary font-medium">
                            Active
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1.5 font-medium">
                            <span>Sessions Remaining</span>
                            <span className="text-primary font-bold">
                              {remaining} of {pack.sessions_total}
                            </span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                            <div
                              className="bg-primary h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${Math.round((pack.sessions_used / pack.sessions_total) * 100)}%` }}
                            />
                          </div>
                        </div>

                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>• Valid until {expiresText}</p>
                          <p>
                            • {pack.therapist_name ? `Dedicated Therapist: ${pack.therapist_name}` : 'Use with any available therapist'}
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button asChild className="w-full">
                          <Link href={pack.therapist_id ? `/booking/${pack.therapist_id}?carePackId=${pack.id}` : `/book?carePackId=${pack.id}`}>
                            <Calendar className="mr-2 h-4 w-4" /> Book Next Session
                          </Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            </section>
          )}

          {/* Buy Care Packs Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" /> Choose a Care Package
                </h2>
                <p className="text-sm text-muted-foreground">Upfront bundles with dedicated clinical follow-ups</p>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
              {plans.map((plan) => {
                const perSessionPrice = Math.round(Number(plan.price) / plan.sessions);
                const isBuying = buyingPlanId === plan.id;

                return (
                  <Card key={plan.id} className="relative flex flex-col justify-between hover:shadow-md transition-shadow border-muted-foreground/20">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant="secondary" className="font-semibold text-xs">
                          {plan.sessions} Sessions Bundle
                        </Badge>
                        <span className="text-xs text-muted-foreground">Valid for {plan.validity_days} days</span>
                      </div>
                      <CardTitle className="text-xl font-bold">{plan.name}</CardTitle>
                      <CardDescription>
                        Comprehensive home care with progress monitoring and zero extra fees.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-extrabold text-foreground font-headline">
                          ₹{Number(plan.price).toLocaleString('en-IN')}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          (₹{perSessionPrice} / session)
                        </span>
                      </div>

                      <div className="space-y-2 text-sm text-muted-foreground border-t pt-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span>Same verified therapist for continuous recovery</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span>Free cancellation up to 12 hours before slot</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                          <span>Pro-rata refund on unused sessions (per policy)</span>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-2">
                      <Button
                        className="w-full"
                        onClick={() => handleBuyPack(plan)}
                        disabled={isBuying}
                      >
                        {isBuying ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
                          </>
                        ) : (
                          <>
                            Purchase Package <ArrowRight className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          </section>

          {/* Past Packages History */}
          {pastPacks.length > 0 && (
            <section className="space-y-3 pt-6 border-t">
              <h3 className="text-base font-semibold text-muted-foreground">Past Packages</h3>
              <div className="grid gap-3 md:grid-cols-2">
                {pastPacks.map((pack) => (
                  <Card key={pack.id} className="opacity-75 bg-muted/30">
                    <CardHeader className="py-3 px-4">
                      <div className="flex justify-between items-center text-sm">
                        <span className="font-medium">{pack.plan_name}</span>
                        <Badge variant="outline" className="capitalize text-xs">
                          {pack.status}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs">
                        {pack.sessions_used} of {pack.sessions_total} sessions used • Ended on{' '}
                        {new Date(pack.expires_at).toLocaleDateString('en-IN')}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </section>
          )}

          {/* Policy Information */}
          <div className="rounded-lg border bg-muted/40 p-4 text-xs text-muted-foreground space-y-2">
            <div className="flex items-center gap-2 font-semibold text-foreground">
              <Shield className="h-4 w-4 text-primary" /> Care Package Terms & Guarantee (Decision D14)
            </div>
            <p>
              • <strong>Validity:</strong> Packages expire 90 days after purchase. Sessions must be scheduled within the validity window.
            </p>
            <p>
              • <strong>Cancellation:</strong> Cancelling a session at least 12 hours prior restores the session to your package balance. Late cancellations inside 2 hours consume the session.
            </p>
            <p>
              • <strong>Refunds:</strong> Unused sessions may be refunded pro-rata based on single-session value minus a standard 10% administrative processing fee.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
