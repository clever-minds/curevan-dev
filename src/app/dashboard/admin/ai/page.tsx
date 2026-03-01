

'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Bot, FileText, BookOpen, GraduationCap, TestTube, Sparkles, SlidersHorizontal, ShieldCheck, BarChart, Users, KeyRound, ThumbsUp, ThumbsDown, UserCog, Save, Loader2, FileDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from "@/components/ui/form";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { useState, useTransition } from "react";
import { curevanAssistant } from "@/ai/flows/chat-assistant";
import { Alert, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { DashboardCard } from "@/components/ui/dashboard-card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { listAiFeedback } from "@/lib/repos/content";
import { downloadCsv, getSafeDate } from "@/lib/utils";


const RagSource = ({ icon: Icon, label, id, defaultChecked = true }: {icon: React.ElementType, label: string, id: string, defaultChecked?: boolean}) => (
    <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center space-x-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor={id} className="font-medium">{label}</Label>
        </div>
        <Switch id={id} defaultChecked={defaultChecked} />
    </div>
)

// Mock Data for Dialogs
const usageData = [
    { date: 'Mon', queries: 120 }, { date: 'Tue', queries: 150 }, { date: 'Wed', queries: 130 },
    { date: 'Thu', queries: 180 }, { date: 'Fri', queries: 210 }, { date: 'Sat', queries: 160 },
    { date: 'Sun', queries: 140 },
];
const queryLogs = [
    { id: 1, user: 'patient@...', query: 'What are my upcoming appointments?', response: 'You have an appt with Dr. Reed...', feedback: 'positive' },
    { id: 2, user: 'therapist@...', query: 'Show me my schedule for tomorrow.', response: 'You have 3 sessions scheduled...', feedback: 'positive' },
    { id: 3, user: 'ecom@...', query: 'What is our top selling product?', response: 'I cannot answer that. Please check...', feedback: 'negative' },
];


export default function AdminAiPage() {
    const { toast } = useToast();
    const form = useForm();
    const [testQuery, setTestQuery] = useState("");
    const [testResponse, setTestResponse] = useState("");
    const [isTesting, startTestTransition] = useTransition();
    
    const assistantPrompt = `You are Curevan Assistant, a helpful and friendly AI customer care executive.
Your role is to assist users with their questions about the Curevan platform.
The user you are chatting with has the role: {userRole}.
Use the available tools to answer their questions about their appointments.
For general questions, use the information provided below.
Keep your answers concise and clear. If you cannot answer based on the provided context, use this exact fallback response: "I am unable to find the answer to your question in my current data. Please feel free to create a new support ticket or contact our team directly by phone or email at info@curevan.com."

START OF CONTEXT

**About Curevan:**
- Curevan is a brand by Himaya Care Pvt. Ltd., established in 2025.
- Its mission is to bring organized, continuous, and clinically-guided care to your doorstep.
- It solves problems like unorganized home visits, lack of treatment history, and no standardized tools for therapists.
- The name means "Cure. Anywhere."

**Services Offered:**
- Physiotherapy: For post-surgery rehab, back/neck pain, arthritis, stroke recovery.
- Nursing Care: Injections, wound dressing, IV drips, vital monitoring.
- Geri care Therapy: Assisting elderly with daily skills.
- Speech Therapy: For children with speech delays or adults post-stroke.
- Mental Health Counseling: For anxiety, depression via secure video calls.
- Dietitian/Nutritionist Services: Personalized meal planning.

**Contact Information:**
- Email: info@curevan.com
- Phone: +91 79 9060 2143
- Address: Himaya Care Pvt. Ltd., Office 704, Time Square, Vasna - Bhayli Main Rd, Ashwamegh Nagar, Tandalja, Vadodara, Gujarat 390012.

**Earnings & Payments:**
- You cannot access specific earnings data. If asked about earnings, refer the user to the "My Earnings" page in their dashboard for detailed information.

END OF CONTEXT`;

    const handleRebuildIndex = () => {
        toast({
            title: "Rebuild Submitted",
            description: "A job to rebuild the RAG index has been submitted.",
        });
    }

    const handleRunTest = () => {
        if (!testQuery) return;
        startTestTransition(async () => {
            setTestResponse("");
            const result = await curevanAssistant({ query: testQuery });
            if (result.answer) {
                setTestResponse(result.answer);
            } else {
                setTestResponse("The AI did not return a response.");
            }
        });
    }

    const handleExportFeedback = async () => {
        toast({ title: 'Exporting Feedback...', description: 'Fetching all AI feedback records.' });
        const feedbackData = await listAiFeedback();
        const headers = ["Interaction ID", "User ID", "Timestamp", "Context", "Rating", "Query", "Response", "User Comment"];
        const data = feedbackData.map(fb => [
            fb.interactionId,
            fb.userId,
            getSafeDate(fb.timestamp)?.toISOString() || '',
            fb.context,
            fb.rating,
            fb.query || '',
            fb.response || '',
            fb.userComment || ''
        ]);
        downloadCsv(headers, data, 'ai-feedback-export.csv');
        toast({ title: 'Export Complete', description: `${feedbackData.length} feedback records exported.` });
    };

  return (
    <Form {...form}>
    <div className="space-y-6">
       <div>
        <h1 className="text-2xl font-bold tracking-tight font-headline">AI Management</h1>
        <p className="text-muted-foreground">Monitor and manage the AI chat and content systems.</p>
      </div>

       <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><SlidersHorizontal/> AI Model Configuration & Tuning</CardTitle>
                    <CardDescription>Control the core behavior of the AI model to align with organizational needs.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                     <div className="space-y-3">
                        <Label>Response Creativity (Temperature)</Label>
                        <Slider defaultValue={[0.2]} min={0} max={1} step={0.1} />
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Grounded & Factual</span>
                            <span>Creative & Suggestive</span>
                        </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <Label>Response Length</Label>
                            <Select defaultValue="default">
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="brief">Brief</SelectItem>
                                    <SelectItem value="default">Default</SelectItem>
                                    <SelectItem value="detailed">Detailed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="space-y-3">
                            <Label>Default Language</Label>
                            <Select defaultValue="en">
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="en">English</SelectItem>
                                    <SelectItem value="hi" disabled>Hindi (coming soon)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><ShieldCheck/> Safety & Governance</CardTitle>
                        <CardDescription>Establish and enforce the ethical and safety rules for the AI's outputs.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-3">
                            <Label>Content Safety Filters</Label>
                             <Select defaultValue="moderate">
                                <SelectTrigger><SelectValue/></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="strict">Strict</SelectItem>
                                    <SelectItem value="moderate">Moderate</SelectItem>
                                    <SelectItem value="permissive">Permissive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border p-3">
                            <Label htmlFor="pii-redaction" className="font-medium">PII & Data Redaction</Label>
                            <Switch id="pii-redaction" defaultChecked={true} />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>

         <Card>
            <CardHeader>
                <CardTitle>Prompt & Template Management</CardTitle>
                <CardDescription>Define the AI's persona and core instructions to ensure consistent behavior.</CardDescription>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="aiPersona"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Curevan Assistant System Prompt</FormLabel>
                            <FormControl>
                                <Textarea 
                                    placeholder="e.g., You are a helpful, professional assistant..." 
                                    defaultValue={assistantPrompt}
                                    rows={15}
                                    {...field}
                                />
                            </FormControl>
                            <FormDescription>This prompt guides the AI's personality and constraints.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
            <CardFooter>
                 <Button><Save className="mr-2"/>Save Prompt</Button>
            </CardFooter>
        </Card>


        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
             <Card>
                <CardHeader>
                  <CardTitle>Global RAG Settings</CardTitle>
                   <CardDescription>Manage the knowledge base for the Curevan AI Assistant.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <h4 className="font-medium">Indexed Content Sources</h4>
                        <div className="space-y-3">
                            <RagSource icon={FileText} label="Documentation (SOPs)" id="sop-source" />
                            <RagSource icon={BookOpen} label="Journal (Blog Posts)" id="journal-source" />
                            <RagSource icon={GraduationCap} label="Training Materials" id="training-source" />
                        </div>
                    </div>
                  <Button onClick={handleRebuildIndex}>
                    <RefreshCw className="mr-2"/>
                    Re-index All Content
                  </Button>
                </CardContent>
              </Card>

             <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><BarChart /> Analytics & Reporting</CardTitle>
                    <CardDescription>Understand how the AI is being used and its performance.</CardDescription>
                </CardHeader>
                <CardContent className="grid sm:grid-cols-3 gap-4">
                    <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-3xl font-bold">{Math.floor(Math.random() * 500) + 1000}</p>
                        <p className="text-sm text-muted-foreground">Total Queries (24h)</p>
                    </div>
                     <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-3xl font-bold">{Math.floor(Math.random() * 10) + 88}%</p>
                        <p className="text-sm text-muted-foreground">Positive Feedback</p>
                    </div>
                     <div className="p-4 bg-muted rounded-lg text-center">
                        <p className="text-3xl font-bold">{Math.floor(Math.random() * 20)}</p>
                        <p className="text-sm text-muted-foreground">Flagged Responses</p>
                    </div>
                </CardContent>
                <CardFooter className="gap-2">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline" className="w-full"><BarChart className="mr-2"/>View Usage Dashboard</Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>AI Usage Dashboard</DialogTitle>
                                <DialogDescription>Overview of AI assistant usage for the last 7 days.</DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                                <DashboardCard title="Daily Queries" type="line" data={usageData} categoryKey="date" valueKey="queries" />
                            </div>
                        </DialogContent>
                    </Dialog>
                    <Dialog>
                        <DialogTrigger asChild>
                           <Button variant="outline" className="w-full"><Bot className="mr-2"/>View Query Logs</Button>
                        </DialogTrigger>
                         <DialogContent className="max-w-3xl">
                            <DialogHeader>
                                <DialogTitle>Recent Query Logs</DialogTitle>
                                <DialogDescription>A log of the most recent interactions with the AI assistant.</DialogDescription>
                            </DialogHeader>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>User</TableHead>
                                        <TableHead>Query</TableHead>
                                        <TableHead>Feedback</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {queryLogs.map(log => (
                                        <TableRow key={log.id}>
                                            <TableCell className="font-mono text-xs">{log.user}</TableCell>
                                            <TableCell className="text-sm line-clamp-2">{log.query}</TableCell>
                                            <TableCell>
                                                {log.feedback === 'positive' ? <ThumbsUp className="text-green-500"/> : <ThumbsDown className="text-destructive"/>}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </DialogContent>
                    </Dialog>
                    <Button variant="outline" className="w-full" onClick={handleExportFeedback}>
                        <FileDown className="mr-2" /> Export Feedback
                    </Button>
                </CardFooter>
            </Card>
        </div>
      
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><TestTube /> Test Query</CardTitle>
            <CardDescription>Run a test query against the current index to check AI responses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Textarea 
                placeholder="Ask the AI a question..." 
                value={testQuery}
                onChange={(e) => setTestQuery(e.target.value)}
            />
            <Button onClick={handleRunTest} disabled={isTesting || !testQuery}>
                {isTesting && <Loader2 className="mr-2 animate-spin" />}
                Run Test
            </Button>
        </CardContent>
      </Card>
      
      {(isTesting || testResponse) && (
        <Card>
            <CardHeader>
                <CardTitle>Response</CardTitle>
            </CardHeader>
            <CardContent>
                {isTesting ? (
                    <div className="flex items-center text-muted-foreground">
                        <Loader2 className="mr-2 animate-spin" />
                        Generating response...
                    </div>
                ) : (
                    <Alert>
                        <Bot className="h-4 w-4" />
                        <AlertTitle>AI Assistant</AlertTitle>
                        <p className="whitespace-pre-wrap font-mono text-sm">{testResponse}</p>
                    </Alert>
                )}
            </CardContent>
        </Card>
      )}

    </div>
    </Form>
  );
}
