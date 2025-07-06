import React, { useState } from 'react';
import { Session, Attachment } from '@/hooks/use-session-management';
import { StatusBadge, SessionTypeBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';

interface SessionDetailModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
  onValidate?: (id: number, type?: string, comment?: string) => void;
  onReject?: (id: number, comment?: string) => void;
}

export function SessionDetailModal({
  session,
  isOpen,
  onClose,
  onValidate,
  onReject,
}: SessionDetailModalProps) {
  const [comment, setComment] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  
  if (!isOpen || !session) {
    return null;
  }
  
  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };
  
  // Handle validation
  const handleValidate = () => {
    if (onValidate && session) {
      onValidate(session.id, selectedType || session.type, comment);
      onClose();
    }
  };
  
  // Handle rejection
  const handleReject = () => {
    if (onReject && session) {
      onReject(session.id, comment);
      onClose();
    }
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Détail de la séance</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{formatDate(session.date)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Créneau horaire</p>
              <p className="font-medium">{session.timeSlot}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Enseignant</p>
              <p className="font-medium">
                {session.teacherFirstName || ''} {session.teacherName}
                {session.inPacte && (
                  <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                    PACTE
                  </span>
                )}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Type</p>
              <div className="font-medium">
                <SessionTypeBadge type={session.type} />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Statut</p>
              <div className="font-medium">
                <StatusBadge status={session.status} />
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-500">Créé le</p>
              <p className="font-medium">
                {session.createdAt ? formatDate(session.createdAt) : 'N/A'}
              </p>
            </div>
          </div>
          
          {/* Informations spécifiques au type de séance */}
          {session.type === 'RCD' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Informations de remplacement</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Enseignant remplacé</p>
                  <p className="font-medium">
                    {session.replacedTeacherPrefix || ''} {session.replacedTeacherFirstName || ''} {session.replacedTeacherLastName || ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Classe</p>
                  <p className="font-medium">{session.className || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Matière</p>
                  <p className="font-medium">{session.subject || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          
          {session.type === 'DEVOIRS_FAITS' && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Informations Devoirs Faits</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Nombre d'élèves</p>
                  <p className="font-medium">{session.studentCount || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Niveau</p>
                  <p className="font-medium">{session.gradeLevel || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          
          {(session.type === 'HSE' || session.type === 'AUTRE') && (
            <div className="mb-6 p-4 bg-gray-50 rounded-md">
              <h3 className="font-medium mb-2">Description</h3>
              <p>{session.description || 'Aucune description fournie.'}</p>
            </div>
          )}
          
          {/* Pièces jointes */}
          {session.attachments && session.attachments.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Pièces jointes</h3>
              <ul className="space-y-2">
                {session.attachments.map((attachment: Attachment) => (
                  <li
                    key={attachment.id}
                    className="flex items-center justify-between p-2 border rounded-md"
                  >
                    <div className="flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-500 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8 4a3 3 0 00-3 3v4a5 5 0 0010 0V7a1 1 0 112 0v4a7 7 0 11-14 0V7a5 5 0 0110 0v4a3 3 0 11-6 0V7a1 1 0 012 0v4a1 1 0 102 0V7a3 3 0 00-3-3z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span>{attachment.name}</span>
                    </div>
                    <Button variant="outline" size="sm">
                      Télécharger
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Commentaires */}
          {session.comment && (
            <div className="mb-6">
              <h3 className="font-medium mb-2">Commentaires</h3>
              <div className="p-3 bg-gray-50 rounded-md">
                {session.comment}
              </div>
            </div>
          )}
          
          {/* Actions pour les séances soumises */}
          {session.status === 'SUBMITTED' && (onValidate || onReject) && (
            <div className="border-t pt-4 mt-4">
              <h3 className="font-medium mb-2">Actions</h3>
              
              {/* Type de séance (pour validation) */}
              {onValidate && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de séance
                  </label>
                  <select
                    value={selectedType || session.type}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    <option value="RCD">Remplacement de courte durée</option>
                    <option value="DEVOIRS_FAITS">Devoirs faits</option>
                    <option value="HSE">HSE</option>
                    <option value="AUTRE">Autre</option>
                  </select>
                </div>
              )}
              
              {/* Commentaire */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Commentaire
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  rows={3}
                  placeholder="Ajouter un commentaire (optionnel)"
                ></textarea>
              </div>
              
              {/* Boutons d'action */}
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                {onReject && (
                  <Button
                    variant="destructive"
                    onClick={handleReject}
                  >
                    Rejeter
                  </Button>
                )}
                {onValidate && (
                  <Button
                    variant="default"
                    onClick={handleValidate}
                  >
                    Valider
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
