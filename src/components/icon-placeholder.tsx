import {
  IconArrowsLeftRight,
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronUp,
  IconCirclePlus,
  IconCircleX,
  IconEyeClosed,
  IconGripVertical,
  IconListDetails,
  IconRosetteDiscountCheck,
  IconSelector,
  IconSettings,
  IconTextCaption,
  IconTrash,
  IconX,
} from "@tabler/icons-react";

const ICONS = {
  IconArrowsLeftRight,
  IconCalendar,
  IconCheck,
  IconChevronDown,
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconChevronUp,
  IconCirclePlus,
  IconCircleX,
  IconEyeClosed,
  IconGripVertical,
  IconListDetails,
  IconRosetteDiscountCheck,
  IconSelector,
  IconSettings,
  IconTextCaption,
  IconTrash,
  IconX,
} as const;

type IconName = keyof typeof ICONS;

export function IconPlaceholder({
  tabler,
  className,
}: {
  lucide?: string;
  tabler?: string;
  hugeicons?: string;
  phosphor?: string;
  remixicon?: string;
  className?: string;
}) {
  const Icon = tabler && tabler in ICONS ? ICONS[tabler as IconName] : IconSelector;
  return <Icon className={className} />;
}
