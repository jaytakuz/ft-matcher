import type { VisualizationMode } from '@/types/event';

interface LegendProps {
  mode: VisualizationMode;
}

export const Legend = ({ mode }: LegendProps) => {
  if (mode === 'heatmap') {
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
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 rounded bg-traffic-red" />
        <span className="text-muted-foreground">&lt;30%</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 rounded bg-traffic-yellow" />
        <span className="text-muted-foreground">30-99%</span>
      </div>
      <div className="flex items-center gap-1">
        <div className="w-4 h-4 rounded bg-traffic-green" />
        <span className="text-muted-foreground">100%</span>
      </div>
    </div>
  );
};
