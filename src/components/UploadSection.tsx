import { useState } from "react";
import { Upload, FileText, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import JSZip from "jszip";
import { GlobalWorkerOptions, getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";
// @ts-ignore - Vite will inline url for pdf.worker
import pdfWorker from "pdfjs-dist/legacy/build/pdf.worker.min.js?url";

GlobalWorkerOptions.workerSrc = pdfWorker as any;

interface UploadSectionProps {
  onContentSubmit: (content: string, title: string, fileType?: string) => void;
  loading: boolean;
}

export const UploadSection = ({ onContentSubmit, loading }: UploadSectionProps) => {
  const [content, setContent] = useState("");
  const [title, setTitle] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const { toast } = useToast();

  const parseDocument = async (file: File): Promise<string> => {
    try {
      // PDF parsing
      if (file.type === 'application/pdf') {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await getDocument({ data: arrayBuffer }).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const content = await page.getTextContent();
          const strings = (content.items as any[])
            .map((it: any) => (typeof it?.str === 'string' ? it.str : ''))
            .join(' ');
          fullText += `\n\n--- Page ${i} ---\n${strings}`;
        }
        return fullText.trim();
      }

      // PPTX parsing
      if (file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const slides = Object.keys(zip.files)
          .filter((n) => n.startsWith('ppt/slides/slide') && n.endsWith('.xml'))
          .sort((a, b) => {
            const na = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
            const nb = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
            return na - nb;
          });

        let fullText = '';
        for (const slide of slides) {
          const xml = await zip.files[slide].async('string');
          const matches = Array.from(xml.matchAll(/<a:t>([\s\S]*?)<\/a:t>/g));
          const text = matches.map((m) => m[1]).join(' ');
          const slideNum = slide.match(/slide(\d+)\.xml/)?.[1] || '';
          fullText += `\n\n--- Slide ${slideNum} ---\n${text}`;
        }
        return fullText.trim();
      }

      // Legacy .ppt not supported for text extraction here
      return '';
    } catch (e) {
      console.error("Document parse error:", e);
      return "";
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleFile(e.target.files[0]);
    }
  };

  const handleFile = async (file: File) => {
    const validTypes = [
      'text/plain',
      'application/pdf',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    ];
    
    if (!validTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a TXT, PDF, or PPT file.",
        variant: "destructive",
      });
      return;
    }

    try {
      let text = '';
      if (file.type === 'text/plain') {
        text = await file.text();
      } else {
        // Legacy .ppt is not supported for text extraction
        if (file.type === 'application/vnd.ms-powerpoint') {
          toast({
            title: "Legacy PPT not supported",
            description: "Please convert .ppt to PPTX (.pptx) or PDF, then upload.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "Processing file",
          description: "Extracting text from your document...",
        });

        text = await parseDocument(file);
        if (!text) {
          toast({
            title: "Could not read file",
            description: "We couldn't extract text. Try another file or paste the text.",
            variant: "destructive",
          });
          return;
        }
      }

      setContent(text);
      setTitle(file.name.replace(/\.[^/.]+$/, ""));
      toast({
        title: "File loaded",
        description: `${file.name} has been processed successfully.`,
      });
    } catch (error) {
      console.error('File read error:', error);
      toast({
        title: "Error reading file",
        description: "Could not read the file. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmit = () => {
    if (!content.trim() || !title.trim()) {
      toast({
        title: "Missing information",
        description: "Please provide both a title and content.",
        variant: "destructive",
      });
      return;
    }
    onContentSubmit(content, title);
  };

  return (
    <Card className="shadow-lg transition-all hover:shadow-xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary" />
          Upload Study Material
        </CardTitle>
        <CardDescription>
          Upload your lecture notes or paste content directly to get started
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            placeholder="e.g., Introduction to Psychology - Chapter 1"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={loading}
          />
        </div>

        <div
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-all ${
            dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25"
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            id="file-upload"
            className="hidden"
            accept=".txt,.pdf,.ppt,.pptx"
            onChange={handleFileInput}
            disabled={loading}
          />
          <label
            htmlFor="file-upload"
            className="flex flex-col items-center gap-2 cursor-pointer"
          >
            <Upload className="w-12 h-12 text-muted-foreground" />
            <p className="text-sm font-medium">
              Drag and drop your file here, or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Supports: TXT, PDF, PPT files
            </p>
          </label>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">Or paste text</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="content">Content</Label>
          <Textarea
            id="content"
            placeholder="Paste your lecture notes or study material here..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            disabled={loading}
            className="resize-none"
          />
        </div>

        <Button
          onClick={handleSubmit}
          disabled={loading || !content.trim() || !title.trim()}
          className="w-full"
          size="lg"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />
              Generate Study Materials
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};