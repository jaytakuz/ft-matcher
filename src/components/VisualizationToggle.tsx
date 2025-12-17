import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import type { VisualizationMode } from '@/types/event';

interface VisualizationToggleProps {
  mode: VisualizationMode;
  onChange: (mode: VisualizationMode) => void;
}

export const VisualizationToggle = ({ mode, onChange }: VisualizationToggleProps) => {
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-muted-foreground">View:</span>
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(value) => value && onChange(value as VisualizationMode)}
        className="bg-secondary/50 rounded-lg p-1"
      >
        <ToggleGroupItem
          value="heatmap"
          aria-label="Heatmap view"
          className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3 text-sm"
        >
          Heatmap
        </ToggleGroupItem>
        <ToggleGroupItem
          value="traffic"
          aria-label="Traffic light view"
          className="data-[state=on]:bg-background data-[state=on]:shadow-sm px-3 text-sm"
        >
          Traffic Light
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
  );
};
