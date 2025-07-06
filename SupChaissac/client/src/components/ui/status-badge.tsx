import React from 'react';
import { Badge } from './badge';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const getVariant = () => {
    switch (status.toUpperCase()) {
      case 'SUBMITTED':
        return 'default';
      case 'VALIDATED':
        return 'success';
      case 'REJECTED':
        return 'destructive';
      case 'INCOMPLETE':
        return 'secondary';
      case 'READY_FOR_PAYMENT':
        return 'success';
      case 'PAID':
        return 'outline';
      default:
        return 'default';
    }
  };

  const getLabel = () => {
    switch (status.toUpperCase()) {
      case 'SUBMITTED':
        return 'Soumise';
      case 'VALIDATED':
        return 'Validée';
      case 'REJECTED':
        return 'Rejetée';
      case 'INCOMPLETE':
        return 'Incomplète';
      case 'READY_FOR_PAYMENT':
        return 'Prête pour paiement';
      case 'PAID':
        return 'Payée';
      default:
        return status;
    }
  };

  return (
    <Badge variant={getVariant()} className={className}>
      {getLabel()}
    </Badge>
  );
}

interface SessionTypeBadgeProps {
  type: string;
  className?: string;
}

export function SessionTypeBadge({ type, className }: SessionTypeBadgeProps) {
  const getVariant = () => {
    switch (type.toUpperCase()) {
      case 'COURSE':
        return 'default';
      case 'EXAM':
        return 'secondary';
      case 'MEETING':
        return 'outline';
      case 'TRAINING':
        return 'success';
      case 'OTHER':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getLabel = () => {
    switch (type.toUpperCase()) {
      case 'COURSE':
        return 'Cours';
      case 'EXAM':
        return 'Examen';
      case 'MEETING':
        return 'Réunion';
      case 'TRAINING':
        return 'Formation';
      case 'OTHER':
        return 'Autre';
      default:
        return type;
    }
  };

  return (
    <Badge variant={getVariant()} className={className}>
      {getLabel()}
    </Badge>
  );
}
