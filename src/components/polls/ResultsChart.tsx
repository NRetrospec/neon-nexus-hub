import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BarChart3, Network } from "lucide-react";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
} from "recharts";
import { POLL_CATEGORIES } from "./CategoryScoreInputs";

interface ResultsChartProps {
  averageScores: any;
  creatorScore?: any;
}

export default function ResultsChart({
  averageScores,
  creatorScore,
}: ResultsChartProps) {
  const [chartType, setChartType] = useState<"bar" | "radar">("bar");

  if (!averageScores) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground font-cyber">
          No votes yet. Be the first to rate!
        </p>
      </div>
    );
  }

  // Prepare chart data
  const chartData = POLL_CATEGORIES.map((cat) => ({
    category: cat.label,
    categoryShort: cat.label.split(" ")[0], // First word for mobile
    average: averageScores[cat.key] || 0,
    creator: creatorScore ? creatorScore[cat.key] || 0 : undefined,
  }));

  // Chart config
  const chartConfig = {
    average: {
      label: "Community Average",
      color: "hsl(var(--primary))",
    },
    creator: {
      label: "Creator Score",
      color: "hsl(var(--accent))",
    },
  };

  return (
    <div className="space-y-4">
      {/* Chart Type Toggle */}
      <div className="flex justify-end gap-2">
        <Button
          variant={chartType === "bar" ? "neon" : "outline"}
          size="sm"
          onClick={() => setChartType("bar")}
        >
          <BarChart3 className="h-4 w-4 mr-1" />
          Bar Chart
        </Button>
        <Button
          variant={chartType === "radar" ? "neon" : "outline"}
          size="sm"
          onClick={() => setChartType("radar")}
        >
          <Network className="h-4 w-4 mr-1" />
          Radar Chart
        </Button>
      </div>

      {/* Chart Display */}
      {chartType === "bar" ? (
        <ChartContainer
          config={chartConfig}
          className="h-[400px] sm:h-[500px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="horizontal"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                type="number"
                domain={[0, 10]}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="categoryShort"
                width={80}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 11 }}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="gaming-card p-3">
                      <p className="font-cyber text-sm font-semibold mb-2">
                        {payload[0].payload.category}
                      </p>
                      {payload.map((entry: any) => (
                        <p
                          key={entry.name}
                          className="text-xs font-cyber"
                          style={{ color: entry.color }}
                        >
                          {entry.name === "average"
                            ? "Community Average"
                            : "Creator Score"}
                          : {entry.value.toFixed(1)}/10
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Bar
                dataKey="average"
                fill="var(--color-average)"
                radius={[0, 4, 4, 0]}
              />
              {creatorScore && (
                <Bar
                  dataKey="creator"
                  fill="var(--color-creator)"
                  radius={[0, 4, 4, 0]}
                />
              )}
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      ) : (
        <ChartContainer
          config={chartConfig}
          className="h-[400px] sm:h-[500px] w-full"
        >
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={chartData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis
                dataKey="categoryShort"
                tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
              />
              <PolarRadiusAxis
                angle={90}
                domain={[0, 10]}
                tick={{ fontSize: 10 }}
              />
              <ChartTooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  return (
                    <div className="gaming-card p-3">
                      <p className="font-cyber text-sm font-semibold mb-2">
                        {payload[0].payload.category}
                      </p>
                      {payload.map((entry: any) => (
                        <p
                          key={entry.name}
                          className="text-xs font-cyber"
                          style={{ color: entry.fill }}
                        >
                          {entry.name === "average"
                            ? "Community Average"
                            : "Creator Score"}
                          : {entry.value.toFixed(1)}/10
                        </p>
                      ))}
                    </div>
                  );
                }}
              />
              <Radar
                name="average"
                dataKey="average"
                stroke="var(--color-average)"
                fill="var(--color-average)"
                fillOpacity={0.3}
                strokeWidth={2}
              />
              {creatorScore && (
                <Radar
                  name="creator"
                  dataKey="creator"
                  stroke="var(--color-creator)"
                  fill="var(--color-creator)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              )}
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>
      )}
    </div>
  );
}
