import { CalendarCheck, Users, Zap, ArrowRight } from 'lucide-react';
import { EventForm } from '@/components/EventForm';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">Freetime Matcher</span>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="container mx-auto px-4 py-12 md:py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Find the perfect time to{' '}
              <span className="text-primary">meet</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Stop the endless back-and-forth. Create an event, share the link, and let everyone mark their availability. We'll find the overlap.
            </p>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <FeatureCard
              icon={<Zap className="h-5 w-5" />}
              title="Quick Setup"
              description="Create an event in seconds with just a name and dates"
            />
            <FeatureCard
              icon={<Users className="h-5 w-5" />}
              title="Visual Overlap"
              description="See everyone's availability with an intuitive heatmap"
            />
            <FeatureCard
              icon={<CalendarCheck className="h-5 w-5" />}
              title="Smart Suggestions"
              description="Get ranked recommendations for the best meeting times"
            />
          </div>

          {/* Form Card */}
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 shadow-lg">
            <h2 className="text-xl font-semibold mb-6 text-center">
              Create Your Event
            </h2>
            <EventForm />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border py-8 mt-20">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Built for teams who value their time.</p>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) => (
  <div className="p-5 rounded-lg bg-secondary/30 border border-border/50">
    <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-3">
      {icon}
    </div>
    <h3 className="font-medium mb-1">{title}</h3>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export default Index;
