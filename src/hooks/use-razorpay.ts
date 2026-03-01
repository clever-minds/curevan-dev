
'use client';

import { useEffect, useState } from 'react';
import { useToast } from './use-toast';
import { useRouter } from 'next/navigation';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  amount: number;
  currency: string;
  receipt: string;
  orderId?: string; // Razorpay's order_id
  productName: string;
  productDescription: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  onSuccess?: (response: any) => void;
  onFailure?: (response: any) => void;
}

const useRazorpay = () => {
  const { toast } = useToast();
  const [isLoaded, setIsLoaded] = useState(false);
  const router = useRouter();
  const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

  useEffect(() => {
    if (document.querySelector('#razorpay-checkout-script')) {
        setIsLoaded(true);
        return;
    }
    
    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => {
        toast({
            variant: 'destructive',
            title: 'Payment Error',
            description: 'Could not load the payment gateway.',
        });
    };
    document.body.appendChild(script);

    return () => {
        const existingScript = document.querySelector('#razorpay-checkout-script');
        if (existingScript) {
            document.body.removeChild(existingScript);
        }
    };
  }, [toast]);

  const openPayment = (options: RazorpayOptions) => {
    if (!isLoaded) {
      toast({
        variant: 'destructive',
        title: 'Initialization Error',
        description: 'Payment gateway is not ready yet. Please try again.',
      });
      return;
    }
    
    if (!razorpayKey) {
        toast({
            variant: 'destructive',
            title: 'Configuration Error',
            description: 'Razorpay Key ID is not configured.',
        });
        console.error("Razorpay Key ID is not set in environment variables.");
        return;
    }

    const rzp = new window.Razorpay({
      key: razorpayKey,
      amount: options.amount,
      currency: options.currency,
      name: 'Curevan',
      description: options.productDescription,
      order_id: options.orderId,
      handler: (response: any) => {
        console.log('Payment successful', response);
        // The server-side webhook will handle order status updates.
        // We just need to call the client-side success callback.
        if (options.onSuccess) {
            options.onSuccess(response);
        }
      },
      prefill: options.prefill,
      notes: {
        receipt: options.receipt,
      },
      theme: {
        color: '#4A23D1',
      },
      modal: {
        ondismiss: () => {
            console.log('Payment modal dismissed');
            if (options.onFailure) {
                options.onFailure({ reason: 'Payment modal dismissed by user' });
            }
        }
      }
    });

    rzp.on('payment.failed', (response: any) => {
      console.error('Payment failed', response.error);
      toast({
        variant: 'destructive',
        title: 'Payment Failed',
        description: response.error.description || 'An unknown error occurred.',
      });
      if (options.onFailure) {
          options.onFailure(response.error);
      }
    });

    rzp.open();
  };

  return { openPayment, isLoaded };
};

export default useRazorpay;
