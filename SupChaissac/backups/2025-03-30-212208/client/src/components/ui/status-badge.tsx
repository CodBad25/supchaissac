import { cn } from "@/lib/utils";
import { getStatusColorClasses, formatStatus } from "@/lib/utils";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const colorClasses = getStatusColorClasses(status);
  const label = formatStatus(status);
  
  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        colorClasses.bg,
        colorClasses.text,
        `ring-1 ${colorClasses.ring}`,
        className
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full mr-1.5", colorClasses.dot)}></span>
      {label}
    </span>
  );
}

interface SessionTypeBadgeProps {
  type: string;
  className?: string;
}

export function SessionTypeBadge({ type, className }: SessionTypeBadgeProps) {
  let bgColor = "bg-gray-100";
  let textColor = "text-gray-800";
  let label = "Inconnu";
  
  switch (type) {
    case "RCD":
      bgColor = "bg-rcd-100";
      textColor = "text-rcd-800";
      label = "RCD";
      break;
    case "DEVOIRS_FAITS":
      bgColor = "bg-devoirs-faits-100";
      textColor = "text-devoirs-faits-800";
      label = "Devoirs Faits";
      break;
    case "AUTRE":
      bgColor = "bg-autre-100";
      textColor = "text-autre-800";
      label = "Autre";
      break;
  }
  
  return (
    <span 
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        bgColor,
        textColor,
        className
      )}
    >
      {label}
    </span>
  );
}
