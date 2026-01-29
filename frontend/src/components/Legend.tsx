import type { VisualizationMode } from '@/types/event';

interface LegendProps {
  mode: VisualizationMode;
}

export const Legend = ({ mode }: LegendProps) => {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>Less</span>
      <div className="flex">
        <div className="w-6 h-4 bg-available-0 border border-border/50" />
        <div className="w-6 h-4 bg-available-25" />
        <div className="w-6 h-4 bg-available-50" />
        <div className="w-6 h-4 bg-available-75" />
        <div className="w-6 h-4 bg-available-100" />
      </div>
      <span>More</span>
    </div>
  );
};
