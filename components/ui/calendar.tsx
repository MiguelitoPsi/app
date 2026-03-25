"use client";

import { RiArrowLeftSLine, RiArrowRightSLine } from "@remixicon/react";
import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import { cn } from "@/lib/utils/cn";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      locale={ptBR}
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-2",
        month: "flex flex-col gap-4",
        caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium capitalize",
        nav: "flex items-center gap-1",
        button_previous: cn(
          "absolute left-1 h-7 w-7 rounded-full flex items-center justify-center",
          "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors",
        ),
        button_next: cn(
          "absolute right-1 h-7 w-7 rounded-full flex items-center justify-center",
          "text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors",
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday:
          "text-slate-400 rounded-md w-9 font-normal text-[0.8rem] text-center dark:text-slate-500",
        week: "flex w-full mt-2",
        day: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
          "[&:has([aria-selected])]:bg-[#A8BBA3]/10 [&:has([aria-selected].day-outside)]:bg-[#A8BBA3]/5",
          "[&:has([aria-selected])]:rounded-full",
        ),
        day_button: cn(
          "h-9 w-9 rounded-full font-normal text-slate-700 dark:text-slate-200",
          "hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",
          "aria-selected:bg-[#A8BBA3] aria-selected:text-white aria-selected:font-semibold aria-selected:hover:bg-[#8FA889]",
          "focus:outline-none focus:ring-2 focus:ring-[#A8BBA3] focus:ring-offset-1",
        ),
        range_start:
          "day-range-start [&>button]:rounded-l-full [&>button]:rounded-r-none",
        range_end:
          "day-range-end [&>button]:rounded-r-full [&>button]:rounded-l-none",
        selected:
          "[&>button]:bg-[#A8BBA3] [&>button]:text-white [&>button]:hover:bg-[#8FA889]",
        today: "[&>button]:font-bold [&>button]:underline",
        outside:
          "[&>button]:text-slate-300 dark:[&>button]:text-slate-600 [&>button]:opacity-50",
        disabled:
          "[&>button]:text-slate-300 dark:[&>button]:text-slate-600 [&>button]:opacity-30 [&>button]:pointer-events-none",
        range_middle:
          "aria-selected:bg-[#A8BBA3]/20 aria-selected:text-[#A8BBA3]",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <RiArrowLeftSLine size={16} />
          ) : (
            <RiArrowRightSLine size={16} />
          ),
      }}
      {...props}
    />
  );
}
