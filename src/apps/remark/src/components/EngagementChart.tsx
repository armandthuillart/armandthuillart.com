'use client';

import {
  type ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@remark/components/ui/Chart';
import { Area, AreaChart, XAxis } from 'recharts';

const chartConfig = {
  value: {
    color: 'var(--color-chart-1)',
    label: 'Feedbacks',
  },
} satisfies ChartConfig;

interface EngagementChartProps {
  data: {
    range: string;
    value: number;
  }[];
}

export function EngagementChart({ data }: EngagementChartProps) {
  return (
    <ChartContainer
      className="-ml-1.5 h-8 w-[calc(100%+0.625rem)] translate-x-px"
      config={chartConfig}
    >
      <AreaChart accessibilityLayer data={data}>
        <XAxis dataKey="range" hide />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} position={{ y: 48 }} />
        <Area
          dataKey="value"
          fill="var(--color-chart-1)"
          fillOpacity={0.4}
          isAnimationActive={false}
          stroke="var(--color-chart-1)"
          type="linear"
        />
      </AreaChart>
    </ChartContainer>
  );
}
