'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Smartphone } from 'lucide-react';

interface PaymentButtonProps {
  amount: number;
  invoiceReference?: string;
  chequeId?: number;
  customerData?: {
    name?: string;
    email?: string;
    phone?: string;
  };
  onSuccess?: (paymentId: string) => void;
  onError?: (error: string) => void;
  className?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

const PaymentButton: React.FC<PaymentButtonProps> = ({
  amount,
  invoiceReference,
  chequeId,
  customerData = {},
  onSuccess,
  onError,
  className = ""
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isRazorpayLoaded, setIsRazorpayLoaded] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const loadRazorpayScript = () => {
      if (window.Razorpay) {
        setIsRazorpayLoaded(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;

      script.onload = () => {
        setIsRazorpayLoaded(true);
        console.log('✅ Razorpay script loaded');
      };

      script.onerror = () => {
        console.error('❌ Failed to load Razorpay script');
        toast.error('Failed to load payment gateway');
        if (onError) {
          onError('Failed to load payment gateway');
        }
      };

      document.body.appendChild(script);

      return () => {
        document.body.removeChild(script);
      };
    };

    loadRazorpayScript();
  }, []);

  // Handle payment button click
  const handlePaymentClick = async () => {
    if (!isRazorpayLoaded) {
      toast.error('Payment gateway is loading...');
      return;
    }

    if (!amount || amount <= 0) {
      toast.error('Invalid payment amount');
      return;
    }

    setIsLoading(true);

    try {
      // Show loading toast
      const loadingToastId = toast.loading('Creating payment order...');

      // Create payment order
      const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          invoiceReference,
          chequeId,
          customerData: {
            name: customerData.name || 'Guest User',
            email: customerData.email || '',
            phone: customerData.phone || ''
          }
        }),
      });

      const orderData = await orderResponse.json();

      if (!orderResponse.ok || orderData.error) {
        throw new Error(orderData.error?.message || 'Failed to create payment order');
      }

      toast.dismiss(loadingToastId);
      toast.loading('Opening payment gateway...');

      const order = orderData.data;

      // Configure Razorpay options
      const options = {
        key: order.key_id,
        amount: order.amount * 100, // Convert to paise
        currency: order.currency || 'INR',
        name: 'Cheque Management System',
        description: invoiceReference ? `Payment for Invoice: ${invoiceReference}` : 'UPI Payment',
        order_id: order.order_id,
        prefill: {
          name: customerData.name || '',
          email: customerData.email || '',
          contact: customerData.phone || ''
        },
        theme: {
          color: '#10B981' // Green theme
        },
        modal: {
          ondismiss: function() {
            setIsLoading(false);
            toast.info('Payment cancelled');
          }
        },
        handler: async function (response: any) {
          try {
            toast.dismiss();
            toast.loading('Verifying payment...');

            // Verify payment signature
            const verifyResponse = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                order_id: response.razorpay_order_id,
                payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                chequeId
              }),
            });

            const verifyData = await verifyResponse.json();

            if (!verifyResponse.ok || verifyData.error) {
              throw new Error(verifyData.error?.message || 'Payment verification failed');
            }

            // Payment successful
            toast.dismiss();
            toast.success('Payment completed successfully! 🎉');

            if (onSuccess) {
              onSuccess(response.razorpay_payment_id);
            }

            setIsLoading(false);

          } catch (error) {
            console.error('Payment verification error:', error);
            toast.dismiss();
            toast.error(error instanceof Error ? error.message : 'Payment verification failed');

            if (onError) {
              onError(error instanceof Error ? error.message : 'Payment verification failed');
            }

            setIsLoading(false);
          }
        }
      };

      // Open Razorpay checkout
      const razorpay = new window.Razorpay(options);
      razorpay.open();

    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : 'Payment failed');

      if (onError) {
        onError(error instanceof Error ? error.message : 'Payment failed');
      }

      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePaymentClick}
      disabled={isLoading || !isRazorpayLoaded || amount <= 0}
      className={`bg-green-600 hover:bg-green-700 text-white transition-all duration-200 ${className}`}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          Processing...
        </>
      ) : (
        <>
          <Smartphone className="w-4 h-4 mr-2" />
          Pay via UPI
        </>
      )}
    </Button>
  );
};

export default PaymentButton;