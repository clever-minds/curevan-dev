"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Send, CheckCircle2, AlertCircle, Clock, Eye } from "lucide-react";
import {
  getNotificationLogs,
  resendNotification,
  type NotificationLogRow,
} from "@/lib/repos/notificationLogs";

export default function NotificationLogPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<NotificationLogRow[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, startTransition] = useTransition();
  const [resendingId, setResendingId] = useState<number | null>(null);

  // Filters
  const [channelFilter, setChannelFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [eventFilter, setEventFilter] = useState("all");

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const res = await getNotificationLogs({
        channel: channelFilter,
        status: statusFilter,
        event: eventFilter,
        limit: 100,
      });
      setLogs(res.logs || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Failed to load notification logs",
        description: err.message || "Could not retrieve logs from server.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [channelFilter, statusFilter, eventFilter]);

  const handleResend = (id: number) => {
    setResendingId(id);
    startTransition(async () => {
      try {
        const res = await resendNotification(id);
        if (res.success) {
          toast({
            title: "Notification Resent",
            description: res.message || "Resend triggered successfully.",
          });
          fetchLogs();
        } else {
          toast({
            variant: "destructive",
            title: "Resend Failed",
            description: res.message,
          });
        }
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Resend Error",
          description: err.message || "Failed to trigger resend.",
        });
      } finally {
        setResendingId(null);
      }
    });
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "read":
        return (
          <Badge className="bg-purple-100 text-purple-800 hover:bg-purple-200 border-purple-300 flex items-center gap-1 w-fit">
            <Eye className="w-3 h-3" /> Read
          </Badge>
        );
      case "delivered":
        return (
          <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-emerald-300 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Delivered
          </Badge>
        );
      case "sent":
        return (
          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-blue-300 flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" /> Sent
          </Badge>
        );
      case "failed":
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <AlertCircle className="w-3 h-3" /> Failed
          </Badge>
        );
      case "skipped":
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" /> Skipped
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" /> {status}
          </Badge>
        );
    }
  };

  const renderChannelBadge = (channel: string) => {
    switch (channel) {
      case "whatsapp":
        return <Badge className="bg-green-600 text-white">WhatsApp</Badge>;
      case "sms":
        return <Badge className="bg-amber-600 text-white">SMS</Badge>;
      case "email":
        return <Badge className="bg-sky-600 text-white">Email</Badge>;
      default:
        return <Badge variant="outline">{channel}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notification Delivery Log</h1>
          <p className="text-sm text-muted-foreground">
            Monitor real-time omnichannel delivery across WhatsApp Cloud API, SMS, and Email.
          </p>
        </div>
        <Button
          onClick={fetchLogs}
          variant="outline"
          disabled={isLoading}
          className="flex items-center gap-2 self-start md:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Filter Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Channel
              </label>
              <Select value={channelFilter} onValueChange={setChannelFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Channels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Channels</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Status
              </label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="skipped">Skipped</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1 block">
                Event
              </label>
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="booking_created">booking_created</SelectItem>
                  <SelectItem value="booking_confirmed">booking_confirmed</SelectItem>
                  <SelectItem value="reminder_2h">reminder_2h</SelectItem>
                  <SelectItem value="order_placed">order_placed</SelectItem>
                  <SelectItem value="order_dispatched">order_dispatched</SelectItem>
                  <SelectItem value="order_delivered">order_delivered</SelectItem>
                  <SelectItem value="sos_triggered">sos_triggered</SelectItem>
                  <SelectItem value="pcr_submitted">pcr_submitted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Table */}
      <Card>
        <CardHeader>
          <CardTitle>Delivery History</CardTitle>
          <CardDescription>
            Showing {logs.length} of {total} records. Phone numbers are strictly masked and message bodies are never stored.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[140px]">Timestamp</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Masked Phone</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Template</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center">
                      <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Loading delivery logs...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                      No notification logs found matching the selected filters.
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.createdAt ? new Date(log.createdAt).toLocaleString("en-IN") : "—"}
                      </TableCell>
                      <TableCell className="font-medium text-xs">
                        <span className="font-mono bg-muted px-1.5 py-0.5 rounded">
                          {log.event}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="capitalize">{log.userRole}</span>
                      </TableCell>
                      <TableCell className="text-xs font-mono">
                        {log.maskedPhone || "—"}
                      </TableCell>
                      <TableCell>{renderChannelBadge(log.channel)}</TableCell>
                      <TableCell className="text-xs font-mono text-muted-foreground">
                        {log.template || "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          {renderStatusBadge(log.status)}
                          {log.deliveredAt && (
                            <span className="text-[10px] text-muted-foreground">
                              Del: {new Date(log.deliveredAt).toLocaleTimeString("en-IN")}
                            </span>
                          )}
                          {log.readAt && (
                            <span className="text-[10px] text-purple-600">
                              Read: {new Date(log.readAt).toLocaleTimeString("en-IN")}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-rose-600 max-w-[200px] truncate" title={log.error || ""}>
                        {log.errorCode ? `[${log.errorCode}] ` : ""}
                        {log.error || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleResend(log.id)}
                          disabled={resendingId === log.id || isPending}
                          className="h-8 px-2 text-xs"
                          title="Resend notification"
                        >
                          <Send className={`w-3.5 h-3.5 mr-1 ${resendingId === log.id ? "animate-spin" : ""}`} />
                          Resend
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
