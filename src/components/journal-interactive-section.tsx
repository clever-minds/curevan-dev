"use client";

import React, { useState, useEffect } from "react";
import { 
  Facebook, 
  Linkedin, 
  Share2, 
  Copy, 
  Check, 
  Sparkles,
  Send
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface JournalInteractiveSectionProps {
  slug: string;
  title: string;
}

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



  return (
    <div className="mt-12 border-t pt-10">
      {/* Premium Share Section */}
      <div className="bg-gradient-to-r from-primary/5 via-muted/50 to-primary/5 rounded-2xl p-6 md:p-8 border shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-primary font-bold text-sm uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Spread the Wellness</span>
            </div>
            <h3 className="text-xl font-bold font-headline">Share this Article</h3>
            <p className="text-muted-foreground text-sm">
              Help your friends, family, or colleagues discover this guide.
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            {/* LinkedIn */}
            <Button
              onClick={() => handleSocialShare("linkedin")}
              variant="outline"
              size="icon"
              title="Share on LinkedIn"
              className="bg-white hover:bg-[#0077b5]/10 hover:text-[#0077b5] hover:border-[#0077b5] transition-all duration-300 shadow-sm cursor-pointer"
            >
              <Linkedin className="w-4 h-4 fill-current" />
            </Button>

            {/* Facebook */}
            <Button
              onClick={() => handleSocialShare("facebook")}
              variant="outline"
              size="icon"
              title="Share on Facebook"
              className="bg-white hover:bg-[#1877f2]/10 hover:text-[#1877f2] hover:border-[#1877f2] transition-all duration-300 shadow-sm cursor-pointer"
            >
              <Facebook className="w-4 h-4 fill-current" />
            </Button>

            {/* Twitter / X */}
            <Button
              onClick={() => handleSocialShare("twitter")}
              variant="outline"
              size="icon"
              title="Share on X (Twitter)"
              className="bg-white hover:bg-black/10 hover:text-black hover:border-black dark:hover:text-white dark:hover:border-white transition-all duration-300 shadow-sm cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </Button>

            {/* WhatsApp */}
            <Button
              onClick={() => handleSocialShare("whatsapp")}
              variant="outline"
              size="icon"
              title="Share on WhatsApp"
              className="bg-white hover:bg-[#25d366]/10 hover:text-[#25d366] hover:border-[#25d366] transition-all duration-300 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.464L0 24zm6.59-4.846c1.6.95 3.197 1.451 4.793 1.451 5.32 0 9.646-4.327 9.649-9.65.001-2.578-1.001-5.001-2.822-6.824C16.444 2.308 14.02 1.3 11.442 1.3 6.121 1.3 1.793 5.628 1.79 10.95c-.001 1.737.458 3.429 1.332 4.943l-.974 3.559 3.649-.958z" />
              </svg>
            </Button>

            {/* Telegram */}
            <Button
              onClick={() => handleSocialShare("telegram")}
              variant="outline"
              size="icon"
              title="Share on Telegram"
              className="bg-white hover:bg-[#0088cc]/10 hover:text-[#0088cc] hover:border-[#0088cc] transition-all duration-300 shadow-sm cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </Button>

            {/* Reddit */}
            <Button
              onClick={() => handleSocialShare("reddit")}
              variant="outline"
              size="icon"
              title="Share on Reddit"
              className="bg-white hover:bg-[#ff4500]/10 hover:text-[#ff4500] hover:border-[#ff4500] transition-all duration-300 shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-.421.927 7.042 7.042 0 0 1 .15 1.439c0 3.01-3.649 5.45-8.15 5.45s-8.15-2.44-8.15-5.45c0-.501.1-.98.272-1.425a1.25 1.25 0 0 1-.39-.94A1.25 1.25 0 0 1 2.82 4.744c.563 0 1.042.374 1.205.887 1.637-.624 3.738-1.025 6.038-1.096l1.282-4.032 4.195.892a1.054 1.054 0 0 1-.036.273 1.055 1.055 0 1 1 1.055 1.055 1.052 1.052 0 0 1-1.055-1.055l-3.76-.8-1.155 3.633c2.316.067 4.43.468 6.079 1.102a1.25 1.25 0 0 1 1.196-.913z" />
              </svg>
            </Button>

            {/* Native device sharing */}
            {canShare && (
              <Button
                onClick={handleSystemShare}
                variant="default"
                size="icon"
                title="Share via device"
                className="bg-primary text-white hover:bg-primary/95 transition-all duration-300 shadow-sm"
              >
                <Share2 className="w-4 h-4" />
              </Button>
            )}

            {/* Copy Link */}
            <Button
              onClick={handleCopyLink}
              variant={copied ? "default" : "outline"}
              size="icon"
              title={copied ? "Copied!" : "Copy Link"}
              className={`transition-all duration-300 shadow-sm ${
                copied ? "bg-green-600 text-white hover:bg-green-700 hover:text-white" : "bg-white"
              }`}
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
