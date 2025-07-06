import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

// Type pour un contrat d'enseignant
type TeacherContract = {
  id: number;
  teacherId: number;
  teacherName: string;
  teacherFirstName: string;
  contractNumber: string;
  startDate: string;
  endDate: string;
  totalHours: number;
  rcdHours: number;
  devoirsFaitsHours: number;
  completedRcdHours: number;
  completedDevoirsFaitsHours: number;
  completedOtherHours: number;
  status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED';
};

// Type pour un enseignant
type Teacher = {
  id: number;
  lastName: string;
  firstName: string;
  hasPacte: boolean;
};

export function TeacherContracts() {
  const { toast } = useToast();
  const [isAddContractModalOpen, setIsAddContractModalOpen] = useState(false);
  const [isEditContractModalOpen, setIsEditContractModalOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState<TeacherContract | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  
  // Formulaire pour ajouter/éditer un contrat
  const [formData, setFormData] = useState({
    contractNumber: '',
    startDate: '',
    endDate: '',
    totalHours: 36,
    rcdHours: 18,
    devoirsFaitsHours: 12,
    completedRcdHours: 0,
    completedDevoirsFaitsHours: 0,
    completedOtherHours: 0
  });
  
  // Exemples de contrats pour la démonstration
  const contracts: TeacherContract[] = [
    {
      id: 1,
      teacherId: 1,
      teacherName: 'MARTIN',
      teacherFirstName: 'Jean',
      contractNumber: 'CT-2025-001',
      startDate: '2025-01-01',
      endDate: '2025-06-30',
      totalHours: 36,
      rcdHours: 18,
      devoirsFaitsHours: 18,
      completedRcdHours: 5,
      completedDevoirsFaitsHours: 3,
      completedOtherHours: 1,
      status: 'ACTIVE'
    },
    {
      id: 2,
      teacherId: 2,
      teacherName: 'PETIT',
      teacherFirstName: 'Marie',
      contractNumber: 'CT-2025-002',
      startDate: '2025-01-15',
      endDate: '2025-06-30',
      totalHours: 28,
      rcdHours: 14,
      devoirsFaitsHours: 14,
      completedRcdHours: 4,
      completedDevoirsFaitsHours: 6,
      completedOtherHours: 0,
      status: 'ACTIVE'
    }
  ];
  
  // Exemples d'enseignants pour la démonstration
  const teachers: Teacher[] = [
    { id: 1, lastName: 'MARTIN', firstName: 'Jean', hasPacte: true },
    { id: 2, lastName: 'PETIT', firstName: 'Marie', hasPacte: true },
    { id: 3, lastName: 'DUBOIS', firstName: 'Pierre', hasPacte: false },
    { id: 4, lastName: 'LEROY', firstName: 'Sophie', hasPacte: false },
    { id: 5, lastName: 'MOREAU', firstName: 'Thomas', hasPacte: false }
  ];
  
  const openAddContractModal = () => {
    setFormData({
      contractNumber: `CT-2025-${String(contracts.length + 1).padStart(3, '0')}`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: '2025-06-30',
      totalHours: 36,
      rcdHours: 18,
      devoirsFaitsHours: 12,
      completedRcdHours: 0,
      completedDevoirsFaitsHours: 0,
      completedOtherHours: 0
    });
    setSelectedTeacher('');
    setIsAddContractModalOpen(true);
  };
  
  const openEditContractModal = (contract: TeacherContract) => {
    setSelectedContract(contract);
    setFormData({
      contractNumber: contract.contractNumber,
      startDate: contract.startDate,
      endDate: contract.endDate,
      totalHours: contract.totalHours,
      rcdHours: contract.rcdHours,
      devoirsFaitsHours: contract.devoirsFaitsHours,
      completedRcdHours: contract.completedRcdHours,
      completedDevoirsFaitsHours: contract.completedDevoirsFaitsHours,
      completedOtherHours: contract.completedOtherHours
    });
    setIsEditContractModalOpen(true);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'rcdHours' || name === 'devoirsFaitsHours') {
      const newValue = parseInt(value) || 0;
      // Mettre à jour le total automatiquement
      const otherField = name === 'rcdHours' ? 'devoirsFaitsHours' : 'rcdHours';
      const otherValue = formData[otherField as keyof typeof formData] as number;
      
      setFormData({
        ...formData,
        [name]: newValue,
        totalHours: newValue + otherValue
      });
    } else {
      setFormData({
        ...formData,
        [name]: name === 'totalHours' || name === 'completedRcdHours' || 
                name === 'completedDevoirsFaitsHours' || name === 'completedOtherHours'
                ? parseInt(value) || 0 : value
      });
    }
  };
  
  const saveContract = () => {
    if (!selectedTeacher) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un enseignant",
        variant: "destructive"
      });
      return;
    }
    
    // Validation des données du formulaire
    if (!formData.contractNumber || !formData.startDate || !formData.endDate || formData.totalHours <= 0) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }
    
    // Vérifier que la date de fin est après la date de début
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast({
        title: "Erreur de validation",
        description: "La date de fin doit être postérieure à la date de début",
        variant: "destructive"
      });
      return;
    }
    
    // Vérifier la cohérence des heures
    if (formData.rcdHours + formData.devoirsFaitsHours !== formData.totalHours) {
      toast({
        title: "Erreur de validation",
        description: "La somme des heures RCD et Devoirs Faits doit être égale au total",
        variant: "destructive"
      });
      return;
    }
    
    // Dans une implémentation réelle, on enverrait une requête à l'API
    console.log("Contrat sauvegardé:", {
      ...formData,
      teacherId: parseInt(selectedTeacher)
    });
    
    toast({
      title: "Succès",
      description: "Le contrat a été créé avec succès",
    });
    
    setIsAddContractModalOpen(false);
  };
  
  const updateContract = () => {
    if (!selectedContract) return;
    
    // Validation des données du formulaire
    if (!formData.contractNumber || !formData.startDate || !formData.endDate || formData.totalHours <= 0) {
      toast({
        title: "Erreur de validation",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive"
      });
      return;
    }
    
    // Vérifier que la date de fin est après la date de début
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast({
        title: "Erreur de validation",
        description: "La date de fin doit être postérieure à la date de début",
        variant: "destructive"
      });
      return;
    }
    
    // Vérifier la cohérence des heures
    if (formData.rcdHours + formData.devoirsFaitsHours !== formData.totalHours) {
      toast({
        title: "Erreur de validation",
        description: "La somme des heures RCD et Devoirs Faits doit être égale au total",
        variant: "destructive"
      });
      return;
    }
    
    // Dans une implémentation réelle, on enverrait une requête à l'API
    console.log("Contrat mis à jour:", {
      ...formData,
      id: selectedContract.id
    });
    
    toast({
      title: "Succès",
      description: "Le contrat a été mis à jour avec succès",
    });
    
    setIsEditContractModalOpen(false);
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold">Contrats des enseignants</h3>
          <Button onClick={openAddContractModal}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nouveau contrat
          </Button>
        </div>
        
        {contracts.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Numéro</TableHead>
                <TableHead>Enseignant</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Heures</TableHead>
                <TableHead>Progression</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {contracts.map(contract => (
                <TableRow key={contract.id}>
                  <TableCell className="font-medium">{contract.contractNumber}</TableCell>
                  <TableCell>
                    {contract.teacherName} {contract.teacherFirstName}
                  </TableCell>
                  <TableCell>
                    <div>Du {new Date(contract.startDate).toLocaleDateString('fr-FR')}</div>
                    <div>Au {new Date(contract.endDate).toLocaleDateString('fr-FR')}</div>
                  </TableCell>
                  <TableCell>
                    <div>Total: {contract.totalHours}h</div>
                    <div className="text-xs text-gray-500">RCD: {contract.rcdHours}h / DF: {contract.devoirsFaitsHours}h</div>
                  </TableCell>
                  <TableCell>
                    <div className="w-full bg-gray-200 rounded-full h-2.5 mb-1">
                      <div 
                        className="bg-primary h-2.5 rounded-full" 
                        style={{ width: `${Math.round(((contract.completedRcdHours + contract.completedDevoirsFaitsHours + contract.completedOtherHours) / contract.totalHours) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{contract.completedRcdHours + contract.completedDevoirsFaitsHours + contract.completedOtherHours}h</span>
                      <span>{Math.round(((contract.completedRcdHours + contract.completedDevoirsFaitsHours + contract.completedOtherHours) / contract.totalHours) * 100)}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openEditContractModal(contract)}
                    >
                      Modifier
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aucun contrat enregistré
          </div>
        )}
      </div>
      
      {/* Modal d'ajout de contrat */}
      <Dialog open={isAddContractModalOpen} onOpenChange={setIsAddContractModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Créer un nouveau contrat</DialogTitle>
            <DialogDescription>
              Ajoutez un contrat pour un enseignant dans le cadre du pacte
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="teacher">Enseignant*</Label>
              <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un enseignant" />
                </SelectTrigger>
                <SelectContent>
                  {teachers
                    .filter(teacher => !teacher.hasPacte)
                    .map(teacher => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.lastName} {teacher.firstName}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contractNumber">Numéro de contrat*</Label>
                <Input 
                  id="contractNumber" 
                  name="contractNumber"
                  value={formData.contractNumber} 
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="totalHours">Heures totales*</Label>
                <Input 
                  id="totalHours" 
                  name="totalHours"
                  type="number" 
                  value={formData.totalHours}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Date de début*</Label>
                <Input 
                  id="startDate" 
                  name="startDate"
                  type="date" 
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endDate">Date de fin*</Label>
                <Input 
                  id="endDate" 
                  name="endDate"
                  type="date" 
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rcdHours">Heures RCD*</Label>
                <Input 
                  id="rcdHours" 
                  name="rcdHours"
                  type="number" 
                  value={formData.rcdHours}
                  onChange={handleInputChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="devoirsFaitsHours">Heures Devoirs Faits*</Label>
                <Input 
                  id="devoirsFaitsHours" 
                  name="devoirsFaitsHours"
                  type="number" 
                  value={formData.devoirsFaitsHours}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <h4 className="font-medium mb-2">Heures déjà effectuées (avant la mise en place)</h4>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="completedRcdHours">RCD</Label>
                  <Input 
                    id="completedRcdHours" 
                    name="completedRcdHours"
                    type="number" 
                    value={formData.completedRcdHours}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="completedDevoirsFaitsHours">Devoirs Faits</Label>
                  <Input 
                    id="completedDevoirsFaitsHours" 
                    name="completedDevoirsFaitsHours"
                    type="number" 
                    value={formData.completedDevoirsFaitsHours}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="completedOtherHours">Autres</Label>
                  <Input 
                    id="completedOtherHours" 
                    name="completedOtherHours"
                    type="number" 
                    value={formData.completedOtherHours}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsAddContractModalOpen(false)}
            >
              Annuler
            </Button>
            <Button 
              onClick={saveContract}
            >
              Créer le contrat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de modification de contrat */}
      <Dialog open={isEditContractModalOpen} onOpenChange={setIsEditContractModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          {selectedContract && (
            <>
              <DialogHeader>
                <DialogTitle>Modifier le contrat #{selectedContract.contractNumber}</DialogTitle>
                <DialogDescription>
                  {selectedContract.teacherName} {selectedContract.teacherFirstName}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contractNumber">Numéro de contrat*</Label>
                    <Input 
                      id="contractNumber" 
                      name="contractNumber"
                      value={formData.contractNumber} 
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="totalHours">Heures totales*</Label>
                    <Input 
                      id="totalHours" 
                      name="totalHours"
                      type="number" 
                      value={formData.totalHours}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Date de début*</Label>
                    <Input 
                      id="startDate" 
                      name="startDate"
                      type="date" 
                      value={formData.startDate}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Date de fin*</Label>
                    <Input 
                      id="endDate" 
                      name="endDate"
                      type="date" 
                      value={formData.endDate}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="rcdHours">Heures RCD*</Label>
                    <Input 
                      id="rcdHours" 
                      name="rcdHours"
                      type="number" 
                      value={formData.rcdHours}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="devoirsFaitsHours">Heures Devoirs Faits*</Label>
                    <Input 
                      id="devoirsFaitsHours" 
                      name="devoirsFaitsHours"
                      type="number" 
                      value={formData.devoirsFaitsHours}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium mb-2">Heures déjà effectuées</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="completedRcdHours">RCD</Label>
                      <Input 
                        id="completedRcdHours" 
                        name="completedRcdHours"
                        type="number" 
                        value={formData.completedRcdHours}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="completedDevoirsFaitsHours">Devoirs Faits</Label>
                      <Input 
                        id="completedDevoirsFaitsHours" 
                        name="completedDevoirsFaitsHours"
                        type="number" 
                        value={formData.completedDevoirsFaitsHours}
                        onChange={handleInputChange}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="completedOtherHours">Autres</Label>
                      <Input 
                        id="completedOtherHours" 
                        name="completedOtherHours"
                        type="number" 
                        value={formData.completedOtherHours}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => setIsEditContractModalOpen(false)}
                >
                  Annuler
                </Button>
                <Button 
                  onClick={updateContract}
                >
                  Mettre à jour
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}