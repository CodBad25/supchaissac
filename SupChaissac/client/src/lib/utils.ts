import { ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase();
}

export function formatTeacherName(name: string) {
  return name.toUpperCase();
}

export function getAvatarForUser(name: string, role: string) {
  const initials = getInitials(name);
  
  let bgColor = "bg-primary-100";
  let textColor = "text-primary-700";
  
  if (role === "SECRETARY") {
    bgColor = "bg-purple-100";
    textColor = "text-purple-700";
  } else if (role === "PRINCIPAL") {
    bgColor = "bg-blue-100";
    textColor = "text-blue-700";
  }
  
  return {
    initials,
    bgColor,
    textColor
  };
}

// Helper function to get status color classes
export function getStatusColorClasses(status: string) {
  const colors: Record<string, { bg: string, text: string, ring: string, dot: string }> = {
    'SUBMITTED': {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      ring: 'ring-gray-500/20',
      dot: 'bg-gray-500'
    },
    'INCOMPLETE': {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      ring: 'ring-amber-500/20',
      dot: 'bg-amber-500'
    },
    'REVIEWED': {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      ring: 'ring-blue-500/20',
      dot: 'bg-blue-500'
    },
    'VALIDATED': {
      bg: 'bg-green-100',
      text: 'text-green-800',
      ring: 'ring-green-500/20',
      dot: 'bg-green-500'
    },
    'READY_FOR_PAYMENT': {
      bg: 'bg-indigo-100',
      text: 'text-indigo-800',
      ring: 'ring-indigo-500/20',
      dot: 'bg-indigo-500'
    },
    'PAID': {
      bg: 'bg-purple-100',
      text: 'text-purple-800',
      ring: 'ring-purple-500/20',
      dot: 'bg-purple-500'
    },
    'REJECTED': {
      bg: 'bg-red-100',
      text: 'text-red-800',
      ring: 'ring-red-500/20',
      dot: 'bg-red-500'
    }
  };
  
  return colors[status] || colors['SUBMITTED'];
}

// Helper function to get session type color classes
export function getSessionTypeColorClasses(type: string) {
  const colors: Record<string, { bg: string, text: string }> = {
    'RCD': {
      bg: 'bg-rcd-100',
      text: 'text-rcd-800'
    },
    'DEVOIRS_FAITS': {
      bg: 'bg-devoirs-faits-100',
      text: 'text-devoirs-faits-800'
    },
    'AUTRE': {
      bg: 'bg-autre-100',
      text: 'text-autre-800'
    }
  };
  
  return colors[type] || { bg: 'bg-gray-100', text: 'text-gray-800' };
}

// Format time slot to readable text
export function formatTimeSlot(slot: string) {
  const timeslots: Record<string, string> = {
    'M1': 'M1 (8h-9h)',
    'M2': 'M2 (9h-10h)',
    'M3': 'M3 (10h15-11h15)',
    'M4': 'M4 (11h15-12h15)',
    'S1': 'S1 (13h30-14h30)',
    'S2': 'S2 (14h30-15h30)',
    'S3': 'S3 (15h45-16h45)',
    'S4': 'S4 (16h45-17h45)',
  };
  
  return timeslots[slot] || slot;
}

// Format session type to readable text
export function formatSessionType(type: string) {
  const types: Record<string, string> = {
    'RCD': 'RCD',
    'DEVOIRS_FAITS': 'Devoirs Faits',
    'AUTRE': 'Autre'
  };
  
  return types[type] || type;
}

// Format status to readable text
export function formatStatus(status: string) {
  const statuses: Record<string, string> = {
    'SUBMITTED': 'Soumise',
    'INCOMPLETE': 'Incomplète',
    'REVIEWED': 'Vérifiée',
    'VALIDATED': 'Validée',
    'READY_FOR_PAYMENT': 'Prête pour paiement',
    'PAID': 'Payée',
    'REJECTED': 'Refusée'
  };
  
  return statuses[status] || status;
}
