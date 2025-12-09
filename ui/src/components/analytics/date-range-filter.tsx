/**
 * Date Range Filter Component
 *
 * Provides date range selection with preset options for analytics.
 * Uses react-day-picker for date selection UI.
 */

import React from 'react';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';

interface DateRangeFilterProps {
  value?: DateRange;
  onChange: (dateRange: DateRange | undefined) => void;
  presets?: Array<{
    label: string;
    range: DateRange;
  }>;
  className?: string;
}

export function DateRangeFilter({
  value,
  onChange,
  presets = [],
  className,
}: DateRangeFilterProps) {
  const handlePresetClick = (range: DateRange) => {
    onChange(range);
  };

  const handleFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const from = e.target.value ? new Date(e.target.value) : undefined;
    onChange({ from, to: value?.to });
  };

  const handleToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const to = e.target.value ? new Date(e.target.value) : undefined;
    onChange({ from: value?.from, to });
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {/* Preset Buttons */}
      {presets.map((preset, index) => (
        <Button
          key={index}
          variant={isSameRange(value, preset.range) ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetClick(preset.range)}
        >
          {preset.label}
        </Button>
      ))}

      {/* Custom Date Range Inputs */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <CalendarIcon className="h-4 w-4 text-muted-foreground" />
          <Input
            type="date"
            value={value?.from ? format(value.from, 'yyyy-MM-dd') : ''}
            onChange={handleFromChange}
            placeholder="From"
            className="w-40"
          />
        </div>
        <span className="text-muted-foreground">to</span>
        <Input
          type="date"
          value={value?.to ? format(value.to, 'yyyy-MM-dd') : ''}
          onChange={handleToChange}
          placeholder="To"
          className="w-40"
        />
      </div>
    </div>
  );
}

// Helper to compare date ranges
function isSameRange(a?: DateRange, b?: DateRange): boolean {
  if (!a || !b) return a === b;

  const fromA = a.from?.getTime() ?? 0;
  const fromB = b.from?.getTime() ?? 0;
  const toA = a.to?.getTime() ?? 0;
  const toB = b.to?.getTime() ?? 0;

  return fromA === fromB && toA === toB;
}
