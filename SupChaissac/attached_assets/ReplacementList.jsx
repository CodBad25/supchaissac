
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Trash2, Check, X, Copy, UserPlus, Pencil, Bell, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

function ReplacementList({ replacements, userRole, onApply, onValidate, onDuplicate, onDelete, onUpdate }) {
  const handleResetValidation = (replacement) => {
    onValidate(replacement.id, null, null, null, true);
  };

  return (
    <div className="space-y-4">
      {replacements.map(replacement => (
        <motion.div
          key={replacement.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-lg">
                  {replacement.civility} {replacement.replacedTeacher}
                </span>
                {replacement.subject && (
                  <span className="px-2 py-0.5 rounded text-sm font-medium bg-blue-500 text-white">
                    {replacement.subject}
                  </span>
                )}
              </div>
              <div className="text-gray-500">
                {format(new Date(replacement.date), "EEEE d MMMM yyyy", { locale: fr })}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {replacement.creneauxClasses && Object.entries(replacement.creneauxClasses).map(([creneau, classe]) => (
                  <div
                    key={creneau}
                    className="flex items-center gap-1 text-sm bg-gray-100 px-2 py-1 rounded"
                  >
                    <span className="font-medium">{creneau}</span>
                    <span className="text-gray-600">{classe}</span>
                  </div>
                ))}
              </div>
              {replacement.room && (
                <div className="text-gray-600 mt-1">
                  Salle : {replacement.room}
                </div>
              )}
              {replacement.comments && (
                <div className="text-gray-600 mt-2 italic">
                  "{replacement.comments}"
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {userRole === "admin" && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDuplicate(replacement)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdate(replacement)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                        <AlertDialogDescription>
                          Êtes-vous sûr de vouloir supprimer ce remplacement ?
                          Cette action ne peut pas être annulée.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => onDelete(replacement.id)}
                        >
                          Supprimer
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </>
              )}
            </div>
          </div>

          {userRole === "teacher" && !replacement.applicant && (
            <div className="mt-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Postuler
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Postuler pour ce remplacement</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 mt-2">
                    <div>
                      <label className="text-sm font-medium">
                        Demander une salle
                      </label>
                      <input
                        type="text"
                        placeholder="Numéro de salle"
                        className="w-full mt-1 p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        Commentaire (optionnel)
                      </label>
                      <textarea
                        placeholder="Votre commentaire..."
                        className="w-full mt-1 p-2 border rounded h-24 resize-none"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="notifications"
                        className="rounded border-gray-300"
                      />
                      <label
                        htmlFor="notifications"
                        className="text-sm cursor-pointer select-none"
                      >
                        M'envoyer une notification quand ma candidature sera traitée
                      </label>
                    </div>
                    <Button className="w-full">
                      Envoyer ma candidature
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          )}

          {replacement.applicant && (
            <div className="mt-4 pt-4 border-t">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        replacement.status === "accepted"
                          ? replacement.roomStatus === "rejected"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                          : replacement.status === "rejected"
                          ? "bg-red-500"
                          : "bg-blue-500"
                      }`}
                    />
                    <span className="font-medium">{replacement.applicant}</span>
                  </div>
                  {replacement.requestedRoom && (
                    <span className="text-gray-500">
                      Salle demandée : {replacement.requestedRoom}
                    </span>
                  )}
                  {replacement.wantsNotification && (
                    <Bell className="h-4 w-4 text-blue-500" />
                  )}
                </div>

                {userRole === "admin" && replacement.status === "pending" && (
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 border-green-200 hover:bg-green-50"
                      onClick={() => onValidate(replacement.id, true, true)}
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Tout accepter
                    </Button>

                    {replacement.requestedRoom && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-yellow-600 border-yellow-200 hover:bg-yellow-50"
                        onClick={() => onValidate(replacement.id, true, false, "Salle non disponible")}
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Accepter sans la salle
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      onClick={() => onValidate(replacement.id, false, false, "Candidature refusée")}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Refuser
                    </Button>
                  </div>
                )}

                {userRole === "admin" && replacement.status !== "pending" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleResetValidation(replacement)}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Réinitialiser
                  </Button>
                )}
              </div>

              {replacement.comment && (
                <div className="mt-2 text-gray-600 italic">
                  "{replacement.comment}"
                </div>
              )}

              {replacement.status !== "pending" && (
                <div className="mt-2 text-sm">
                  {replacement.status === "accepted" ? (
                    replacement.roomStatus === "rejected" ? (
                      <span className="text-yellow-600">
                        Accepté sans la salle • {replacement.rejectionReason}
                      </span>
                    ) : (
                      <span className="text-green-600">
                        Accepté avec la salle
                      </span>
                    )
                  ) : (
                    <span className="text-red-600">
                      Refusé • {replacement.rejectionReason}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default ReplacementList;
