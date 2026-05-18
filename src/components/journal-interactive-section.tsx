"use client";

import React, { useState, useEffect } from "react";
import { 
  Facebook, 
  Linkedin, 
  Share2, 
  Copy, 
  Check, 
  HelpCircle,
  Sparkles,
  Send
} from "lucide-react";
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface FAQ {
  question: string;
  answer: string;
}

interface JournalInteractiveSectionProps {
  slug: string;
  title: string;
}

const exerciseFAQs: FAQ[] = [
  {
    question: "What is the primary benefit of the Double Knees-to-Chest stretch?",
    answer: "It gently flexes the lumbar spine, which opens up the spaces between spinal vertebrae (spinal decompression). This reduces pressure on spinal discs and nerves, providing immediate relief from lower back stiffness and muscle tension."
  },
  {
    question: "How often should I perform the Double Knees-to-Chest exercise?",
    answer: "For general relief and flexibility, you can perform it 1 to 2 times daily. It is particularly effective first thing in the morning to relieve overnight stiffness, or at night before sleeping to relax the lumbar muscles."
  },
  {
    question: "Is it normal to feel pain during this stretch?",
    answer: "No. You should feel a comfortable, gentle pulling sensation in your lower back, glutes, and hips. If you experience any sharp, pinching, or shooting pain, stop immediately and consult a certified physical therapist."
  },
  {
    question: "Can pregnant women perform the Double Knees-to-Chest stretch?",
    answer: "Yes, but in later stages of pregnancy, it must be modified. You should bring your knees wider apart around the abdomen rather than directly to the chest, or substitute it with safer prenatal stretches. Always consult your obstetrician or therapist first."
  },
  {
    question: "How long should I hold the stretch?",
    answer: "Hold the stretch statically for 20 to 30 seconds. Focus on taking deep, slow diaphragmatic breaths. Maintain smooth, controlled breathing and avoid bouncing (ballistic stretching), which can cause muscle strain."
  }
];

const defaultFAQs: FAQ[] = [
  {
    question: "How do I know if this physical therapy exercise is right for my condition?",
    answer: "While these exercises are generally safe and therapeutic, everyone's body is different. We highly recommend booking a consultation with one of our certified physical therapists to get a personalized assessment."
  },
  {
    question: "What should I do if my symptoms worsen after performing a stretch?",
    answer: "If you feel increased pain, numbness, or tingling after any exercise, stop performing it immediately. Rest in a comfortable position and consult a professional therapist to modify the movements."
  },
  {
    question: "How long does it typically take to see results from daily stretching?",
    answer: "Many individuals feel immediate relief from muscle tension directly after a stretch. For long-term improvements in flexibility, posture, and chronic pain reduction, consistent practice over 2 to 4 weeks is typically required."
  }
];

export default function JournalInteractiveSection({ slug, title }: JournalInteractiveSectionProps) {
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    // Set current URL on mount (browser only)
    setShareUrl(window.location.href);
    setCanShare(!!navigator.share);
  }, []);

  const getEffectiveShareUrl = () => {
    let currentUrl = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (currentUrl.includes("localhost") || currentUrl.includes("127.0.0.1")) {
      currentUrl = currentUrl.replace(/https?:\/\/localhost:\d+/, "https://www.curevan.com");
    }
    return currentUrl;
  };

  const handleCopyLink = async () => {
    try {
      const urlToCopy = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
      await navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error("Failed to copy link:", err);
    }
  };

  const handleSystemShare = async () => {
    if (navigator.share) {
      try {
        const urlToShare = getEffectiveShareUrl();
        await navigator.share({
          title: title,
          text: `Check out this expert therapy guide on Curevan: ${title}`,
          url: urlToShare,
        });
      } catch (err) {
        console.error("Error sharing via device:", err);
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSocialShare = (platform: "facebook" | "twitter" | "linkedin" | "whatsapp" | "telegram" | "reddit") => {
    const urlToShare = getEffectiveShareUrl();
    const encodedUrl = encodeURIComponent(urlToShare);
    const encodedTitle = encodeURIComponent(title);

    let shareUrl = "";
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=Check%20out%20this%20article:%20${encodedTitle}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case "whatsapp":
        shareUrl = `https://api.whatsapp.com/send?text=Check%20out%20this%20article:%20${encodedTitle}%20-%20${encodedUrl}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodedUrl}&text=Check%20out%20this%20expert%20therapy%20guide:%20${encodedTitle}`;
        break;
      case "reddit":
        shareUrl = `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
    }
  };

  const isExercise = slug === "double-knees-to-chest-exercise";
  const faqs = isExercise ? exerciseFAQs : defaultFAQs;

  return (
    <div className="mt-12 space-y-12 border-t pt-10">
      {/* Premium Share Section */}
      <div className="bg-gradient-to-r from-primary/5 via-muted/50 to-primary/5 rounded-2xl p-6 md:p-8 border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Spread the Wellness</span>
            </div>
            <h3 className="text-xl font-bold font-headline">Share this Expert Therapy Guide</h3>
            <p className="text-muted-foreground text-sm">
              Help your friends, family, or colleagues discover effective stretches to relieve back pain.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-3 items-center">
            {/* LinkedIn */}
            <Button
              onClick={() => handleSocialShare("linkedin")}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-[#0077b5]/10 hover:text-[#0077b5] hover:border-[#0077b5] gap-2 transition-all duration-300 font-semibold shadow-sm cursor-pointer"
            >
              <Linkedin className="w-4 h-4 fill-current" />
              <span>LinkedIn</span>
            </Button>

            {/* Facebook */}
            <Button
              onClick={() => handleSocialShare("facebook")}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-[#1877f2]/10 hover:text-[#1877f2] hover:border-[#1877f2] gap-2 transition-all duration-300 font-semibold shadow-sm cursor-pointer"
            >
              <Facebook className="w-4 h-4 fill-current" />
              <span>Facebook</span>
            </Button>

            {/* Twitter */}
            <Button
              onClick={() => handleSocialShare("twitter")}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-black/10 hover:text-black hover:border-black dark:hover:text-white dark:hover:border-white gap-2 transition-all duration-300 font-semibold shadow-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>Twitter</span>
            </Button>

            {/* WhatsApp */}
            <Button
              onClick={() => handleSocialShare("whatsapp")}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-[#25d366]/10 hover:text-[#25d366] hover:border-[#25d366] gap-2 transition-all duration-300 font-semibold shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.464L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.793 1.451 5.32 0 9.646-4.327 9.649-9.65.001-2.578-1.001-5.001-2.822-6.824C16.444 2.308 14.02 1.3 11.442 1.3 6.121 1.3 1.793 5.628 1.79 10.95c-.001 1.737.458 3.429 1.332 4.943l-.974 3.559 3.649-.958z" />
              </svg>
              <span>WhatsApp</span>
            </Button>

            {/* Telegram */}
            <Button
              onClick={() => handleSocialShare("telegram")}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-[#0088cc]/10 hover:text-[#0088cc] hover:border-[#0088cc] gap-2 transition-all duration-300 font-semibold shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Telegram</span>
            </Button>

            {/* Reddit */}
            <Button
              onClick={() => handleSocialShare("reddit")}
              variant="outline"
              size="sm"
              className="bg-white hover:bg-[#ff4500]/10 hover:text-[#ff4500] hover:border-[#ff4500] gap-2 transition-all duration-300 font-semibold shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-.421.927 7.042 7.042 0 0 1 .15 1.439c0 3.01-3.649 5.45-8.15 5.45s-8.15-2.44-8.15-5.45c0-.501.1-.98.272-1.425a1.25 1.25 0 0 1-.39-.94A1.25 1.25 0 0 1 2.82 4.744c.563 0 1.042.374 1.205.887 1.637-.624 3.738-1.025 6.038-1.096l1.282-4.032 4.195.892a1.054 1.054 0 0 1-.036.273 1.055 1.055 0 1 1 1.055 1.055 1.052 1.052 0 0 1-1.055-1.055l-3.76-.8-1.155 3.633c2.316.067 4.43.468 6.079 1.102a1.25 1.25 0 0 1 1.196-.913z" />
              </svg>
              <span>Reddit</span>
            </Button>

            {/* Native device sharing (Instagram / Threads / Messages / etc.) */}
            {canShare && (
              <Button
                onClick={handleSystemShare}
                variant="default"
                size="sm"
                className="bg-primary text-white hover:bg-primary/95 gap-2 transition-all duration-300 font-semibold shadow-sm"
              >
                <Share2 className="w-4 h-4" />
                <span>Share App</span>
              </Button>
            )}

            {/* Copy Link */}
            <Button
              onClick={handleCopyLink}
              variant={copied ? "default" : "outline"}
              size="sm"
              className={`gap-2 transition-all duration-300 font-semibold shadow-sm ${
                copied ? "bg-green-600 text-white hover:bg-green-700 hover:text-white" : "bg-white"
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Link</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Premium FAQ Accordion Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-headline">Frequently Asked Questions</h2>
            <p className="text-sm text-muted-foreground">
              {isExercise 
                ? "Key clinical guidelines and tips about the Double Knees-to-Chest stretch from our physical therapists."
                : "Common therapeutic queries answered by Curevan's medical board."
              }
            </p>
          </div>
        </div>

        <Card className="overflow-hidden border shadow-sm">
          <CardContent className="p-0 divide-y divide-border">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`faq-${index}`}
                  className="px-6 py-1 border-none hover:bg-muted/30 transition-colors duration-200"
                >
                  <AccordionTrigger className="text-base font-bold font-headline text-left hover:no-underline text-foreground py-4 flex items-center justify-between w-full">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-[15px] leading-relaxed pb-5 pr-4">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
