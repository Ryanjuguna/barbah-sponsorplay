
interface BarChartProps {
  data: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
  height?: number;
  className?: string;
  showValues?: boolean;
}

/**
 * Simple SVG bar chart. No external dependencies.
 */
export function BarChart({
  data,
  height = 160,
  className,
  showValues = true,
}: BarChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value));
  const barWidth = 30;
  const gap = 16;
  const chartWidth = data.length * (barWidth + gap) - gap;

  return (
    <div className={className}>
      <svg
        width={chartWidth}
        height={height}
        className="block mx-auto"
      >
        {data.map((bar, i) => {
          const barHeight = (bar.value / maxValue) * (height - 40);
          const x = i * (barWidth + gap);
          const y = height - barHeight - 30;

          return (
            <g key={bar.label}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={bar.color || 'hsl(var(--primary))'}
                rx={4}
                className="transition-all duration-300 hover:opacity-80"
              />
              {showValues && (
                <text
                  x={x + barWidth / 2}
                  y={y - 8}
                  textAnchor="middle"
                  fontSize="11"
                  fill="hsl(var(--muted-foreground))"
                  fontWeight="600"
                >
                  {bar.value}
                </text>
              )}
              <text
                x={x + barWidth / 2}
                y={height - 8}
                textAnchor="middle"
                fontSize="10"
                fill="hsl(var(--muted-foreground))"
              >
                {bar.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}