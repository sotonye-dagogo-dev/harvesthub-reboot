"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Clock, CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORM_DEFAULTS } from "@/lib/constants";

interface WeeklySlotInput {
  id: string;
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  startTime: string; // "09:00"
  endTime: string; // "17:00"
  isAvailable: boolean;
}

export interface BookingCalendarProps {
  availableSlots: WeeklySlotInput[];
  onSelectSlot?: (date: string, startTime: string, endTime: string) => void;
  selectedDate?: string;
  selectedTime?: string;
  maxAdvanceDays?: number;
  durationMinutes?: number | null;
  className?: string;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatTime(time24: string): string {
  const [hoursStr, minutesStr] = time24.split(":");
  const hours = parseInt(hoursStr ?? "0", 10);
  const minutes = minutesStr ?? "00";
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes} ${period}`;
}

function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function BookingCalendar({
  availableSlots,
  onSelectSlot,
  selectedDate: controlledDate,
  selectedTime: controlledTime,
  maxAdvanceDays = PLATFORM_DEFAULTS.MAX_BOOKING_ADVANCE_DAYS,
  durationMinutes,
  className,
}: BookingCalendarProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + maxAdvanceDays);
    return d;
  }, [today, maxAdvanceDays]);

  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [internalDate, setInternalDate] = useState<string | undefined>(controlledDate);
  const [internalTime, setInternalTime] = useState<string | undefined>(controlledTime);

  const activeDate = controlledDate ?? internalDate;
  const activeTime = controlledTime ?? internalTime;

  // Map of dayOfWeek → available slots for O(1) lookup
  const slotsByDay = useMemo(() => {
    const map = new Map<number, WeeklySlotInput[]>();
    for (const slot of availableSlots) {
      if (!slot.isAvailable) continue;
      const existing = map.get(slot.dayOfWeek) ?? [];
      existing.push(slot);
      map.set(slot.dayOfWeek, existing);
    }
    // Sort each day's slots by startTime
    for (const [day, slots] of map) {
      map.set(
        day,
        slots.sort((a, b) => a.startTime.localeCompare(b.startTime))
      );
    }
    return map;
  }, [availableSlots]);

  // Generate calendar grid for current month
  const calendarDays = useMemo(() => {
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const days: (Date | null)[] = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(currentYear, currentMonth, d));
    }
    return days;
  }, [currentMonth, currentYear]);

  const isDayAvailable = (date: Date): boolean => {
    if (date < today || date > maxDate) return false;
    return slotsByDay.has(date.getDay());
  };

  const isDayPast = (date: Date): boolean => date < today;
  const isDayBeyondMax = (date: Date): boolean => date > maxDate;

  const handleDateClick = (date: Date) => {
    if (!isDayAvailable(date)) return;
    const key = toDateKey(date);
    setInternalDate(key);
    setInternalTime(undefined);
  };

  const handleTimeClick = (startTime: string, endTime: string) => {
    setInternalTime(startTime);
    if (activeDate && onSelectSlot) {
      onSelectSlot(activeDate, startTime, endTime);
    }
  };

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  // Get slots for the selected date
  const selectedDaySlots = useMemo(() => {
    if (!activeDate) return [];
    const date = new Date(activeDate + "T00:00:00");
    return slotsByDay.get(date.getDay()) ?? [];
  }, [activeDate, slotsByDay]);

  const canGoPrev =
    currentYear > today.getFullYear() ||
    (currentYear === today.getFullYear() && currentMonth > today.getMonth());

  const canGoNext =
    currentYear < maxDate.getFullYear() ||
    (currentYear === maxDate.getFullYear() && currentMonth < maxDate.getMonth());

  return (
    <div
      className={cn("rounded-ds-lg border border-ds-border-base bg-ds-surface-base p-4", className)}
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-ds-text-brand" />
          <h3 className="text-base font-semibold text-ds-text-primary">Select a Date & Time</h3>
        </div>
      </div>

      {/* Month Navigation */}
      <div className="mb-3 flex items-center justify-between">
        <button
          onClick={goToPrevMonth}
          disabled={!canGoPrev}
          className={cn(
            "rounded-ds-md p-1.5 transition-colors",
            canGoPrev
              ? "text-ds-text-secondary hover:bg-ds-surface-sunken hover:text-ds-text-primary"
              : "cursor-not-allowed text-ds-text-placeholder"
          )}
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <span className="text-sm font-semibold text-ds-text-primary">
          {MONTH_NAMES[currentMonth]} {currentYear}
        </span>
        <button
          onClick={goToNextMonth}
          disabled={!canGoNext}
          className={cn(
            "rounded-ds-md p-1.5 transition-colors",
            canGoNext
              ? "text-ds-text-secondary hover:bg-ds-surface-sunken hover:text-ds-text-primary"
              : "cursor-not-allowed text-ds-text-placeholder"
          )}
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Day Labels */}
      <div className="mb-1 grid grid-cols-7 gap-1">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-[11px] font-medium text-ds-text-tertiary">
            {label}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="mb-4 grid grid-cols-7 gap-1">
        {calendarDays.map((date, idx) => {
          if (!date) {
            return <div key={`empty-${idx}`} className="aspect-square" />;
          }

          const key = toDateKey(date);
          const available = isDayAvailable(date);
          const past = isDayPast(date);
          const beyond = isDayBeyondMax(date);
          const isSelected = activeDate === key;
          const isToday = key === toDateKey(today);

          return (
            <button
              key={key}
              onClick={() => handleDateClick(date)}
              disabled={!available}
              className={cn(
                "relative aspect-square rounded-ds-md text-xs font-medium transition-all",
                // Selected state
                isSelected && "bg-ds-brand-primary text-white ring-2 ring-ds-brand-primary/30",
                // Available but not selected
                !isSelected &&
                  available &&
                  "bg-ds-surface-sunken text-ds-text-primary hover:bg-ds-brand-primary/10 hover:text-ds-text-brand",
                // Unavailable
                !available && !past && !beyond && "text-ds-text-placeholder",
                // Past or beyond range
                (past || beyond) && "text-ds-text-placeholder/50 cursor-not-allowed",
                // Today indicator
                isToday && !isSelected && "ring-1 ring-ds-brand-primary/40"
              )}
              aria-label={`${date.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}${available ? " — slots available" : ""}`}
            >
              {date.getDate()}
              {available && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-ds-status-success" />
              )}
            </button>
          );
        })}
      </div>

      {/* Time Slots */}
      {activeDate && selectedDaySlots.length > 0 && (
        <div className="border-t border-ds-border-base pt-3">
          <div className="mb-2 flex items-center gap-2">
            <Clock className="h-4 w-4 text-ds-text-secondary" />
            <span className="text-sm font-medium text-ds-text-primary">
              Available Times —{" "}
              {new Date(activeDate + "T00:00:00").toLocaleDateString("en-US", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedDaySlots.map((slot) => {
              const isTimeSelected = activeTime === slot.startTime;
              return (
                <button
                  key={slot.id}
                  onClick={() => handleTimeClick(slot.startTime, slot.endTime)}
                  className={cn(
                    "rounded-ds-md border px-3 py-1.5 text-xs font-medium transition-all",
                    isTimeSelected
                      ? "border-ds-brand-primary bg-ds-brand-primary text-white"
                      : "border-ds-border-base bg-ds-surface-base text-ds-text-primary hover:border-ds-brand-primary hover:text-ds-text-brand"
                  )}
                >
                  {formatTime(slot.startTime)} – {formatTime(slot.endTime)}
                </button>
              );
            })}
          </div>
          {durationMinutes && (
            <p className="mt-2 text-[11px] text-ds-text-tertiary">
              Each session lasts approximately {durationMinutes} minutes
            </p>
          )}
        </div>
      )}

      {activeDate && selectedDaySlots.length === 0 && (
        <div className="border-t border-ds-border-base pt-3">
          <p className="text-center text-sm text-ds-text-tertiary">
            No available slots for this date
          </p>
        </div>
      )}

      {!activeDate && (
        <p className="text-center text-xs text-ds-text-tertiary">
          Select a date to view available time slots
        </p>
      )}

      {/* Legend */}
      <div className="mt-3 flex items-center justify-center gap-4 text-[10px] text-ds-text-tertiary">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-ds-status-success" />
          Available
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-ds-brand-primary" />
          Selected
        </span>
      </div>
    </div>
  );
}
