-- Ajout du statut PENDING_DOCUMENTS pour la demande de pièces jointes par la secrétaire
ALTER TYPE "public"."session_status" ADD VALUE IF NOT EXISTS 'PENDING_DOCUMENTS' AFTER 'PENDING_REVIEW';
