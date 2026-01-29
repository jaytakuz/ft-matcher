import { useState } from 'react';
import { User, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ParticipantFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, email?: string) => void;
  requireEmail?: boolean;
}

export const ParticipantForm = ({ open, onClose, onSubmit, requireEmail = false }: ParticipantFormProps) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim() && (!requireEmail || email.trim())) {
      onSubmit(name.trim(), email.trim() || undefined);
      setName('');
      setEmail('');
    }
  };

  const isFormValid = name.trim() && (!requireEmail || email.trim());

  const handleClose = () => {
    setName('');
    setEmail('');
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Join Event</DialogTitle>
          <DialogDescription>
            Enter your details to add your availability to this event.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="participantName">Your Name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="participantName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="pl-10"
                autoFocus
              />
            </div>
          </div>
          {requireEmail && (
            <div className="space-y-2">
              <Label htmlFor="participantEmail">
                Email <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="participantEmail"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Required for calendar invite
              </p>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!isFormValid}>
              Join
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};