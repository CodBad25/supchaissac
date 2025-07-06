
// Mise à jour du formulaire de contrat avec option de suppression
// et champs pour les heures déjà effectuées
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Trash2, Upload, Download } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

function ContractForm({ onClose, onSave, onDelete, initialData = null }) {
  const [formData, setFormData] = useState(initialData || {
    teacherName: '',
    teacherEmail: '',
    number: `PACTE-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
    startDate: new Date().toISOString().split('T')[0],
    rcdHours: 30,
    devoirsFaitsHours: 20,
    completedRcdHours: 0,
    completedDevoirsFaitsHours: 0,
    completedOtherHours: 0
  });

  const { toast } = useToast();
  const fileInputRef = React.useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const text = event.target?.result;
          if (typeof text === 'string') {
            // Supposons un format CSV : "Type,Heures"
            const lines = text.split('\n');
            const data = {};
            
            lines.slice(1).forEach(line => {
              const [type, hours] = line.split(',');
              if (type && hours) {
                switch(type.trim().toUpperCase()) {
                  case 'RCD':
                    data.completedRcdHours = parseInt(hours) || 0;
                    break;
                  case 'DEVOIRS FAITS':
                    data.completedDevoirsFaitsHours = parseInt(hours) || 0;
                    break;
                  case 'AUTRE':
                    data.completedOtherHours = parseInt(hours) || 0;
                    break;
                }
              }
            });

            setFormData(prev => ({
              ...prev,
              ...data
            }));

            toast({
              title: "Import réussi",
              description: "Les heures ont été importées avec succès",
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

  const handleDownloadTemplate = () => {
    const csvContent = "Type,Heures\nRCD,0\nDEVOIRS FAITS,0\nAUTRE,0";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modele_heures.csv';
    link.click();
    
    toast({
      title: "Modèle téléchargé",
      description: "Le modèle de fichier a été téléchargé",
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-[600px] max-h-[90vh] overflow-auto"
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">
              {initialData ? 'Modifier le contrat' : 'Nouveau contrat Pacte'}
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-gray-100 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations de l'enseignant */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Informations de l'enseignant</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nom de l'enseignant
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2"
                    value={formData.teacherName}
                    onChange={(e) => setFormData(prev => ({ ...prev, teacherName: e.target.value }))}
                    required
                    placeholder="ex: Jean DUPONT"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email académique
                  </label>
                  <input
                    type="email"
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2"
                    value={formData.teacherEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, teacherEmail: e.target.value }))}
                    placeholder="ex: jean.dupont@ac-academie.fr"
                  />
                </div>
              </div>
            </div>

            {/* Informations du contrat */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Informations du contrat</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de contrat
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2"
                    value={formData.number}
                    onChange={(e) => setFormData(prev => ({ ...prev, number: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Heures à effectuer */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-900">Heures à effectuer</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heures RCD
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2"
                    value={formData.rcdHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, rcdHours: parseInt(e.target.value) }))}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Heures Devoirs Faits
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2"
                    value={formData.devoirsFaitsHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, devoirsFaitsHours: parseInt(e.target.value) }))}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Heures déjà effectuées */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium text-gray-900">Heures déjà effectuées</h3>
                <div className="flex gap-2">
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
                    <Upload className="h-4 w-4" />
                    Importer (CSV)
                  </Button>
                </div>
              </div>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileUpload}
                accept=".csv"
              />
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RCD effectuées
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2"
                    value={formData.completedRcdHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, completedRcdHours: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Devoirs Faits effectuées
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2"
                    value={formData.completedDevoirsFaitsHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, completedDevoirsFaitsHours: parseInt(e.target.value) }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Autres heures
                  </label>
                  <input
                    type="number"
                    min="0"
                    className="w-full rounded-md border border-gray-300 shadow-sm px-3 py-2"
                    value={formData.completedOtherHours}
                    onChange={(e) => setFormData(prev => ({ ...prev, completedOtherHours: parseInt(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 border-t">
              {initialData && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (onDelete) onDelete(initialData.id);
                  }}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Supprimer
                </Button>
              )}
              <div className="flex gap-2 ml-auto">
                <Button type="button" variant="outline" onClick={onClose}>
                  Annuler
                </Button>
                <Button type="submit">
                  {initialData ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

export default ContractForm;
