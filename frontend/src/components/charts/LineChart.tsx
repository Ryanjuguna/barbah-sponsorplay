
interface LineChartProps {
  data: Array<{
    label: string;
    value: number;
  }>;
  height?: number;
  className?: string;
  color?: string;
  showPoints?: boolean;
}

/**
 * Simple SVG line/sparkline chart. No external dependencies.
 * Shows a trend line over time with optional data points.
 */
export function LineChart({
  data,
  height = 120,
  className,
  color = 'hsl(var(--primary))',
  showPoints = false,
}: LineChartProps) {
  if (data.length < 2) return null;

  const values = data.map((d) => d.value);
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const width = 280;
  const padding = 24;
  const plotWidth = width - padding * 2;
  const plotHeight = height - 40;

  const xStep = plotWidth / (data.length - 1);

  // Build the line path
  const points = data.map((d, i) => {
    const x = padding + i * xStep;
    const y = height - 20 - ((d.value - minValue) / range) * plotHeight;
    return { x, y };
  });

  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ');

  // Area fill path
  const areaD = [
    `M ${points[0].x} ${height - 20}`,
    ...points.map((p) => `L ${p.x} ${p.y}`),
    `L ${points[points.length - 1].x} ${height - 20}`,
    'Z',
  ].join(' ');

  return (
    <div className={className}>
      <svg width={width} height={height} className="block mx-auto">
        {/* Area fill */}
        <path
          d={areaD}
          fill={`${color} 20%`}
          className="fill-[hsl(var(--primary))]/20"
          style={{ fill: color + '20' }}
        />
        {/* Line */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2}
          className="transition-all duration-500 hover:stroke-[hsl(var(--accent))]"
        />
        {/* Points */}
        {showPoints &&
          points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r={3}
              fill={color}
              className="transition-all duration-300 hover:r-5"
            />
          ))}
        {/* Axis labels */}
        {data.map((d, i) => (
          <text
            key={i}
            x={padding + i * xStep}
            y={height - 6}
            textAnchor="middle"
            fontSize="9"
            fill="hsl(var(--muted-foreground))"
          >
            {d.label}
          </text>
        ))}
      </svg>
    </div>
  );
}