'use client';

import * as React from 'react';
import { FileCheck2, Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/auth-context';
import { CERTIFICATE_MAX_BYTES, CERTIFICATE_TYPES, getMyCertificate, openCertificate, uploadMyCertificate, type CertificateInfo } from '@/lib/repos/certificate';

/** The therapist's registration certificate: choose a file, upload it, open it again. The file is private (therapist and therapy / super admins only). */
export function CertificateUpload() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [info, setInfo] = React.useState<CertificateInfo | null>(null);
  const [file, setFile] = React.useState<File | null>(null);
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => { getMyCertificate().then(setInfo).catch(() => setInfo({ uploaded: false, name: null, uploadedAt: null })); }, []);

  const choose = (f: File | null) => {
    if (f && !CERTIFICATE_TYPES.includes(f.type)) { toast({ variant: 'destructive', title: 'Wrong file type', description: 'Please choose a PDF, JPG or PNG file.' }); return; }
    if (f && f.size > CERTIFICATE_MAX_BYTES) { toast({ variant: 'destructive', title: 'File too large', description: 'The file must be 5 MB or smaller.' }); return; }
    setFile(f);
  };

  const upload = async () => {
    if (!file) return;
    setBusy(true);
    try {
      setInfo(await uploadMyCertificate(file));
      setFile(null);
      toast({ title: 'Certificate uploaded', description: 'The therapy team can now see it.' });
    } catch (e: any) {
      toast({ variant: 'destructive', title: 'Upload failed', description: e?.response?.data?.error || 'Please try again.' });
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3 rounded-md border p-4" data-testid="certificate-upload">
      <Label htmlFor="certificate" className="font-semibold">Registration certificate</Label>
      <p className="text-sm text-muted-foreground">Upload your council registration certificate (PDF, JPG or PNG, up to 5 MB). Only you and the Curevan therapy team can see it.</p>
      {info?.uploaded && (
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <FileCheck2 className="h-4 w-4 text-emerald-600" />
          <span>Uploaded: {info.name}{info.uploadedAt ? ` (${new Date(info.uploadedAt).toLocaleDateString()})` : ''}</span>
          {user && <Button type="button" variant="outline" size="sm" onClick={() => openCertificate(user.uid).catch(() => toast({ variant: 'destructive', title: 'Could not open the file' }))}>View</Button>}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <Input id="certificate" type="file" accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png" className="max-w-xs" onChange={(e) => choose(e.target.files?.[0] ?? null)} />
        <Button type="button" onClick={upload} disabled={!file || busy}>
          {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {info?.uploaded ? 'Replace' : 'Upload'}
        </Button>
      </div>
    </div>
  );
}
