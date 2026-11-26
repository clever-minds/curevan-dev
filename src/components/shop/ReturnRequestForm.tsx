'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RETURN_REASONS } from '@/lib/order-status';
import type { Order } from '@/lib/types';

const MAX_PHOTOS = 3;
const MAX_PHOTO_BYTES = 1_000_000;

const toDataUrl = (f: File) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result));
  r.onerror = () => reject(r.error);
  r.readAsDataURL(f);
});

export type ReturnPayload = { reason: string; note?: string; photos: string[]; items: { order_item_id: number; quantity: number }[] };

/** Reason code, the items (with quantity) and, for damaged/defective goods, a photo. */
export function ReturnRequestForm({ order, busy, onSubmit, onCancel }: { order: Order; busy: boolean; onSubmit: (p: ReturnPayload) => void; onCancel: () => void }) {
  const [reason, setReason] = React.useState('');
  const [note, setNote] = React.useState('');
  const [photos, setPhotos] = React.useState<string[]>([]);
  const [photoError, setPhotoError] = React.useState('');
  const [qty, setQty] = React.useState<Record<number, number>>({});

  const lines = (order.items ?? []).filter((i) => i.id !== undefined) as (Order['items'][number] & { id: number })[];
  const needsPhoto = RETURN_REASONS.find((r) => r.code === reason)?.photo ?? false;
  const chosen = Object.entries(qty).filter(([, q]) => q > 0).map(([id, q]) => ({ order_item_id: Number(id), quantity: q }));
  const ready = !!reason && chosen.length > 0 && (!needsPhoto || photos.length > 0);

  const pick = async (files: FileList | null) => {
    setPhotoError('');
    const list = Array.from(files ?? []).slice(0, MAX_PHOTOS);
    if (list.some((f) => !f.type.startsWith('image/'))) { setPhotoError('Please choose image files.'); return; }
    if (list.some((f) => f.size > MAX_PHOTO_BYTES)) { setPhotoError('Each photo must be under 1 MB.'); return; }
    setPhotos(await Promise.all(list.map(toDataUrl)));
  };

  return (
    <div className="grid gap-4 py-2">
      <div className="grid gap-2">
        <Label>Reason</Label>
        <div role="radiogroup" aria-label="Reason" className="grid gap-1">
          {RETURN_REASONS.map((r) => (
            <label key={r.code} className="flex items-center gap-2 text-sm">
              <input type="radio" name={`reason-${order.id}`} value={r.code} checked={reason === r.code} onChange={() => setReason(r.code)} />{r.label}
            </label>
          ))}
        </div>
      </div>

      <div className="grid gap-2">
        <Label>Items to return</Label>
        {lines.map((l) => (
          <div key={l.id} className="flex items-center gap-2 text-sm">
            <Checkbox checked={(qty[l.id] ?? 0) > 0} onCheckedChange={(c) => setQty({ ...qty, [l.id]: c ? 1 : 0 })} aria-label={`Return ${l.name}`} />
            <span className="flex-1">{l.name} <span className="text-muted-foreground">(bought {l.qty})</span></span>
            {(qty[l.id] ?? 0) > 0 && l.qty > 1 && (
              <Input type="number" min={1} max={l.qty} value={qty[l.id]} className="w-16 h-8" aria-label={`Quantity of ${l.name}`}
                onChange={(e) => setQty({ ...qty, [l.id]: Math.max(1, Math.min(l.qty, Number(e.target.value) || 1)) })} />
            )}
          </div>
        ))}
      </div>

      {needsPhoto && (
        <div className="grid gap-2">
          <Label htmlFor={`photo-${order.id}`}>Photo of the problem (required)</Label>
          <Input id={`photo-${order.id}`} type="file" accept="image/*" multiple onChange={(e) => pick(e.target.files)} />
          {photoError && <p className="text-xs text-destructive">{photoError}</p>}
          {photos.length > 0 && <p className="text-xs text-muted-foreground">{photos.length} photo(s) added</p>}
        </div>
      )}

      <div className="grid gap-2">
        <Label htmlFor={`note-${order.id}`}>Anything else we should know? (optional)</Label>
        <Textarea id={`note-${order.id}`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={400} />
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button className="bg-teal-600 hover:bg-teal-700 text-white" disabled={busy || !ready} onClick={() => onSubmit({ reason, note: note.trim() || undefined, photos, items: chosen })}>
          {busy && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Submit Return Request
        </Button>
      </div>
    </div>
  );
}
