
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Replace } from 'lucide-react';

interface AiSuggestionBoxProps {
  suggestion: string;
  isLoading: boolean;
  onUseSuggestion: () => void;
  title?: string;
  description?: string;
}

export function AiSuggestionBox({
  suggestion,
  isLoading,
  onUseSuggestion,
  title = "AI Suggestion",
  description = "AI-powered suggestions will appear here."
}: AiSuggestionBoxProps) {
  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold">
          <Sparkles className="w-5 h-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="capitalize">
          {description}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-40 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Generating...</span>
          </div>
        ) : suggestion ? (
          <div className="space-y-4">
            <div className="p-4 bg-background rounded-md border max-h-96 overflow-y-auto">
              <p className="text-sm whitespace-pre-wrap">{suggestion}</p>
            </div>
            <Button onClick={onUseSuggestion} className="w-full">
              <Replace className="mr-2 h-4 w-4" />
              Use This Version
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 text-center text-muted-foreground">
            <p>Suggestions will appear here once you request them.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
