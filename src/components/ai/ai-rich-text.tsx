

'use client';

import { useEditor, EditorContent, BubbleMenu } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Youtube from '@tiptap/extension-youtube';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  Heading1,
  Heading2,
  Undo,
  TextCursorInput,
  Sparkles,
  RefreshCcw,
  Plus,
  Minus,
  ThumbsUp,
  ThumbsDown,
  Strikethrough,
  ListOrdered,
  Quote,
  Code,
  Minus as HorizontalRuleIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  Image as ImageIcon,
  Youtube as YoutubeIcon,
  Undo2,
  Redo2,
  Video as VideoIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { refineContent } from '@/ai/flows/refine-content';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useEffect } from 'react';
import { logAIFeedbackAction } from '@/lib/actions';
import { nanoid } from 'nanoid';
import MediaLibraryModal from '../MediaLibraryModal';
import { listMedia } from '@/lib/api/media';
import { getToken } from '@/lib/auth';
import type { MediaItem, MediaFile } from '@/types/media';

const MEDIA_BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

const Video = Node.create({
  name: 'video',
  group: 'block',
  selectable: true,
  draggable: true,
  atom: true,

  addAttributes() {
    return {
      src: {
        default: null,
      },
      controls: {
        default: true,
      },
    }
  },

  parseHTML() {
    return [
      {
        tag: 'video',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['video', mergeAttributes(HTMLAttributes, { width: '100%', height: 'auto', class: 'rounded-lg border shadow-sm' })]
  },
})

interface AIRichTextProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  context?: {
    entityType: 'pcr' | 'post' | 'training' | 'documentation';
    entityId?: string;
    field?: string;
  };
  disabled?: boolean;
  minAIActionsChars?: number;
}

export function AIRichText({
  value,
  onChange,
  placeholder,
  context,
  disabled = false,
  minAIActionsChars = 140,
}: AIRichTextProps) {
  const { toast } = useToast();
  const [history, setHistory] = useState<string[]>([]);
  const [aiIsLoading, setAiIsLoading] = useState<string | null>(null);
  const [lastInteractionId, setLastInteractionId] = useState<string | null>(null);
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  // Media Library State
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [library, setLibrary] = useState<MediaItem[]>([]);
  const [upload, setUpload] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMedia = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) return;

      const data = await listMedia(token);

      const isVideo = (url: string) => {
        const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.m4v'];
        return videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
      };

      setLibrary(
        data.map((m: any) => ({
          id: m.id,
          url: m.file_path,
          type: isVideo(m.file_path) ? "video" : "image",
        }))
      );
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Fetch Failed",
        description: error.message || "Could not load media library",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (mediaModalOpen) {
      fetchMedia();
    }
  }, [mediaModalOpen, fetchMedia]);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        allowBase64: true,
      }),
      Youtube.configure({
        width: 480,
        height: 270,
      }),
      Video,
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'prose dark:prose-invert prose-sm sm:prose-base max-w-none break-all min-h-[150px] w-full rounded-md rounded-t-none border-0 px-3 py-2 focus:outline-none focus:ring-0',
      },
    },
  });

  useEffect(() => {
    if (editor && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  const handleAIAction = useCallback(async (instruction: string) => {
    if (!editor || aiIsLoading) return;

    const currentText = editor.getText();
    if (currentText.length < minAIActionsChars) {
      toast({
        variant: 'destructive',
        title: 'Not enough text',
        description: `Please write at least ${minAIActionsChars} characters to use AI actions.`,
      });
      return;
    }

    setAiIsLoading(instruction);
    setHistory((prev) => [...prev, editor.getHTML()]);
    setFeedbackGiven(false); // Reset feedback state for new interaction

    try {
      const interactionId = nanoid();
      setLastInteractionId(interactionId);
      const result = await refineContent({
        text: editor.getHTML(), // Send HTML to preserve formatting
        instruction,
        context,
      });

      if (result.refinedText) {
        editor.chain().focus().setContent(result.refinedText).run();
      } else {
        throw new Error('AI did not return refined text.');
      }
    } catch (error) {
      console.error('AI action failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Action Failed',
        description: 'Could not process the text. Please try again.',
      });
      // On failure, revert to the last state from history
      const lastState = history.pop();
      if (lastState) editor.chain().focus().setContent(lastState).run();
      setHistory(history);
    } finally {
      setAiIsLoading(null);
    }
  }, [editor, aiIsLoading, context, toast, minAIActionsChars, history]);

  const handleUndo = useCallback(() => {
    if (history.length > 0) {
      const lastState = history.pop();
      if (lastState) {
        editor?.chain().focus().setContent(lastState).run();
      }
      setHistory(history);
      setFeedbackGiven(true); // Can't give feedback on an undone action
    }
  }, [history, editor]);

  const handleFeedback = async (rating: 'positive' | 'negative') => {
    if (!lastInteractionId || feedbackGiven) return;
    await logAIFeedbackAction({
      context: 'pcr_refinement', // This could be more dynamic if needed
      interactionId: lastInteractionId,
      rating,
      response: editor?.getHTML(),
    });
    setFeedbackGiven(true);
    toast({ title: "Feedback Received", description: "Thank you!" });
  };


  if (!editor) {
    return null;
  }

  const hasContent = editor.getText().trim().length >= minAIActionsChars;

  return (
    <div className="rounded-md border bg-background">
      <div className="flex flex-wrap items-center gap-1 border-b p-2">
        <TooltipProvider>
          {/* Text Formatting */}
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive('bold') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleBold().run()} disabled={disabled}><Bold className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Bold</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive('italic') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleItalic().run()} disabled={disabled}><Italic className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Italic</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive('underline') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={disabled}><UnderlineIcon className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Underline</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive('strike') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleStrike().run()} disabled={disabled}><Strikethrough className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Strikethrough</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive('code') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleCode().run()} disabled={disabled}><Code className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Inline Code</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive('link') ? 'secondary' : 'ghost'} onClick={() => {
            const url = window.prompt('URL');
            if (url) editor.chain().focus().setLink({ href: url }).run();
          }} disabled={disabled}><LinkIcon className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Link</p></TooltipContent></Tooltip>

          {/* Headings */}
          <div className="w-px h-6 bg-border mx-1" />
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive('heading', { level: 1 }) ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} disabled={disabled}><Heading1 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Heading 1</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive('heading', { level: 2 }) ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} disabled={disabled}><Heading2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Heading 2</p></TooltipContent></Tooltip>

          {/* Lists */}
          <div className="w-px h-6 bg-border mx-1" />
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleBulletList().run()} disabled={disabled}><List className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Bullet List</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleOrderedList().run()} disabled={disabled}><ListOrdered className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Numbered List</p></TooltipContent></Tooltip>

          {/* Block Elements */}
          <div className="w-px h-6 bg-border mx-1" />
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive('blockquote') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleBlockquote().run()} disabled={disabled}><Quote className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Blockquote</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive('codeBlock') ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().toggleCodeBlock().run()} disabled={disabled}><Code className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Code Block</p></TooltipContent></Tooltip>

          {/* Alignment */}
          <div className="w-px h-6 bg-border mx-1" />
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive({ textAlign: 'left' }) ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().setTextAlign('left').run()} disabled={disabled}><AlignLeft className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Align Left</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive({ textAlign: 'center' }) ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().setTextAlign('center').run()} disabled={disabled}><AlignCenter className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Align Center</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant={editor.isActive({ textAlign: 'right' }) ? 'secondary' : 'ghost'} onClick={() => editor.chain().focus().setTextAlign('right').run()} disabled={disabled}><AlignRight className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Align Right</p></TooltipContent></Tooltip>

          {/* Media */}
          <div className="w-px h-6 bg-border mx-1" />
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant="ghost" onClick={() => setMediaModalOpen(true)} disabled={disabled}><ImageIcon className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Image from Library</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant="ghost" onClick={() => setMediaModalOpen(true)} disabled={disabled}><VideoIcon className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Video (YouTube or Library)</p></TooltipContent></Tooltip>

          {/* Horizontal Rule */}
          <div className="w-px h-6 bg-border mx-1" />
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().setHorizontalRule().run()} disabled={disabled}><HorizontalRuleIcon className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Horizontal Rule</p></TooltipContent></Tooltip>

          {/* History */}
          <div className="w-px h-6 bg-border mx-1" />
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().undo().run()} disabled={disabled || !editor.can().undo()}><Undo2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Undo</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant="ghost" onClick={() => editor.chain().focus().redo().run()} disabled={disabled || !editor.can().redo()}><Redo2 className="w-4 h-4" /></Button></TooltipTrigger><TooltipContent><p>Redo</p></TooltipContent></Tooltip>
        </TooltipProvider>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b p-2">
        <TooltipProvider>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant="outline" onClick={() => handleAIAction("Refine for clarity and professional tone")} disabled={!hasContent || disabled || !!aiIsLoading}><Sparkles className={cn(aiIsLoading === "Refine" && 'animate-spin')} />Refine</Button></TooltipTrigger><TooltipContent><p>Improve grammar and clarity.</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant="outline" onClick={() => handleAIAction("Compress the text to be about 30% shorter, while retaining the core meaning.")} disabled={!hasContent || disabled || !!aiIsLoading}><Minus className={cn(aiIsLoading === "Compress" && 'animate-spin')} />Compress</Button></TooltipTrigger><TooltipContent><p>Make the text more concise.</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant="outline" onClick={() => handleAIAction("Expand on the text to add clarity and structure, without changing the core meaning or adding new facts.")} disabled={!hasContent || disabled || !!aiIsLoading}><Plus className={cn(aiIsLoading === "Expand" && 'animate-spin')} />Expand</Button></TooltipTrigger><TooltipContent><p>Elaborate on the existing points.</p></TooltipContent></Tooltip>
          <Tooltip><TooltipTrigger asChild><Button type="button" size="sm" variant="outline" onClick={handleUndo} disabled={history.length === 0 || disabled || !!aiIsLoading}><Undo />Undo</Button></TooltipTrigger><TooltipContent><p>Undo last AI action.</p></TooltipContent></Tooltip>

          {!feedbackGiven && history.length > 0 && (
            <div className='flex items-center gap-1 ml-auto'>
              <Tooltip><TooltipTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleFeedback('positive')}><ThumbsUp className="w-4 h-4 text-muted-foreground" /></Button>
              </TooltipTrigger><TooltipContent><p>Good Suggestion</p></TooltipContent></Tooltip>
              <Tooltip><TooltipTrigger asChild>
                <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleFeedback('negative')}><ThumbsDown className="w-4 h-4 text-muted-foreground" /></Button>
              </TooltipTrigger><TooltipContent><p>Bad Suggestion</p></TooltipContent></Tooltip>
            </div>
          )}
        </TooltipProvider>
      </div>
      <EditorContent editor={editor} />
      <p className="px-3 pb-2 text-xs text-muted-foreground">AI assistance may contain errors. Review before saving.</p>

      {mediaModalOpen && (
        <MediaLibraryModal
          media={library}
          loading={loading}
          upload={upload}
          setUpload={setUpload}
          reloadMedia={fetchMedia}
          onClose={() => setMediaModalOpen(false)}
          multiple={false}
          onSelect={(items) => {
            if (items.length > 0) {
              const item = items[0];
              const fullUrl = item.url.startsWith("http") || item.url.startsWith("blob")
                ? item.url
                : `${MEDIA_BASE_URL}${item.url}`;
              
              if (item.type === 'video') {
                editor.chain().focus().insertContent(`<video src="${fullUrl}" controls width="100%" class="rounded-lg border shadow-sm"></video>`).run();
              } else {
                editor.chain().focus().setImage({ src: fullUrl }).run();
              }
            }
            setMediaModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
