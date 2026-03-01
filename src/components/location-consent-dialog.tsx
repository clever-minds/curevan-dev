
'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { MapPin } from 'lucide-react';

interface LocationConsentDialogProps {
  open: boolean;
  onConsent: (consent: boolean) => void;
}

export function LocationConsentDialog({ open, onConsent }: LocationConsentDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(isOpen) => { if (!isOpen) onConsent(false) }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Share Your Location?
          </AlertDialogTitle>
          <AlertDialogDescription>
            To help you find therapists nearby, Curevan would like to use your current location. Your location data will only be used for this purpose and will not be stored.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => onConsent(false)}>Deny</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConsent(true)}>Allow</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
