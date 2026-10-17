'use client';

import * as React from 'react';
import Link from 'next/link';
import { Copy, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { DEFAULT_AFFILIATE_RULES, getAffiliateRules, type AffiliateRules } from '@/lib/repos/publicConfig';
import { getAffiliateStats } from '@/lib/repos/affiliate';

/** "Patients get 10% off with your code; you earn 5% on every product sale" - the numbers come from the server. */
export const referralText = (r: AffiliateRules) => `Patients get ${r.patientDiscountPct}% off with your code; you earn ${r.therapistCommissionPct}% on every product sale.`;

export function useAffiliateRules() {
  const [rules, setRules] = React.useState<AffiliateRules>(DEFAULT_AFFILIATE_RULES);
  React.useEffect(() => { getAffiliateRules().then(setRules); }, []);
  return rules;
}

export const shopLink = (code: string) => `${window.location.origin}/shop?coupon=${encodeURIComponent(code)}`;

/** The therapist's DR code with Copy link and Share on WhatsApp. */
export function ReferralCard({ title = 'Grow Your Earnings' }: { title?: string }) {
  const { toast } = useToast();
  const rules = useAffiliateRules();
  const [code, setCode] = React.useState<string | null | undefined>(undefined);
  React.useEffect(() => { getAffiliateStats().then((s) => setCode(s?.code ?? null)); }, []);

  const copy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(shopLink(code));
    toast({ title: 'Link copied', description: 'Your shop link with the code is ready to share.' });
  };
  const whatsapp = () => {
    if (!code) return;
    const text = `Use my Curevan code ${code} for ${rules.patientDiscountPct}% off wellness products: ${shopLink(code)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{referralText(rules)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-muted border">
          <div className="text-center sm:text-left">
            <p className="text-sm text-muted-foreground">Your Referral Code</p>
            <p className="text-2xl font-bold font-mono tracking-widest" data-testid="dr-code">{code === undefined ? '...' : code || 'Not created yet'}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={copy} disabled={!code} variant="outline"><Copy className="mr-2 h-4 w-4" />Copy link</Button>
            <Button onClick={whatsapp} disabled={!code}><MessageCircle className="mr-2 h-4 w-4" />Share on WhatsApp</Button>
          </div>
        </div>
        <Link href="/dashboard/therapist/affiliate" className="text-sm text-primary underline">See your sales and commission</Link>
      </CardContent>
    </Card>
  );
}
