
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { logConsent } from '@/lib/actions/consent'; // We will create this server action next
import { useAuth } from '@/context/auth-context';

interface ConsentFormProps {
  consentType: 'terms' | 'privacy' | 'medical' | 'marketing';
  version: string;
}

export function ConsentForm({ consentType, version }: ConsentFormProps) {
  const { user } = useAuth();
  const [isChecked, setIsChecked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!isChecked) {
      toast({
        variant: 'destructive',
        title: 'Agreement Required',
        description: 'You must agree to the terms before proceeding.',
      });
      return;
    }

    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Error',
        description: 'You must be logged in to provide consent.',
      });
      return;
    }

    setIsLoading(true);
    try {
      const result = await logConsent({ consentType, version });
      if (result.success) {
        toast({
          title: 'Consent Recorded',
          description: `Your consent for ${consentType} has been successfully saved.`,
        });
      } else {
        throw new Error(result.error || 'Failed to save consent.');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'An Error Occurred',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mt-6 p-4 border rounded-lg bg-secondary/50">
      <div className="flex items-center space-x-2">
        <Checkbox id="consent-checkbox" checked={isChecked} onCheckedChange={(checked) => setIsChecked(checked as boolean)} />
        <Label htmlFor="consent-checkbox" className="font-semibold">
          I have read, understood, and agree to the marketing consent terms.
        </Label>
      </div>
      <Button onClick={handleSubmit} disabled={isLoading || !isChecked} className="mt-4 w-full sm:w-auto">
        {isLoading ? 'Submitting...' : 'Agree and Submit'}
      </Button>
    </div>
  );
}
