import { useState } from 'react';
import { Copy, Check, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface EventCodeDisplayProps {
  eventId: string;
}

export const EventCodeDisplay = ({ eventId }: EventCodeDisplayProps) => {
  const { toast } = useToast();
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(eventId);
    setCopiedCode(true);
    toast({
      title: "Code copied!",
      description: "Event code has been copied to clipboard.",
    });
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyUrl = async () => {
    const url = window.location.href;
    await navigator.clipboard.writeText(url);
    setCopiedUrl(true);
    toast({
      title: "URL copied!",
      description: "Full event URL has been copied to clipboard.",
    });
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <h3 className="font-medium mb-3 text-sm text-muted-foreground">Event Code</h3>
      <div className="flex items-center gap-2 mb-3">
        <code className="flex-1 px-3 py-2 bg-muted rounded-md font-mono text-lg tracking-wider text-center">
          {eventId}
        </code>
        <Button
          variant="outline"
          size="icon"
          onClick={handleCopyCode}
          className="shrink-0"
        >
          {copiedCode ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleCopyUrl}
        className="w-full text-muted-foreground hover:text-foreground"
      >
        {copiedUrl ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            URL Copied!
          </>
        ) : (
          <>
            <Link className="h-4 w-4 mr-2" />
            Copy Full URL
          </>
        )}
      </Button>
    </div>
  );
};