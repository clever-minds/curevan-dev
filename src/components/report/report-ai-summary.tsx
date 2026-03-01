
'use client';

import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, RefreshCw, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReportAiSummaryProps {
  summaryText: string[];
  regenerate: () => void;
  copy: () => void;
  className?: string;
}

export default function ReportAiSummary({ summaryText, regenerate, copy, className }: ReportAiSummaryProps) {
  return (
    <Card className={cn("bg-orange-100/50 border-orange-500/30 avoid-break", className)}>
        <CardHeader className="flex-row items-start gap-4 space-y-0">
            <div className="p-2 bg-orange-100 rounded-full mt-1">
                <AlertTriangle className="w-5 h-5 text-orange-600" />
            </div>
            <div className='flex-1'>
                <CardTitle className='text-base font-semibold'>
                    AI-generated summary — may contain errors. Refer to PCR for exact recommendations.
                </CardTitle>
            </div>
        </CardHeader>
        <CardContent>
            <ul className="list-disc pl-5 space-y-2 text-sm text-muted-foreground">
                {summaryText.map((item, index) => (
                    <li key={index}>{item}</li>
                ))}
            </ul>
        </CardContent>
        <CardFooter className="gap-2 no-print">
            <Button variant="outline" size="sm" onClick={regenerate}>
                <RefreshCw className="mr-2" />
                Regenerate
            </Button>
            <Button variant="outline" size="sm" onClick={copy}>
                <Copy className="mr-2" />
                Copy
            </Button>
        </CardFooter>
    </Card>
  );
}
