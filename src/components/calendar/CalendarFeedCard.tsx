'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { getCalendarFeedUrl } from '@/lib/repos/clinical';

/** A private, read-only calendar address to subscribe to in Google, Outlook or Apple Calendar. */
export function CalendarFeedCard() {
  const { toast } = useToast();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => { getCalendarFeedUrl().then(setUrl); }, []);

  const copy = async () => { if (url) { await navigator.clipboard.writeText(url); toast({ title: 'Copied', description: 'Paste it into your calendar app.' }); } };
  const regenerate = async () => {
    const fresh = await getCalendarFeedUrl(true);
    if (fresh) { setUrl(fresh); toast({ title: 'New address created', description: 'The old one stopped working.' }); }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subscribe in your calendar</CardTitle>
        <CardDescription>Sessions appear in Google, Outlook or Apple Calendar (confirmed ones, and recommended ones marked tentative). Keep this address private.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2"><Input readOnly value={url ?? 'Loading...'} aria-label="Calendar feed address" /><Button type="button" onClick={copy} disabled={!url}>Copy</Button></div>
        <ul className="list-disc pl-5 text-xs text-muted-foreground">
          <li>Google Calendar: Other calendars, + , From URL.</li>
          <li>Outlook: Add calendar, Subscribe from web.</li>
          <li>Apple Calendar: File, New Calendar Subscription.</li>
        </ul>
        <Button type="button" variant="outline" size="sm" onClick={regenerate}>Create a new address</Button>
      </CardContent>
    </Card>
  );
}
