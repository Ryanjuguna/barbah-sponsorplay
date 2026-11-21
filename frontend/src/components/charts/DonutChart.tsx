
interface DonutChartProps {
  segments: Array<{
    label: string;
    value: number;
    color: string;
  }>;
  total?: string;
  totalLabel?: string;
  size?: number;
  className?: string;
}

/**
 * Simple SVG donut chart. No external dependencies.
 * Renders segments as SVG arcs with a center label.
 */
export function DonutChart({
  segments,
  total,
  totalLabel,
  size = 200,
  className,
}: DonutChartProps) {
  const totalValue = segments.reduce((sum, s) => sum + s.value, 0);
  const radius = size / 2;
  const center = radius;
  const innerRadius = radius * 0.55;

  let currentAngle = 0;
  const arcs = segments.map((segment) => {
    const sliceAngle = (segment.value / totalValue) * 360;
    const endAngle = currentAngle + sliceAngle;

    const startRad = ((currentAngle - 90) * Math.PI) / 180;
    const endRad = ((endAngle - 90) * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    const largeArcFlag = sliceAngle > 180 ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${center + innerRadius * Math.cos(endRad)} ${center + innerRadius * Math.sin(endRad)}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${center + innerRadius * Math.cos(startRad)} ${center + innerRadius * Math.sin(startRad)}`,
      'Z',
    ].join(' ');

    currentAngle = endAngle;
    return (
      <path
        key={segment.label}
        d={d}
        fill={segment.color}
        className="transition-all duration-300 hover:opacity-90"
      />
    );
  });

  return (
    <div className={className} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        className="block mx-auto"
        viewBox={`0 0 ${size} ${size}`}
      >
        {arcs}
      </svg>
      <div className="mt-4 flex flex-col items-center">
        {total && (
          <span className="text-2xl font-black text-[hsl(var(--foreground))]">
            {total}
          </span>
        )}
        {totalLabel && (
          <span className="text-xs text-[hsl(var(--muted-foreground))] uppercase tracking-wider">
            {totalLabel}
          </span>
        )}
      </div>
    </div>
  );
}