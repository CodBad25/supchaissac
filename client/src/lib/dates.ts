import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isWeekend, isSameDay, isSameMonth, parse, isBefore, isAfter } from 'date-fns';
import { fr } from 'date-fns/locale';

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return format(d, 'dd/MM/yyyy', { locale: fr });
}

export function formatMonthYear(date: Date): string {
  return format(date, 'MMMM yyyy', { locale: fr });
}

export function getMonthDays(currentDate: Date) {
  const firstDay = startOfMonth(currentDate);
  const lastDay = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: firstDay, end: lastDay });
  
  return days.map(day => ({
    date: day,
    isWeekend: isWeekend(day),
    isToday: isSameDay(day, new Date()),
    inMonth: isSameMonth(day, currentDate)
  }));
}

export function getMonthWeeks(currentDate: Date) {
  const days = getMonthDays(currentDate);
  const weeks = [];
  
  // Get the day of the week for the first day of the month
  const firstDayOfWeek = days[0].date.getDay();
  // In France, week starts on Monday (1), but getDay() returns 0 for Sunday
  const daysBefore = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  
  // Add days from previous month
  const previousMonth = subMonths(currentDate, 1);
  const previousMonthLastDay = endOfMonth(previousMonth);
  for (let i = daysBefore - 1; i >= 0; i--) {
    const date = new Date(previousMonthLastDay);
    date.setDate(previousMonthLastDay.getDate() - i);
    weeks.push({
      date,
      isWeekend: isWeekend(date),
      isToday: isSameDay(date, new Date()),
      inMonth: false
    });
  }
  
  // Add days from current month
  weeks.push(...days);
  
  // Add days from next month to complete the last week
  const daysAfter = 42 - weeks.length; // 6 weeks x 7 days = 42
  const nextMonth = addMonths(currentDate, 1);
  const nextMonthFirstDay = startOfMonth(nextMonth);
  for (let i = 0; i < daysAfter; i++) {
    const date = new Date(nextMonthFirstDay);
    date.setDate(nextMonthFirstDay.getDate() + i);
    weeks.push({
      date,
      isWeekend: isWeekend(date),
      isToday: isSameDay(date, new Date()),
      inMonth: false
    });
  }
  
  return weeks;
}

export function getNextMonth(date: Date): Date {
  return addMonths(date, 1);
}

export function getPreviousMonth(date: Date): Date {
  return subMonths(date, 1);
}

export function stringToDate(dateString: string): Date {
  // Parse date in format 'YYYY-MM-DD'
  return parse(dateString, 'yyyy-MM-dd', new Date());
}

export function dateToString(date: Date): string {
  // Format date to 'YYYY-MM-DD'
  return format(date, 'yyyy-MM-dd');
}

export function hasSessionOnDate(sessions: any[], date: Date): boolean {
  const dateString = dateToString(date);
  return sessions.some(session => session.date === dateString);
}

export function getSessionsForDate(sessions: any[], date: Date) {
  const dateString = dateToString(date);
  return sessions.filter(session => session.date === dateString);
}
