
import { ShieldCheck, HeartHandshake, Package, FileText, Users, GitCommit, Zap, CheckCircle, BrainCircuit, Rocket, Scale, Milestone, Eye, Goal, Heart, Handshake, Shield, Star, Lightbulb, Accessibility } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Our Mission: Fixing Home Healthcare | Curevan',
  description: 'Learn about Curevan\'s mission to fix home healthcare with a system of continuous care, standardized protocols, and verified professionals. Discover what makes us different.',
};

const values = [
    { icon: Heart, title: "Compassion", description: "We care with empathy and respect for every patient. Our team is dedicated to understanding each individual's unique needs and providing support with kindness and consideration." },
    { icon: Handshake, title: "Trust", description: "We provide safe, transparent, and accountable services. Our patients can rely on us to deliver on our promises and maintain the highest standards of care and professionalism." },
    { icon: Shield, title: "Privacy", description: "We protect every patient's personal and health data with strict confidentiality. Our security measures and protocols ensure that sensitive information remains private and secure." },
    { icon: Star, title: "Excellence", description: "We follow clinical standards and improve every day. Our commitment to continuous learning and quality improvement ensures that we deliver the best possible care to our patients." },
    { icon: Lightbulb, title: "Innovation", description: "We use technology and portable tools to make care smarter. By embracing cutting-edge solutions, we enhance the patient experience and improve health outcomes." },
    { icon: Accessibility, title: "Accessibility", description: "We are affordable and available to all, anywhere. We believe that quality healthcare should be accessible to everyone, regardless of location or financial circumstances." },
];

const features = [
    {
        icon: GitCommit,
        title: "Fragmented care → Continuous Care",
        description: "Every patient gets a personalized plan of care with milestones, exercise protocols, and re-assessment dates. Session notes are logged in secure digital records that follow you from home to clinic to tele-review."
    },
    {
        icon: Milestone,
        title: "One-off visits → Structured Programs",
        description: "We convert requests into goal-based programs (e.g., back pain recovery, post-op rehab, mobility training) with defined frequency, therapist skills required, and outcome measures."
    },
    {
        icon: FileText,
        title: "Guesswork → Standard Operating Protocols (SOPs)",
        description: "Therapists work with evidence-informed SOPs and checklists for common conditions. No more “it depends”—our platform prompts assessments, red flags, and progression rules."
    },
    {
        icon: Package,
        title: "Tool mismatch → The Curevan Portable Kit",
        description: "A uniform, portable kit designed for home settings: assessment tools, supports, exercise aids, and safe electro-therapy devices (where appropriate). Therapists are trained and certified to use them correctly."
    },
    {
        icon: Users,
        title: "Last-minute matching → Right Therapist, Right Visit",
        description: "Our matching engine considers condition, goals, availability, location, and senior clinician oversight, not just distance—so the best-suited therapist shows up at your door."
    },
    {
        icon: Scale,
        title: "Unclear Costs → Transparent Plans",
        description: "Patients and therapists both see clear, upfront pricing. Premium vs. Free therapist plans, platform fees, GST, and TDS deductions are all automated and visible in the app. No hidden charges—every session generates invoices and digital receipts for peace of mind."
    }
];

const systemPillars = [
    {
        icon: Rocket,
        title: "Platform",
        points: [
            "Curevan App – Patients book visits, track sessions, and manage payments, while therapists use guided assessments, digital notes, and therapy plans.",
            "Clinical Oversight – Senior clinicians review complex cases, validate care plans, and intervene when red flags appear.",
            "Unified Health Record – Visit history, goals, progress graphs, and discharge summaries stored securely in one place."
        ]
    },
    {
        icon: FileText,
        title: "Protocols",
        points: [
            "Condition-based pathways (e.g., neck pain, knee OA, post-TKA, frozen shoulder, neuro-rehab basics).",
            "SOPs & Safety Checklists for home environments—space, equipment placement, infection control, caregiver guidance.",
            "Outcome Tracking: baseline → mid-program → exit—so you and your family can see improvement."
        ]
    },
    {
        icon: Users,
        title: "People",
        points: [
            "Background-verified, credentialed therapists with hands-on onboarding.",
            "Ongoing training in home-care ergonomics, communication, patient education, and device safety.",
            "Customer support for therapists (clinical helpline, case huddles, escalation to seniors)."
        ]
    }
]

const differentiators = [
    "Program, not just a visit: Clear start, milestones, and finish—no drifting.",
    "Standardized kits & SOPs: Same quality, every home, every time.",
    "Records that travel with you: One secure, shareable history.",
    "Clinician-led oversight: Seniors review, guide, and step in when needed.",
    "Therapist enablement: Training, tools, and real support in the field.",
    "Transparent outcomes: You can track progress—not just hope for it."
]


export default function AboutPage() {
  return (
    <>
      {/* Hero Section */}
      <section className="w-full py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4 md:px-6 text-center">
            <h1 className="text-4xl font-bold tracking-tight font-headline md:text-5xl">
            Fixing Home Healthcare with Continuous Care
            </h1>
            <p className="mt-2 text-sm text-muted-foreground font-semibold">A brand by Himaya Care Pvt. Ltd. • Established 2025</p>
            <p className="mt-6 max-w-3xl mx-auto text-lg text-muted-foreground">
            Curevan was started to fix the problems in home healthcare today. Families often rush to arrange last-minute visits, care plans stop after a few sessions, and there’s no single record of past treatments. Therapists also lack standard tools and support. Curevan changes this by giving you clear, continuous, and guided care at your doorstep—every time.
            </p>
        </div>
      </section>

      {/* Vision & Mission Section */}
      <section className="w-full py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <Card className="bg-muted/30 border-primary/20">
                <div className="grid md:grid-cols-2">
                    <div className="p-8">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 rounded-full">
                                <Eye className="w-8 h-8 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold font-headline">Our Vision</h2>
                        </div>
                        <p className="text-lg text-muted-foreground">To make reliable home healthcare available to every family, where care is continuous, organized, and guided by trusted professionals.</p>
                    </div>
                    <div className="p-8 bg-card rounded-r-lg">
                         <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-accent/10 rounded-full">
                                <Goal className="w-8 h-8 text-accent" />
                            </div>
                            <h2 className="text-3xl font-bold font-headline">Our Mission</h2>
                        </div>
                        <p className="text-lg text-muted-foreground">To connect patients with qualified therapists and doctors, provide them with the right tools, and ensure every session is tracked and guided by proven care standards—bringing quality healthcare to your doorstep.</p>
                    </div>
                </div>
            </Card>
        </div>
      </section>

      {/* Core Values Section */}
      <section className="w-full py-16 md:py-24 bg-card">
          <div className="container mx-auto px-4 md:px-6">
              <div className="text-center max-w-2xl mx-auto mb-16">
                  <h2 className="text-3xl font-bold font-headline md:text-4xl mb-4 gradient-text relative inline-block">
                      Our Core Values
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
                  </h2>
                  <p className="text-lg md:text-xl text-muted-foreground mt-8">The principles that guide everything we do and define who we are as an organization.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                  {values.map((value) => (
                      <div key={value.title} className="relative p-8 rounded-2xl text-white text-center flex flex-col items-center justify-center bg-animated-gradient shadow-xl transition-all duration-300 hover:-translate-y-2">
                          <div className="p-4 bg-white/20 rounded-full mb-4">
                              <value.icon className="w-8 h-8" />
                          </div>
                          <h3 className="text-2xl font-bold font-headline mb-2">{value.title}</h3>
                          <p className="text-white/80">{value.description}</p>
                      </div>
                  ))}
              </div>
          </div>
      </section>


      {/* What We Fix Section */}
      <section className="w-full py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl font-bold font-headline md:text-4xl mb-4 gradient-text relative inline-block">
                    What We Fix (And How)
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
                </h2>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {features.map(feature => (
                    <div key={feature.title} className="group text-center p-6 rounded-2xl bg-card border border-border/50 shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-0 bg-gradient-to-b from-primary/5 to-transparent transition-all duration-500 group-hover:h-full z-0"></div>
                        <div className="relative z-10">
                            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                                <div className="absolute inset-0 bg-primary/10 rounded-full transition-transform duration-300 group-hover:scale-110"></div>
                                <feature.icon className="w-10 h-10 text-primary" />
                            </div>
                            <h3 className="text-xl font-semibold font-headline md:text-2xl mb-2">{feature.title}</h3>
                            <p className="text-muted-foreground">{feature.description}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </section>
      
      {/* System Pillars Section */}
      <section className="w-full py-16 md:py-24 bg-card">
        <div className="container mx-auto px-4 md:px-6">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl font-bold font-headline md:text-4xl mb-4 gradient-text relative inline-block">
                    The Curevan System
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
                </h2>
                 <p className="text-lg md:text-xl text-muted-foreground mt-8">Our solution is built on three core pillars: Platform, Protocols, and People.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                {systemPillars.map(pillar => (
                    <Card key={pillar.title} className="h-full flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-2 bg-muted/30">
                        <CardHeader className="items-center text-center">
                            <div className="p-3 bg-primary/10 rounded-full mb-2">
                                <pillar.icon className="w-8 h-8 text-primary" />
                            </div>
                            <CardTitle>{pillar.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-1">
                            <ul className="space-y-3 text-base text-muted-foreground">
                                {pillar.points.map((point, i) => (
                                    <li key={i} className="flex items-start gap-2">
                                        <CheckCircle className="w-5 h-5 mt-1 text-primary flex-shrink-0" />
                                        <span>{point}</span>
                                    </li>
                                ))}
                            </ul>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
      </section>

      {/* Differentiators Section */}
      <section className="w-full py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 max-w-5xl">
            <div className="text-center max-w-2xl mx-auto mb-16">
                <h2 className="text-3xl font-bold font-headline md:text-4xl mb-4 gradient-text relative inline-block">
                    What Makes Us Different
                    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
                </h2>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {differentiators.map((text, i) => (
                    <div key={i} className="flex items-center gap-3 p-4 rounded-lg bg-card border">
                        <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
                        <span className="font-medium">{text}</span>
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* Philosophy Section */}
       <section className="w-full py-16 md:py-24 bg-card">
         <div className="container mx-auto px-4 md:px-6 max-w-5xl">
             <div className="grid md:grid-cols-2 gap-12 items-center">
                <div>
                    <h2 className="text-3xl font-bold font-headline md:text-4xl mb-4 gradient-text relative inline-block">
                        Why Curevan is Needed Today
                        <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
                    </h2>
                    <div className="space-y-4 text-lg text-muted-foreground mt-8">
                        <p>Modern lifestyles (long sitting, hybrid work, reduced activity) are fueling persistent pain and mobility issues.</p>
                        <p>Hospitals and clinics are busy; families prefer care at home—but quality varies and records get lost.</p>
                        <p>Eldercare and post-operative rehab require continuity, caregiver coaching, and simple tools that work outside the hospital.</p>
                        <p>Digital-first is not enough; what’s missing is the glue—protocols, equipment standards, and clinical supervision that make home care safe and effective.</p>
                        <p className="font-semibold text-foreground">Curevan brings hospital-grade organization to home visits without losing the human touch.</p>
                    </div>
                </div>
                <div className="space-y-6">
                    <Card className="border-primary/20">
                        <CardHeader>
                            <CardTitle className="text-xl font-headline">Our Care Philosophy</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                        <p className="font-bold text-lg text-primary">Recover. Strengthen. Maintain.</p>
                        <ul className="list-disc pl-5 text-muted-foreground">
                            <li><strong>Recover</strong> from pain or surgery with safe, guided care at home.</li>
                            <li><strong>Strengthen</strong> with progressive exercise, mobility, and function training.</li>
                            <li><strong>Maintain</strong> results with habits, home programs, and periodic tune-ups.</li>
                        </ul>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-xl font-headline">Safety, Privacy & Quality</CardTitle>
                        </CardHeader>
                        <CardContent>
                        <ul className="list-disc pl-5 text-muted-foreground">
                            <li>In-home safety protocols and red-flag pathways.</li>
                            <li>Equipment calibration & hygiene standards for every kit.</li>
                            <li>Encrypted records with role-based access.</li>
                            <li>Feedback loops after each session and measurable quality scores.</li>
                        </ul>
                        </CardContent>
                    </Card>
                </div>
            </div>
         </div>
      </section>
      
      {/* CTA Section */}
      <section className="w-full py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6 text-center">
            <h2 className="text-3xl font-bold font-headline md:text-4xl mb-4 gradient-text relative inline-block">
                The Meaning of “Curevan”
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-gradient-to-r from-primary to-accent rounded-full"></span>
            </h2>
            <p className="mt-8 text-lg text-muted-foreground">A simple promise inside our name: <span className="font-bold text-primary">Cure. Anywhere.</span></p>
            <p className="max-w-2xl mx-auto mt-2 text-muted-foreground">Think of a <span className="font-semibold">Cure</span> - Treatment & <span className="font-semibold">Van</span> – Mobility that brings trained people, the right tools, and the right plan to your space—on time, every time.</p>
            <Button asChild size="lg" className="mt-8">
            <Link href="/book">Get Started</Link>
            </Button>
        </div>
      </section>
    </>
  );
}
