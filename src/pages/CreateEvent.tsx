import { Link } from 'react-router-dom';
import { CalendarCheck, ArrowLeft } from 'lucide-react';
import { EventForm } from '@/components/EventForm';
import { Button } from '@/components/ui/button';

const CreateEvent = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Freetime Matcher</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-lg mx-auto">
          <Link to="/">
            <Button variant="ghost" size="sm" className="mb-6">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          
          {/* Form Card */}
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-lg">
            <h1 className="text-xl font-semibold mb-6 text-center">
              Create Your Event
            </h1>
            <EventForm />
          </div>
        </div>
      </main>
    </div>
  );
};

export default CreateEvent;
