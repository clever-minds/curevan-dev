
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Invoice } from '@/components/invoice';
import { getInvoiceById, InvoiceData } from '@/services/invoice-service';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, FileDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InvoicePage() {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id');
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!invoiceId) {
      setError('No invoice ID provided.');
      setLoading(false);
      return;
    }

    const fetchInvoice = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getInvoiceById(invoiceId);
        if (!data) {
          throw new Error('Invoice not found.');
        }
        setInvoice(data);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch invoice data.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [invoiceId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto my-8 space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }
  
  if (!invoice) {
    return null;
  }

  return (
    <div className="bg-muted/30 print:bg-white">
        <div className="container py-4 print:hidden no-print">
             <Button onClick={handlePrint}>
                <FileDown className="mr-2" />
                Download / Print
            </Button>
        </div>
        <div className="print-area">
            <Invoice invoice={invoice} />
        </div>
    </div>
  );
}
