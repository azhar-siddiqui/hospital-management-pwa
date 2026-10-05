"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { IconCalendar } from "@tabler/icons-react";
import { collectionHref, collectionRangePresets } from "@/lib/collection-range";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const EARLIEST = new Date(2000, 0, 1);

export function CollectionRangePicker({
  fromKey,
  toKey,
  latestKey,
  label,
  doctorId,
}: {
  fromKey: string;
  toKey: string;
  latestKey: string;
  label: string;
  doctorId: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [range, setRange] = useState<DateRange | undefined>({
    from: keyToDate(fromKey),
    to: keyToDate(toKey),
  });
  const latest = keyToDate(latestKey);
  const presets = collectionRangePresets();

  function apply(nextFrom: string, nextTo: string) {
    const [start, end] = nextFrom <= nextTo ? [nextFrom, nextTo] : [nextTo, nextFrom];
    setOpen(false);
    router.push(collectionHref({ fromKey: start, toKey: end, doctorId }));
  }

  return (
    <div className="min-w-0">
      <FieldLabel htmlFor="collection-range">Date range</FieldLabel>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (next) setRange({ from: keyToDate(fromKey), to: keyToDate(toKey) });
        }}
      >
        <PopoverTrigger
          id="collection-range"
          render={
            <Button
              type="button"
              variant="outline"
              className="h-auto min-h-8 w-full justify-start px-2.5 font-normal whitespace-normal"
            />
          }
        >
          <IconCalendar />
          <span className="min-w-0 text-left wrap-break-word">{label}</span>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-auto max-h-[min(32rem,calc(100dvh-5rem))] max-w-[calc(100vw-1rem)] overflow-y-auto p-0"
        >
          <div className="flex flex-col bg-popover sm:flex-row">
            <div
              className="grid grid-cols-2 gap-1 border-b p-2 sm:flex sm:w-36 sm:flex-col sm:border-r sm:border-b-0"
              aria-label="Presets"
            >
              {presets.map((preset) => {
                const current = preset.fromKey === fromKey && preset.toKey === toKey;
                return (
                  <Button
                    key={preset.id}
                    type="button"
                    variant={current ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    aria-pressed={current}
                    onClick={() => apply(preset.fromKey, preset.toKey)}
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </div>
            <Calendar
              mode="range"
              resetOnSelect
              weekStartsOn={1}
              defaultMonth={keyToDate(fromKey)}
              selected={range}
              onSelect={(selected) => {
                setRange(selected);
                if (!selected?.from || !selected.to) return;
                apply(dateKey(selected.from), dateKey(selected.to));
              }}
              startMonth={EARLIEST}
              endMonth={latest}
              disabled={{ before: EARLIEST, after: latest }}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function keyToDate(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function dateKey(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}
