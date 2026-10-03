"use client";

import type { ComponentType, ReactNode } from "react";
import { parseAsStringEnum, useQueryState } from "nuqs";
import {
  IconAdjustments,
  IconCommand,
  IconDatabase,
  IconDeviceDesktop,
  IconFilter,
} from "@tabler/icons-react";

import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DATA_MODES, FILTER_MODES, type DataMode, type FilterMode } from "@/lib/table-search";

const modes = [
  {
    value: "server" as const,
    label: "Server",
    icon: IconDatabase,
    description: "Sort, filter, and pages run in Postgres.",
  },
  {
    value: "client" as const,
    label: "Browser",
    icon: IconDeviceDesktop,
    description: "Loads the first 500 rows for this sort, then filters them in the browser.",
  },
] satisfies ReadonlyArray<{
  value: DataMode;
  label: string;
  icon: typeof IconDatabase;
  description: string;
}>;

const filters = [
  {
    value: "plain" as const,
    label: "Plain",
    icon: IconFilter,
    description: "One control for each filterable column.",
  },
  {
    value: "advanced" as const,
    label: "Advanced",
    icon: IconAdjustments,
    description: "A filter list with operators, and/or, and drag to reorder.",
  },
  {
    value: "command" as const,
    label: "Command",
    icon: IconCommand,
    description: "The same filters in a command menu. Press Ctrl or Command Shift F.",
  },
] satisfies ReadonlyArray<{
  value: FilterMode;
  label: string;
  icon: typeof IconFilter;
  description: string;
}>;

export function TableControlMenu() {
  const [dataMode, setDataMode] = useQueryState(
    "dataMode",
    parseAsStringEnum([...DATA_MODES])
      .withDefault("server")
      .withOptions({ shallow: false, clearOnDefault: true }),
  );
  const [filterMode, setFilterMode] = useQueryState(
    "filterMode",
    parseAsStringEnum([...FILTER_MODES])
      .withDefault("plain")
      .withOptions({ shallow: false, clearOnDefault: true }),
  );

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <ControlGroup label="Mode">
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          aria-label="Data mode"
          value={[dataMode]}
          onValueChange={(values) => {
            const next = modes.find((item) => item.value === values[0]);
            if (next) void setDataMode(next.value);
          }}
        >
          {modes.map((item) => (
            <ControlItem key={item.value} item={item} />
          ))}
        </ToggleGroup>
      </ControlGroup>
      <Separator orientation="vertical" className="h-4 max-sm:hidden" />
      <ControlGroup label="Filter">
        <ToggleGroup
          variant="outline"
          size="sm"
          spacing={0}
          aria-label="Filter style"
          value={[filterMode]}
          onValueChange={(values) => {
            const next = filters.find((item) => item.value === values[0]);
            if (next) void setFilterMode(next.value);
          }}
        >
          {filters.map((item) => (
            <ControlItem key={item.value} item={item} />
          ))}
        </ToggleGroup>
      </ControlGroup>
      <span className="sr-only">Sort menu shortcut is Ctrl or Command Shift S.</span>
    </div>
  );
}

function ControlGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

function ControlItem({
  item,
}: {
  item: {
    value: string;
    label: string;
    description: string;
    icon: ComponentType<{ className?: string }>;
  };
}) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <ToggleGroupItem value={item.value} className="gap-1 px-2 text-xs">
            <Icon className="size-3.5" />
            {item.label}
          </ToggleGroupItem>
        }
      />
      <TooltipContent side="bottom" sideOffset={6}>
        {item.description}
      </TooltipContent>
    </Tooltip>
  );
}
