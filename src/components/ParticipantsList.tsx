import { useState } from 'react';
import { ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface ParticipantsListProps {
  participants: string[];
}

const ITEMS_PER_PAGE = 5;

export const ParticipantsList = ({ participants }: ParticipantsListProps) => {
  const [page, setPage] = useState(0);
  
  const totalPages = Math.ceil(participants.length / ITEMS_PER_PAGE);
  const startIdx = page * ITEMS_PER_PAGE;
  const currentParticipants = participants.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  
  const handlePrev = () => setPage(p => Math.max(0, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages - 1, p + 1));

  if (participants.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Respondents
          <span className="text-sm font-normal text-muted-foreground ml-auto">
            {participants.length} total
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <ul className="space-y-1">
          {currentParticipants.map((name, idx) => (
            <li key={startIdx + idx} className="text-sm py-1 px-2 rounded bg-secondary/50">
              {name}
            </li>
          ))}
        </ul>
        
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={handlePrev}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Prev
            </Button>
            <span className="text-xs text-muted-foreground">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleNext}
              disabled={page === totalPages - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
