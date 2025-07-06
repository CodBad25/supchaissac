
import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { 
  X, 
  Users, 
  BookOpen, 
  Clock,
  Upload,
  Camera,
  UserPlus,
  Sun,
  Moon,
  Download,
  FileSpreadsheet
} from 'lucide-react';

function SessionForm({ day, onSave, onCancel }) {
  const [form, setForm] = useState({
    id: Date.now(),
    type: '',
    timeSlot: 'M1',
    date: day.date,
    teacherTitle: 'M.',
    teacher: '',
    classroom: '',
    description: '',
    students: [],
    documents: []
  });

  const [newStudent, setNewStudent] = useState({
    name: '',
    class: ''
  });
  
  const fileInputRef = useRef(null);
  const { toast } = useToast();

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleDownloadTemplate = () => {
    const csvContent = "Nom;Prénom;Classe\nDUPONT;Jean;6A\nMARTIN;Marie;5B";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modele_liste_eleves.csv';
    link.click();
    
    toast({
      title: "Modèle téléchargé",
      description: "Le modèle de fichier a été téléchargé avec succès",
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result;
          if (typeof text === 'string') {
            const lines = text.split('\n');
            const students = lines
              .slice(1)
              .filter(line => line.trim())
              .map(line => {
                const [nom, prenom, classe] = line.split(';');
                return {
                  name: `${nom} ${prenom}`.trim(),
                  class: classe?.trim() || ''
                };
              });

            setForm(prev => ({
              ...prev,
              students: [...prev.students, ...students],
              documents: [...prev.documents, { name: file.name, type: 'file' }]
            }));

            toast({
              title: "Import réussi",
              description: `${students.length} élève(s) importé(s)`,
            });
          }
        } catch (error) {
          toast({
            title: "Erreur d'import",
            description: "Le format du fichier n'est pas valide",
            variant: "destructive"
          });
        }
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!form.type || !form.timeSlot) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un type et un créneau",
        variant: "destructive"
      });
      return;
    }

    if (form.type === 'AUTRE' && !form.description.trim()) {
      toast({
        title: "Erreur",
        description: "La description est obligatoire pour ce type de séance",
        variant: "destructive"
      });
      return;
    }

    if (form.type === 'RCD' && (!form.teacher || !form.classroom)) {
      toast({
        title: "Erreur",
        description: "Le nom du professeur et la classe sont obligatoires pour ce type de séance",
        variant: "destructive"
      });
      return;
    }

    onSave(form);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-lg shadow-xl w-[500px] max-h-[90vh] flex flex-col"
      >
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Nouvelle séance</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onCancel}
            className="hover:bg-gray-100 rounded-full"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="overflow-y-auto p-4 space-y-4">
          {/* Type de séance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de séance
            </label>
            <div className="grid grid-cols-3 gap-2">
              <Button
                type="button"
                className={`flex items-center gap-2 ${
                  form.type === 'RCD'
                    ? 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setForm(prev => ({ ...prev, type: 'RCD' }))}
              >
                <Users className="h-4 w-4" />
                RCD
              </Button>
              <Button
                type="button"
                className={`flex items-center gap-2 ${
                  form.type === 'DEVOIRS FAITS'
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setForm(prev => ({ ...prev, type: 'DEVOIRS FAITS' }))}
              >
                <BookOpen className="h-4 w-4" />
                Devoirs Faits
              </Button>
              <Button
                type="button"
                className={`flex items-center gap-2 ${
                  form.type === 'AUTRE'
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
                onClick={() => setForm(prev => ({ ...prev, type: 'AUTRE' }))}
              >
                <Clock className="h-4 w-4" />
                Autre
              </Button>
            </div>
          </div>

          {/* Créneau horaire */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Créneau horaire
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <Sun className="h-4 w-4" /> Matin
                </h4>
                <div className="grid grid-cols-2 gap-1">
                  {['M1', 'M2', 'M3', 'M4'].map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      size="sm"
                      className={`${
                        form.timeSlot === slot
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setForm(prev => ({ ...prev, timeSlot: slot }))}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-1">
                  <Moon className="h-4 w-4" /> Après-midi
                </h4>
                <div className="grid grid-cols-2 gap-1">
                  {['S1', 'S2', 'S3', 'S4'].map((slot) => (
                    <Button
                      key={slot}
                      type="button"
                      size="sm"
                      className={`${
                        form.timeSlot === slot
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setForm(prev => ({ ...prev, timeSlot: slot }))}
                    >
                      {slot}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Champs spécifiques selon le type */}
          {form.type === 'RCD' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Professeur remplacé
                </label>
                <div className="flex gap-2">
                  <div className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      className={`${
                        form.teacherTitle === 'M.'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setForm(prev => ({ ...prev, teacherTitle: 'M.' }))}
                    >
                      M.
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className={`${
                        form.teacherTitle === 'Mme'
                          ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                          : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setForm(prev => ({ ...prev, teacherTitle: 'Mme' }))}
                    >
                      Mme
                    </Button>
                  </div>
                  <input
                    type="text"
                    className="flex-1 rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nom du professeur"
                    value={form.teacher}
                    onChange={(e) => setForm(prev => ({ ...prev, teacher: e.target.value.toUpperCase() }))}
                    onKeyPress={handleKeyPress}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Classe
                </label>
                <input
                  type="text"
                  className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 6A"
                  value={form.classroom}
                  onChange={(e) => setForm(prev => ({ ...prev, classroom: e.target.value.toUpperCase() }))}
                  onKeyPress={handleKeyPress}
                />
              </div>
            </div>
          )}

          {form.type === 'DEVOIRS FAITS' && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Documents
                </label>
                <div className="flex flex-wrap gap-2">
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={handleDownloadTemplate}
                    >
                      <Download className="h-4 w-4" />
                      Télécharger le modèle
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileSpreadsheet className="h-4 w-4" />
                      Importer la liste (CSV)
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2"
                      onClick={() => {
                        setForm(prev => ({
                          ...prev,
                          documents: [...prev.documents, { name: `Photo ${prev.documents.length + 1}`, type: 'photo' }]
                        }));
                      }}
                    >
                      <Camera className="h-4 w-4" />
                      Prendre en photo
                    </Button>
                  </div>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".csv,.xls,.xlsx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Format attendu : fichier CSV avec colonnes Nom;Prénom;Classe
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ajouter un élève manuellement
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    className="flex-1 rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nom de l'élève"
                    value={newStudent.name}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, name: e.target.value }))}
                    onKeyPress={handleKeyPress}
                  />
                  <input
                    type="text"
                    className="w-24 rounded-md border border-gray-300 shadow-sm px-3 py-2 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Classe"
                    value={newStudent.class}
                    onChange={(e) => setNewStudent(prev => ({ ...prev, class: e.target.value }))}
                    onKeyPress={handleKeyPress}
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      if (newStudent.name && newStudent.class) {
                        setForm(prev => ({
                          ...prev,
                          students: [...prev.students, { ...newStudent }]
                        }));
                        setNewStudent({ name: '', class: '' });
                      }
                    }}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {form.students.length > 0 && (
                <div className="max-h-32 overflow-y-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Liste des élèves
                  </label>
                  <div className="space-y-1">
                    {form.students.map((student, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                      >
                        <span className="text-sm">{student.name} - {student.class}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              students: prev.students.filter((_, i) => i !== index)
                            }));
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {form.documents.length > 0 && (
                <div className="max-h-32 overflow-y-auto">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Documents ajoutés
                  </label>
                  <div className="space-y-1">
                    {form.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-2 rounded-md"
                      >
                        <div className="flex items-center gap-2 text-sm">
                          {doc.type === 'file' ? (
                            <Upload className="h-4 w-4 text-blue-500" />
                          ) : (
                            <Camera className="h-4 w-4 text-green-500" />
                          )}
                          <span>{doc.name}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setForm(prev => ({
                              ...prev,
                              documents: prev.documents.filter((_, i) => i !== index)
                            }));
                          }}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 h-6 w-6"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {form.type === 'AUTRE' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                className={`w-full rounded-md border ${
                  form.type === 'AUTRE' && !form.description.trim() 
                    ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                } shadow-sm px-3 py-2 focus:outline-none focus:ring-1`}
                rows={3}
                placeholder="Décrivez la nature de l'intervention..."
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              {form.type === 'AUTRE' && !form.description.trim() && (
                <p className="mt-1 text-sm text-red-600">
                  Ce champ est obligatoire
                </p>
              )}
            </div>
          )}
        </div>

        <div className="border-t p-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button onClick={handleSubmit}>
            Ajouter
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

export default SessionForm;
