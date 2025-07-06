import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/hooks/use-session";
import { Session } from "@shared/schema";
import { 
  formatMonthYear, 
  getMonthWeeks, 
  getNextMonth, 
  getPreviousMonth, 
  formatDate,
  dateToString,
  getSessionsForDate
} from "@/lib/dates";
import { StatusBadge, SessionTypeBadge } from "@/components/ui/status-badge";

interface CalendarViewProps {
  onDateSelect: (date: Date) => void;
  selectedDate: Date;
}

export function CalendarView({ onDateSelect, selectedDate }: CalendarViewProps) {
  // Initialiser avec le mois en cours
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const weeks = getMonthWeeks(currentMonth);
  const { sessions } = useSession();
  
  // Assurer que le mois affiché correspond au mois de la date sélectionnée
  useEffect(() => {
    // Définir le mois actuel si le mois de la date sélectionnée est différent
    if (currentMonth.getMonth() !== selectedDate.getMonth() ||
        currentMonth.getFullYear() !== selectedDate.getFullYear()) {
      setCurrentMonth(new Date(selectedDate));
    }
  }, [selectedDate, currentMonth]);
  
  // Get sessions for selected date
  const sessionsForSelectedDate = getSessionsForDate(sessions, selectedDate);
  
  const handlePreviousMonth = () => {
    setCurrentMonth(getPreviousMonth(currentMonth));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(getNextMonth(currentMonth));
  };
  
  return (
    <div className="w-full md:w-1/3 mb-6 md:mb-0">
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex items-center justify-between mb-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handlePreviousMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </Button>
          <h2 className="text-lg font-semibold text-gray-900">
            {formatMonthYear(currentMonth)}
          </h2>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleNextMonth}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </Button>
        </div>
        
        <div className="grid grid-cols-7 gap-2 text-center">
          <div className="text-xs font-medium text-gray-500">Lu</div>
          <div className="text-xs font-medium text-gray-500">Ma</div>
          <div className="text-xs font-medium text-gray-500">Me</div>
          <div className="text-xs font-medium text-gray-500">Je</div>
          <div className="text-xs font-medium text-gray-500">Ve</div>
          <div className="text-xs font-medium text-gray-500">Sa</div>
          <div className="text-xs font-medium text-gray-500">Di</div>
          
          {weeks.map((day, index) => {
            const isSelected = day.date.toDateString() === selectedDate.toDateString();
            const hasSession = sessions.some(session => session.date === dateToString(day.date));
            
            return (
              <div 
                key={index} 
                className={cn(
                  "py-2 px-1 text-sm cursor-pointer relative",
                  day.isWeekend && "bg-gray-50",
                  !day.inMonth && "text-gray-400",
                  // Si c'est le jour actuel (aujourd'hui)
                  day.date.toDateString() === new Date().toDateString() && !isSelected && 
                    "ring-2 ring-primary-500 text-primary-700 font-semibold",
                  isSelected && "bg-primary-100 text-primary-700 font-semibold rounded-full shadow-sm transform scale-105",
                  !isSelected && day.inMonth && "hover:bg-gray-100"
                )}
                onClick={() => onDateSelect(day.date)}
              >
                {day.date.getDate()}
                {hasSession && !isSelected && (
                  <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-primary-500"></span>
                )}
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Selected date info */}
      <div className="mt-4 bg-white rounded-lg shadow p-4">
        <h3 className="font-medium text-gray-900">
          {formatDate(selectedDate)}
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          {sessionsForSelectedDate.length > 0 
            ? `${sessionsForSelectedDate.length} séance${sessionsForSelectedDate.length > 1 ? 's' : ''} planifiée${sessionsForSelectedDate.length > 1 ? 's' : ''}`
            : 'Aucune séance planifiée'}
        </p>
        
        {sessionsForSelectedDate.length > 0 && (
          <div className="mt-3 space-y-2">
            {sessionsForSelectedDate.map((session) => (
              <div key={session.id} className="flex items-center p-2 bg-gray-50 rounded">
                <div className={`flex-shrink-0 w-2 h-2 rounded-full ${session.type === 'RCD' ? 'bg-rcd-500' : session.type === 'DEVOIRS_FAITS' ? 'bg-devoirs-faits-500' : 'bg-autre-500'} ring-2 ring-white`}></div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">
                    {session.type === 'RCD' ? 'RCD' : session.type === 'DEVOIRS_FAITS' ? 'Devoirs Faits' : 'Autre'} - {session.timeSlot} ({
                      session.timeSlot === 'M1' ? '8h-9h' :
                      session.timeSlot === 'M2' ? '9h-10h' :
                      session.timeSlot === 'M3' ? '10h15-11h15' :
                      session.timeSlot === 'M4' ? '11h15-12h15' :
                      session.timeSlot === 'S1' ? '13h30-14h30' :
                      session.timeSlot === 'S2' ? '14h30-15h30' :
                      session.timeSlot === 'S3' ? '15h45-16h45' :
                      '16h45-17h45'
                    })
                  </p>
                  <p className="text-xs text-gray-500">
                    {session.type === 'RCD' 
                      ? `${session.replacedTeacherPrefix} ${session.replacedTeacherName}`
                      : session.type === 'DEVOIRS_FAITS'
                      ? `${session.studentCount} élèves`
                      : session.description}
                  </p>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={session.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
