import { Slider } from "@/components/ui/slider";

// Category definitions with labels
export const POLL_CATEGORIES = [
  { key: "categoryGraphics", label: "Graphics & Visuals" },
  { key: "categoryGameplay", label: "Gameplay Mechanics & Controls" },
  { key: "categoryFun", label: "Fun Factor / Engagement" },
  { key: "categoryStory", label: "Story & Narrative" },
  { key: "categorySound", label: "Sound Design & Music" },
  { key: "categoryPerformance", label: "Performance & Stability" },
  { key: "categoryInnovation", label: "Innovation & Originality" },
  { key: "categoryContent", label: "Content & Value" },
  { key: "categoryUI", label: "UI & Accessibility" },
  { key: "categoryWorld", label: "World Design & Immersion" },
] as const;

interface CategoryScoreInputsProps {
  scores: Record<string, number>;
  onChange: (key: string, value: number) => void;
  disabled?: boolean;
}

export default function CategoryScoreInputs({
  scores,
  onChange,
  disabled = false,
}: CategoryScoreInputsProps) {
  return (
    <div className="space-y-4">
      {POLL_CATEGORIES.map((category) => (
        <div key={category.key} className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm sm:text-base font-cyber text-foreground">
              {category.label}
            </label>
            <span className="text-lg font-gaming text-primary">
              {scores[category.key] || 0}/10
            </span>
          </div>
          <Slider
            value={[scores[category.key] || 0]}
            onValueChange={(val) => onChange(category.key, val[0])}
            min={0}
            max={10}
            step={1}
            disabled={disabled}
            className="w-full"
          />
        </div>
      ))}
    </div>
  );
}
