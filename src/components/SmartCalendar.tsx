import React, { useState, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Plus, Sun, Moon, Calendar, AlertCircle, Pencil, Lock, Grid3X3, CalendarDays } from 'lucide-react';
import { format, startOfWeek, addDays, addMonths, isSameDay, isSameMonth, isWeekend, getDay, compareAsc, startOfMonth, endOfMonth, eachDayOfInterval, isToday as dateFnsIsToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useIsMobile, useIsTouchDevice } from '../hooks/useMediaQuery';
import { isBlockedDate } from '../lib/holidays';

interface Session {
  id: number;
  type: 'RCD' | 'DEVOIRS_FAITS' | 'AUTRE' | 'HSE';
  status: string;
  date: string;
  timeSlot: string;
  className?: string;
  replacedTeacherName?: string;
  replacedTeacherPrefix?: string;
  replacedTeacherLastName?: string;
  replacedTeacherFirstName?: string;
  studentCount?: number;
  description?: string;
}

interface SmartCalendarProps {
  sessions: Session[];
  onCreateSession: (date: string, timeSlot: string) => void;
  onEditSession?: (session: Session) => void;
}

const TIME_SLOTS_MORNING = ['M1', 'M2', 'M3', 'M4'];
const TIME_SLOTS_AFTERNOON = ['S1', 'S2', 'S3', 'S4'];

const SmartCalendar: React.FC<SmartCalendarProps> = ({ sessions, onCreateSession, onEditSession }) => {
  const isMobile = useIsMobile();
  const isTouch = useIsTouchDevice();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');
  const [showMiniCalendar, setShowMiniCalendar] = useState(false);

  // Touch handling for swipe
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    const threshold = 50;

    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        navigateDay('next');
      } else {
        navigateDay('prev');
      }
    }
  };

  // Calculate days for week view
  const weekDays = React.useMemo(() => {
    const day = getDay(currentDate);
    if (day === 6 || day === 0) {
      return [
        addDays(currentDate, -2), addDays(currentDate, -1), currentDate,
        addDays(currentDate, 1), addDays(currentDate, 2)
      ];
    }
    const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 5 }, (_, i) => addDays(monday, i));
  }, [currentDate]);

  const navigateDay = useCallback((direction: 'prev' | 'next') => {
    setSwipeDirection(direction === 'next' ? 'left' : 'right');
    setTimeout(() => {
      setCurrentDate(prev => addDays(prev, direction === 'next' ? 1 : -1));
      setSwipeDirection(null);
    }, 150);
  }, []);

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(addDays(currentDate, direction === 'next' ? 7 : -7));
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(addMonths(currentDate, direction === 'next' ? 1 : -1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const goToDate = (date: Date) => {
    setCurrentDate(date);
    setViewMode('week');
  };

  const handleMiniCalendarSelect = (date: Date) => {
    setCurrentDate(date);
    setShowMiniCalendar(false);
  };

  const getSessionsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.filter(s => s.date === dateStr);
  };

  const getSessionsForSlot = (date: Date, timeSlot: string) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.filter(s => s.date === dateStr && s.timeSlot === timeSlot);
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  const getSessionColor = (type: string) => {
    switch (type) {
      case 'RCD': return { bg: 'bg-purple-500', text: 'text-purple-700', light: 'bg-purple-100' };
      case 'DEVOIRS_FAITS': return { bg: 'bg-blue-500', text: 'text-blue-700', light: 'bg-blue-100' };
      default: return { bg: 'bg-amber-500', text: 'text-amber-700', light: 'bg-amber-100' };
    }
  };

  // ============================================================================
  // MOBILE VIEW - Single Day with Swipe
  // ============================================================================
  if (isMobile) {
    const dateStr = format(currentDate, 'yyyy-MM-dd');
    const daySessionCount = sessions.filter(s => s.date === dateStr).length;
    const blocked = isBlockedDate(currentDate);

    return (
      <div className="h-full flex flex-col bg-gray-50 overflow-x-hidden w-full" data-tour="calendar">
        {/* Header Navigation */}
        <div className="bg-white border-b sticky top-0 z-10">
          <div className="flex items-center justify-between px-3 py-2">
            <button
              onClick={() => navigateDay('prev')}
              className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full active:scale-95 transition-transform"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>

            <button onClick={() => setShowMiniCalendar(true)} className="text-center flex-1 active:scale-95 transition-transform">
              <div
                key={currentDate.toISOString()}
                className={`transition-all duration-200 ${
                  swipeDirection === 'left' ? 'animate-swipe-left' :
                  swipeDirection === 'right' ? 'animate-swipe-right' : ''
                }`}
              >
                <div className={`text-lg font-bold capitalize ${blocked.isBlocked ? 'text-gray-400' : 'text-gray-900'}`}>
                  {format(currentDate, 'EEEE', { locale: fr })}
                </div>
                <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                  {format(currentDate, 'd MMMM yyyy', { locale: fr })}
                  <Calendar className="w-3 h-3 text-yellow-500" />
                </div>
              </div>
            </button>

            <button
              onClick={() => navigateDay('next')}
              className="w-9 h-9 flex items-center justify-center hover:bg-gray-100 rounded-full active:scale-95 transition-transform"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Today indicator */}
          {isToday(currentDate) && !blocked.isBlocked && (
            <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-white text-center py-1 text-xs font-medium">
              Aujourd'hui
            </div>
          )}

          {/* Blocked day indicator */}
          {blocked.isBlocked && (
            <div className="bg-gradient-to-r from-gray-400 to-gray-500 text-white text-center py-1 text-xs font-medium flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5" />
              {blocked.reason}
            </div>
          )}
        </div>

        {/* Mini Calendar Popup */}
        {showMiniCalendar && (
          <MiniCalendarPopup
            currentDate={currentDate}
            sessions={sessions}
            onSelectDate={handleMiniCalendarSelect}
            onClose={() => setShowMiniCalendar(false)}
          />
        )}

        {/* Swipeable Content */}
        <div
          className="flex-1 overflow-y-auto overflow-x-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className={`transition-opacity duration-150 ${swipeDirection ? 'opacity-50' : 'opacity-100'}`}>
            {/* Morning Section */}
            <div className="px-2 pt-2 pb-1">
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <Sun className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wide">Matin</span>
              </div>
              <div className="space-y-1">
                {TIME_SLOTS_MORNING.map(slot => (
                  <TimeSlotCard
                    key={slot}
                    slot={slot}
                    sessions={getSessionsForSlot(currentDate, slot)}
                    onAdd={() => onCreateSession(dateStr, slot)}
                    onEdit={onEditSession}
                    disabled={blocked.isBlocked}
                    period="morning"
                  />
                ))}
              </div>
            </div>

            {/* Afternoon Section */}
            <div className="px-2 pb-2">
              <div className="flex items-center gap-2 mb-1.5 px-1">
                <Moon className="w-4 h-4 text-indigo-500" />
                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wide">Après-midi</span>
              </div>
              <div className="space-y-1">
                {TIME_SLOTS_AFTERNOON.map(slot => (
                  <TimeSlotCard
                    key={slot}
                    slot={slot}
                    sessions={getSessionsForSlot(currentDate, slot)}
                    onAdd={() => onCreateSession(dateStr, slot)}
                    onEdit={onEditSession}
                    disabled={blocked.isBlocked}
                    period="afternoon"
                  />
                ))}
              </div>
            </div>

            {/* Day Summary */}
            {daySessionCount > 0 && (
              <div className="px-3 pb-20 pt-2">
                <div className="bg-white rounded-lg px-3 py-2 shadow-sm border border-gray-100">
                  <div className="text-center text-sm">
                    <span className="text-lg font-bold text-yellow-600">{daySessionCount}</span>
                    <span className="text-gray-500 ml-1.5">séance{daySessionCount > 1 ? 's' : ''} ce jour</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* FAB - Floating Action Button (hidden when blocked) */}
        {!blocked.isBlocked && (
          <button
            onClick={() => onCreateSession(dateStr, 'M1')}
            className="fixed bottom-5 right-4 w-12 h-12 bg-yellow-500 rounded-full shadow-lg flex items-center justify-center text-white active:scale-95 transition-transform animate-pulse-glow z-20"
          >
            <Plus className="w-6 h-6" />
          </button>
        )}
      </div>
    );
  }

  // ============================================================================
  // DESKTOP VIEW - Week/Month Grid
  // ============================================================================
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100" data-tour="calendar">
        {/* Header */}
        <div className="p-4 flex justify-between items-center border-b">
          <div className="flex items-center gap-2">
            <button
              onClick={() => viewMode === 'week' ? navigateWeek('prev') : navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="text-lg font-semibold capitalize">
                {format(currentDate, 'MMMM yyyy', { locale: fr })}
              </div>
              <div className="text-sm text-gray-500">
                {viewMode === 'week'
                  ? `Semaine du ${format(weekDays[0], 'd')} au ${format(weekDays[4], 'd MMMM', { locale: fr })}`
                  : 'Vue mensuelle'
                }
              </div>
            </div>
            <button
              onClick={() => viewMode === 'week' ? navigateWeek('next') : navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="flex gap-2">
            {/* View Toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${
                  viewMode === 'week'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <CalendarDays className="w-4 h-4" />
                Semaine
              </button>
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-2 text-sm flex items-center gap-1.5 transition-colors ${
                  viewMode === 'month'
                    ? 'bg-yellow-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Grid3X3 className="w-4 h-4" />
                Mois
              </button>
            </div>
            <button
              onClick={goToToday}
              className="px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              Aujourd'hui
            </button>
            <button
              onClick={() => onCreateSession(format(new Date(), 'yyyy-MM-dd'), 'M1')}
              className="px-4 py-2 text-sm bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Ajouter
            </button>
          </div>
        </div>

        {/* Week Grid */}
        {viewMode === 'week' && (
          <div className="overflow-hidden">
            {/* Day Headers */}
            <div className="grid grid-cols-6 border-b">
              <div className="p-3 border-r bg-gray-50"></div>
              {weekDays.map((day, i) => {
                const dayBlocked = isBlockedDate(day);
                const todayDay = isToday(day);
                return (
                  <div
                    key={i}
                    className={`p-3 text-center border-r last:border-r-0 transition-colors relative ${
                      todayDay && dayBlocked.isBlocked ? 'bg-yellow-100/50 ring-2 ring-yellow-400 ring-inset' :
                      todayDay ? 'bg-yellow-50' :
                      dayBlocked.isBlocked ? 'bg-gray-100' : ''
                    }`}
                  >
                    <div className={`text-xs font-medium uppercase ${
                      dayBlocked.isBlocked ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {format(day, 'EEE', { locale: fr })}
                    </div>
                    <div className={`text-xl font-bold ${
                      isToday(day) ? 'text-yellow-600' :
                      dayBlocked.isBlocked ? 'text-gray-400' :
                      isWeekend(day) ? 'text-red-400' : 'text-gray-900'
                    }`}>
                      {format(day, 'd')}
                    </div>
                    {isToday(day) && (
                      <div className={`w-2 h-2 rounded-full mx-auto mt-1 ${dayBlocked.isBlocked ? 'bg-yellow-400' : 'bg-yellow-500'}`}></div>
                    )}
                    {dayBlocked.isBlocked && (
                      <div className="text-[9px] text-gray-400 truncate px-1" title={dayBlocked.reason}>
                        {dayBlocked.reason}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          {/* Morning Slots */}
          <div className="border-b-4 border-gray-100">
            {TIME_SLOTS_MORNING.map((slot, index) => (
              <div key={slot} className="grid grid-cols-6 border-b last:border-b-0">
                <div className="p-2 border-r bg-blue-50/50 flex items-center justify-center relative">
                  {index === 0 && (
                    <div className="absolute -top-0 left-0 right-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-b-md flex items-center gap-1">
                        <Sun className="w-3 h-3" /> MATIN
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-semibold text-blue-700">{slot}</span>
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const cellSessions = getSessionsForSlot(day, slot);
                  const dayBlocked = isBlockedDate(day);
                  const canCreate = !dayBlocked.isBlocked && cellSessions.length === 0;

                  return (
                    <div
                      key={dayIndex}
                      onClick={() => canCreate && onCreateSession(dayStr, slot)}
                      className={`p-1 min-h-[50px] border-r last:border-r-0 transition-colors ${
                        dayBlocked.isBlocked
                          ? 'bg-gray-100 cursor-not-allowed'
                          : isToday(day)
                            ? 'bg-yellow-50/30 cursor-pointer hover:bg-gray-50'
                            : 'cursor-pointer hover:bg-gray-50'
                      }`}
                    >
                      {cellSessions.map(session => (
                        <SessionBlock key={session.id} session={session} onClick={session.status === 'PENDING_REVIEW' ? () => onEditSession?.(session) : undefined} />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

            {/* Afternoon Slots */}
            {TIME_SLOTS_AFTERNOON.map((slot, index) => (
              <div key={slot} className="grid grid-cols-6 border-b last:border-b-0">
                <div className="p-2 border-r bg-amber-50/50 flex items-center justify-center relative">
                  {index === 0 && (
                    <div className="absolute -top-0 left-0 right-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-b-md flex items-center gap-1">
                        <Moon className="w-3 h-3" /> APRÈS-MIDI
                      </span>
                    </div>
                  )}
                  <span className="text-sm font-semibold text-amber-700">{slot}</span>
                </div>
                {weekDays.map((day, dayIndex) => {
                  const dayStr = format(day, 'yyyy-MM-dd');
                  const cellSessions = getSessionsForSlot(day, slot);
                  const dayBlocked = isBlockedDate(day);
                  const canCreate = !dayBlocked.isBlocked && cellSessions.length === 0;

                  return (
                    <div
                      key={dayIndex}
                      onClick={() => canCreate && onCreateSession(dayStr, slot)}
                      className={`p-1 min-h-[50px] border-r last:border-r-0 transition-colors ${
                        dayBlocked.isBlocked
                          ? 'bg-gray-100 cursor-not-allowed'
                          : isToday(day)
                            ? 'bg-yellow-50/30 cursor-pointer hover:bg-gray-50'
                            : 'cursor-pointer hover:bg-gray-50'
                      }`}
                    >
                      {cellSessions.map(session => (
                        <SessionBlock key={session.id} session={session} onClick={session.status === 'PENDING_REVIEW' ? () => onEditSession?.(session) : undefined} />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Month Grid */}
        {viewMode === 'month' && (
          <MonthGrid
            currentDate={currentDate}
            sessions={sessions}
            onDayClick={goToDate}
            onCreateSession={onCreateSession}
          />
        )}
      </div>

      {/* Sessions Summary */}
      <SessionsSummary sessions={sessions} onEditSession={onEditSession} />
    </div>
  );
};

// ============================================================================
// Sub-components
// ============================================================================

interface TimeSlotCardProps {
  slot: string;
  sessions: Session[];
  onAdd: () => void;
  onEdit?: (session: Session) => void;
  disabled?: boolean;
  period: 'morning' | 'afternoon';
}

const TimeSlotCard: React.FC<TimeSlotCardProps> = ({ slot, sessions, onAdd, onEdit, disabled = false, period }) => {
  const hasSession = sessions.length > 0;
  const isEditable = hasSession && sessions[0]?.status === 'PENDING_REVIEW' && !disabled;

  const getSessionColor = (type: string) => {
    switch (type) {
      case 'RCD': return 'bg-purple-500';
      case 'DEVOIRS_FAITS': return 'bg-blue-500';
      default: return 'bg-amber-500';
    }
  };

  // Colors based on period
  const periodColors = period === 'morning'
    ? { bg: 'bg-amber-50', border: 'border-amber-200', slotBg: 'bg-amber-100', slotText: 'text-amber-700', hoverBorder: 'hover:border-amber-400', hoverBg: 'hover:bg-amber-50' }
    : { bg: 'bg-indigo-50', border: 'border-indigo-200', slotBg: 'bg-indigo-100', slotText: 'text-indigo-700', hoverBorder: 'hover:border-indigo-400', hoverBg: 'hover:bg-indigo-50' };

  const handleClick = () => {
    if (disabled) return;
    if (hasSession && onEdit && sessions[0] && isEditable) {
      onEdit(sessions[0]);
    } else if (!hasSession) {
      onAdd();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || (hasSession && !isEditable)}
      className={`
        w-full px-3 py-2 rounded-lg border text-left transition-all
        flex items-center gap-2.5
        ${disabled ? 'cursor-not-allowed opacity-60 bg-gray-50 border-gray-200' :
          hasSession && !isEditable ? 'cursor-default opacity-75' : 'active:scale-[0.98]'}
        ${!disabled && hasSession
          ? isEditable
            ? `${periodColors.bg} ${periodColors.border} ${periodColors.hoverBg} cursor-pointer`
            : 'bg-gray-50 border-gray-200'
          : !disabled ? `bg-white border-dashed border-gray-300 ${periodColors.hoverBorder} ${periodColors.hoverBg} cursor-pointer` : ''
        }
      `}
    >
      <div className={`
        w-9 h-9 rounded-md flex items-center justify-center font-bold text-sm flex-shrink-0
        ${hasSession
          ? `${periodColors.slotBg} ${periodColors.slotText}`
          : `${periodColors.slotBg} ${periodColors.slotText}`
        }
      `}>
        {slot}
      </div>

      {hasSession ? (
        <div className="flex-1 min-w-0">
          {sessions.map(session => (
            <div key={session.id} className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${getSessionColor(session.type)}`} />
              <span className="font-medium text-gray-900 truncate text-sm">
                {session.type === 'RCD' ? `RCD - ${session.className}` :
                 session.type === 'DEVOIRS_FAITS' ? `Devoirs Faits (${session.studentCount})` :
                 'Autre'}
              </span>
              {isEditable && <Pencil className="w-3 h-3 text-gray-400 flex-shrink-0" />}
              {!isEditable && <Lock className="w-3 h-3 text-gray-300 flex-shrink-0" />}
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center gap-2 text-gray-400 text-sm">
          <Plus className="w-4 h-4" />
          <span>Ajouter une séance</span>
        </div>
      )}
    </button>
  );
};

interface SessionBlockProps {
  session: Session;
  onClick?: () => void;
}

const SessionBlock: React.FC<SessionBlockProps> = ({ session, onClick }) => {
  const colors = {
    RCD: 'bg-purple-500',
    DEVOIRS_FAITS: 'bg-blue-500',
    AUTRE: 'bg-amber-500',
    HSE: 'bg-rose-500',
  };

  const isEditable = session.status === 'PENDING_REVIEW';

  // Build teacher name for RCD
  const getTeacherName = () => {
    if (session.replacedTeacherLastName) {
      return `${session.replacedTeacherPrefix || ''} ${session.replacedTeacherLastName}`.trim();
    }
    return session.replacedTeacherName || '';
  };

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      className={`p-1.5 rounded text-xs text-white ${colors[session.type]} ${onClick ? 'cursor-pointer hover:opacity-80 active:scale-95 transition-all' : 'opacity-75'} relative`}
    >
      {/* Editable indicator */}
      {isEditable && (
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Pencil className="w-2 h-2 text-gray-600" />
        </div>
      )}
      {!isEditable && (
        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-white rounded-full flex items-center justify-center shadow-sm">
          <Lock className="w-2 h-2 text-gray-400" />
        </div>
      )}
      <div className="font-medium truncate">
        {session.type === 'RCD' ? `RCD ${session.className}` :
         session.type === 'DEVOIRS_FAITS' ? `DF (${session.studentCount})` :
         'Autre'}
      </div>
      {/* Show teacher name for RCD */}
      {session.type === 'RCD' && getTeacherName() && (
        <div className="text-[10px] opacity-80 truncate">
          {getTeacherName()}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Month Grid Component
// ============================================================================

interface MonthGridProps {
  currentDate: Date;
  sessions: Session[];
  onDayClick: (date: Date) => void;
  onCreateSession: (date: string, timeSlot: string) => void;
}

const MonthGrid: React.FC<MonthGridProps> = ({ currentDate, sessions, onDayClick, onCreateSession }) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get the day of week for the first day (0=Sun, 1=Mon, etc.)
  // We want Monday as first day, so adjust
  const startDayOfWeek = getDay(monthStart);
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Create array with empty slots for days before month starts
  const calendarDays: (Date | null)[] = [
    ...Array(adjustedStartDay).fill(null),
    ...daysInMonth,
  ];

  // Pad to complete the last week
  const remainingDays = (7 - (calendarDays.length % 7)) % 7;
  calendarDays.push(...Array(remainingDays).fill(null));

  const getSessionsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.filter(s => s.date === dateStr);
  };

  const getSessionDots = (daySessions: Session[]) => {
    const types = new Set(daySessions.map(s => s.type));
    return Array.from(types);
  };

  const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

  return (
    <div className="p-4">
      {/* Day names header */}
      <div className="grid grid-cols-7 mb-2">
        {dayNames.map((name, i) => (
          <div
            key={name}
            className={`text-center text-xs font-medium py-2 ${
              i >= 5 ? 'text-red-400' : 'text-gray-500'
            }`}
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="h-16" />;
          }

          const daySessions = getSessionsForDay(day);
          const sessionDots = getSessionDots(daySessions);
          const blocked = isBlockedDate(day);
          const today = dateFnsIsToday(day);
          const weekend = isWeekend(day);
          const isCurrentMonth = isSameMonth(day, currentDate);

          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                if (blocked.isBlocked) {
                  // Jour bloqué: aller en vue semaine pour consulter
                  onDayClick(day);
                } else {
                  // Jour disponible: ouvrir directement la modale
                  onCreateSession(format(day, 'yyyy-MM-dd'), '');
                }
              }}
              className={`
                h-16 rounded-lg border transition-all flex flex-col items-center justify-start pt-1 relative cursor-pointer
                ${today && blocked.isBlocked
                  ? 'bg-yellow-100/60 border-yellow-400 ring-2 ring-yellow-400 ring-inset hover:bg-yellow-100'
                  : blocked.isBlocked
                    ? 'bg-gray-100 border-gray-200 opacity-70 hover:opacity-90'
                    : today
                      ? 'bg-yellow-50 border-yellow-300 hover:bg-yellow-100'
                      : weekend
                        ? 'bg-red-50/30 border-gray-200 hover:bg-gray-50'
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300'
                }
                ${!isCurrentMonth ? 'opacity-40' : ''}
              `}
              title={blocked.isBlocked ? `${blocked.reason} (consultation seule)` : undefined}
            >
              {/* Day number */}
              <span
                className={`
                  text-sm font-semibold
                  ${today ? 'text-yellow-600' : weekend ? 'text-red-400' : 'text-gray-700'}
                `}
              >
                {format(day, 'd')}
              </span>

              {/* Today indicator */}
              {today && (
                <div className={`w-1.5 h-1.5 rounded-full mt-0.5 ${blocked.isBlocked ? 'bg-yellow-400' : 'bg-yellow-500'}`} />
              )}

              {/* Session dots */}
              {sessionDots.length > 0 && (
                <div className="flex gap-1 mt-1 flex-wrap justify-center max-w-full px-1">
                  {sessionDots.map(type => (
                    <div
                      key={type}
                      className={`w-2 h-2 rounded-full ${
                        type === 'RCD' ? 'bg-purple-500' :
                        type === 'DEVOIRS_FAITS' ? 'bg-blue-500' :
                        'bg-amber-500'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Session count badge */}
              {daySessions.length > 0 && (
                <div className="absolute bottom-1 right-1 text-[10px] font-bold text-gray-400">
                  {daySessions.length}
                </div>
              )}

              {/* Blocked indicator */}
              {blocked.isBlocked && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-gray-300" />
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
          <span>RCD</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
          <span>Devoirs Faits</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
          <span>Autre</span>
        </div>
        <div className="flex items-center gap-1.5 ml-2 pl-2 border-l">
          <AlertCircle className="w-3 h-3 text-gray-400" />
          <span>Vacances/Férié</span>
        </div>
      </div>
    </div>
  );
};

interface SessionsSummaryProps {
  sessions: Session[];
  onEditSession?: (session: Session) => void;
}

const SessionsSummary: React.FC<SessionsSummaryProps> = ({ sessions, onEditSession }) => {
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'VALIDATED': return 'Validée';
      case 'PAID': return 'Mis en paiement';
      case 'REJECTED': return 'Refusée';
      default: return 'En attente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'VALIDATED': return 'bg-green-100 text-green-700';
      case 'PAID': return 'bg-emerald-100 text-emerald-700';
      case 'REJECTED': return 'bg-red-100 text-red-700';
      default: return 'bg-yellow-100 text-yellow-700';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'RCD': return 'bg-purple-100 text-purple-700';
      case 'DEVOIRS_FAITS': return 'bg-blue-100 text-blue-700';
      case 'HSE': return 'bg-rose-100 text-rose-700';
      default: return 'bg-amber-100 text-amber-700';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'RCD': return 'RCD';
      case 'DEVOIRS_FAITS': return 'DF';
      case 'HSE': return 'HSE';
      case 'AUTRE': return 'Autre';
      default: return type;
    }
  };

  // Sort sessions by date (most recent first)
  const sortedSessions = [...sessions].sort((a, b) =>
    compareAsc(new Date(b.date), new Date(a.date))
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-semibold text-gray-900">Résumé des séances</h3>
        <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
          {sessions.length} séance{sessions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {sortedSessions.length > 0 ? (
        <div className="space-y-2">
          {sortedSessions.map(session => {
            const isEditable = session.status === 'PENDING_REVIEW';
            return (
              <div
                key={session.id}
                role={isEditable ? "button" : undefined}
                tabIndex={isEditable ? 0 : undefined}
                onClick={isEditable ? () => onEditSession?.(session) : undefined}
                onKeyDown={isEditable ? (e) => e.key === 'Enter' && onEditSession?.(session) : undefined}
                className={`flex items-center justify-between p-3 border border-gray-100 rounded-xl transition-colors ${
                  isEditable
                    ? 'hover:bg-gray-50 cursor-pointer active:scale-[0.98]'
                    : 'opacity-75 cursor-default'
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Editable indicator */}
                  <div className="flex flex-col items-center gap-1">
                    <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getTypeColor(session.type)}`}>
                      {getTypeLabel(session.type)}
                    </span>
                    {isEditable ? (
                      <Pencil className="w-3 h-3 text-gray-400" />
                    ) : (
                      <Lock className="w-3 h-3 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900">
                      {session.type === 'RCD' ? `Classe ${session.className}` :
                       session.type === 'DEVOIRS_FAITS' ? `${session.studentCount} élève${(session.studentCount || 0) > 1 ? 's' : ''}` :
                       session.type === 'HSE' ? 'Heure Supplémentaire Effective' :
                       session.description?.substring(0, 30) || 'Autre activité'}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(session.date), 'EEE d MMM', { locale: fr })} - {session.timeSlot}
                    </div>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg ${getStatusColor(session.status)}`}>
                  {getStatusLabel(session.status)}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Aucune séance déclarée</p>
          <p className="text-sm text-gray-400 mt-1">Cliquez sur un créneau pour ajouter</p>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Mini Calendar Popup for Mobile
// ============================================================================

interface MiniCalendarPopupProps {
  currentDate: Date;
  sessions: Session[];
  onSelectDate: (date: Date) => void;
  onClose: () => void;
}

const MiniCalendarPopup: React.FC<MiniCalendarPopupProps> = ({ currentDate, sessions, onSelectDate, onClose }) => {
  const [viewDate, setViewDate] = useState(currentDate);

  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = getDay(monthStart);
  const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const calendarDays: (Date | null)[] = [
    ...Array(adjustedStartDay).fill(null),
    ...daysInMonth,
  ];

  const remainingDays = (7 - (calendarDays.length % 7)) % 7;
  calendarDays.push(...Array(remainingDays).fill(null));

  const getSessionsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return sessions.filter(s => s.date === dateStr);
  };

  const dayNames = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Popup */}
      <div
        className="relative bg-white rounded-t-3xl w-full max-w-md p-4 pb-8 animate-slide-up-full"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center mb-3">
          <div className="w-10 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setViewDate(addMonths(viewDate, -1))}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full active:scale-95"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <div className="text-lg font-bold text-gray-900 capitalize">
              {format(viewDate, 'MMMM yyyy', { locale: fr })}
            </div>
          </div>
          <button
            onClick={() => setViewDate(addMonths(viewDate, 1))}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-full active:scale-95"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Day names */}
        <div className="grid grid-cols-7 mb-2">
          {dayNames.map((name, i) => (
            <div
              key={i}
              className={`text-center text-xs font-medium py-1 ${
                i >= 5 ? 'text-red-400' : 'text-gray-500'
              }`}
            >
              {name}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} className="h-10" />;
            }

            const daySessions = getSessionsForDay(day);
            const blocked = isBlockedDate(day);
            const today = dateFnsIsToday(day);
            const selected = isSameDay(day, currentDate);
            const weekend = isWeekend(day);
            const isCurrentMonth = isSameMonth(day, viewDate);

            return (
              <button
                key={day.toISOString()}
                onClick={() => onSelectDate(day)}
                className={`
                  h-10 rounded-lg flex flex-col items-center justify-center relative transition-all active:scale-95
                  ${selected
                    ? 'bg-yellow-500 text-white'
                    : today
                      ? 'bg-yellow-100 text-yellow-700'
                      : blocked.isBlocked
                        ? 'bg-gray-100 text-gray-400'
                        : weekend
                          ? 'text-red-400 hover:bg-gray-50'
                          : 'text-gray-700 hover:bg-gray-50'
                  }
                  ${!isCurrentMonth ? 'opacity-40' : ''}
                `}
              >
                <span className="text-sm font-medium">{format(day, 'd')}</span>
                {/* Session dots */}
                {daySessions.length > 0 && (
                  <div className="flex gap-0.5 absolute bottom-1">
                    {daySessions.length <= 3 ? (
                      daySessions.slice(0, 3).map((s, i) => (
                        <div
                          key={i}
                          className={`w-1 h-1 rounded-full ${
                            selected ? 'bg-white' :
                            s.type === 'RCD' ? 'bg-purple-500' :
                            s.type === 'DEVOIRS_FAITS' ? 'bg-blue-500' : 'bg-amber-500'
                          }`}
                        />
                      ))
                    ) : (
                      <div className={`text-[8px] font-bold ${selected ? 'text-white' : 'text-gray-500'}`}>
                        {daySessions.length}
                      </div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Today button */}
        <button
          onClick={() => {
            setViewDate(new Date());
            onSelectDate(new Date());
          }}
          className="w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 active:scale-[0.98] transition-all"
        >
          Aujourd'hui
        </button>
      </div>
    </div>
  );
};

export default SmartCalendar;
