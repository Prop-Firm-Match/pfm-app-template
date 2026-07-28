// Example chart wiring for `src/components/ui/chart.tsx`. Static sample data --
// swap `data` for a real `trpc.listExamples.useQuery()` result once you have
// one. Colors are the validated pink+blue pair (see dataviz skill/CHANGELOG:
// `node scripts/validate_palette.js "#e74694,#3f83f8" --mode dark` passes all
// checks; PFM's full 6-color brand set does NOT pass as one categorical
// palette -- don't add a 3rd/4th series color without re-validating).
import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from './ui/chart';

const data = [
  { month: 'Jan', requests: 42, approved: 31 },
  { month: 'Feb', requests: 58, approved: 40 },
  { month: 'Mar', requests: 51, approved: 44 },
  { month: 'Apr', requests: 66, approved: 52 },
];

const chartConfig = {
  requests: { label: 'Requests', color: 'hsl(330.9 77% 59%)' },
  approved: { label: 'Approved', color: 'hsl(217.9 93% 61%)' },
} satisfies ChartConfig;

export function ExampleChart() {
  return (
    <ChartContainer config={chartConfig} className="max-h-64 w-full">
      <BarChart data={data}>
        <CartesianGrid vertical={false} />
        <XAxis dataKey="month" tickLine={false} axisLine={false} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="requests" fill="var(--color-requests)" radius={4} />
        <Bar dataKey="approved" fill="var(--color-approved)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}
