import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Edit, Save, X } from 'lucide-react';

// Type pour les enseignants
interface Teacher {
  id: number;
  username: string;
  name: string;
  role: string;
  inPacte: boolean;
  pacteSetup?: {
    inPacte: boolean;
    pacteHoursTarget: number | null;
    pacteHoursCompleted: number;
    pacteStartDate: string | null;
  };
}

export function TeacherManagement() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [editForm, setEditForm] = useState({
    inPacte: false,
    pacteHoursTarget: '',
    pacteStartDate: '',
  });

  // Récupérer la liste des enseignants
  const { data: teachers = [], isLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/teachers');
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des enseignants');
      }
      return response.json();
    },
  });

  // Mutation pour mettre à jour le statut pacte d'un enseignant
  const updatePacteMutation = useMutation({
    mutationFn: async (data: { teacherId: number; inPacte: boolean; pacteHoursTarget?: number; pacteStartDate?: string }) => {
      const response = await apiRequest('PATCH', `/api/teacher/${data.teacherId}/pacte`, data);
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erreur lors de la mise à jour du statut pacte');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      toast({
        title: 'Succès',
        description: 'Le statut pacte a été mis à jour',
      });
      setIsEditModalOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Erreur',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Filtrer les enseignants selon le terme de recherche
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Ouvrir la modale d'édition pour un enseignant
  const handleEditTeacher = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setEditForm({
      inPacte: teacher.inPacte,
      pacteHoursTarget: teacher.pacteSetup?.pacteHoursTarget?.toString() || '',
      pacteStartDate: teacher.pacteSetup?.pacteStartDate || '',
    });
    setIsEditModalOpen(true);
  };

  // Soumettre le formulaire d'édition
  const handleSubmitEdit = () => {
    if (!selectedTeacher) return;

    updatePacteMutation.mutate({
      teacherId: selectedTeacher.id,
      inPacte: editForm.inPacte,
      pacteHoursTarget: editForm.pacteHoursTarget ? parseInt(editForm.pacteHoursTarget) : undefined,
      pacteStartDate: editForm.pacteStartDate || undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Gestion des enseignants</CardTitle>
          <CardDescription>
            Gérez le statut pacte et les heures contractuelles des enseignants
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Barre de recherche */}
          <div className="flex items-center space-x-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Rechercher un enseignant..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Tableau des enseignants */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Statut Pacte</TableHead>
                  <TableHead>Heures cible</TableHead>
                  <TableHead>Heures effectuées</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.length > 0 ? (
                  filteredTeachers.map((teacher) => (
                    <TableRow key={teacher.id}>
                      <TableCell className="font-medium">{teacher.name}</TableCell>
                      <TableCell>{teacher.username}</TableCell>
                      <TableCell>
                        <Badge variant={teacher.inPacte ? "default" : "outline"}>
                          {teacher.inPacte ? "Pacte" : "Non pacte"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {teacher.pacteSetup?.pacteHoursTarget || "-"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{teacher.pacteSetup?.pacteHoursCompleted || 0}</span>
                          {teacher.inPacte && teacher.pacteSetup?.pacteHoursTarget && (
                            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-green-500"
                                style={{
                                  width: `${Math.min(100, ((teacher.pacteSetup?.pacteHoursCompleted || 0) / teacher.pacteSetup?.pacteHoursTarget) * 100)}%`
                                }}
                              ></div>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTeacher(teacher)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun enseignant trouvé
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Modale d'édition */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modifier le statut pacte</DialogTitle>
            <DialogDescription>
              {selectedTeacher?.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="pacte-status"
                checked={editForm.inPacte}
                onCheckedChange={(checked) => setEditForm({ ...editForm, inPacte: checked })}
              />
              <Label htmlFor="pacte-status">
                {editForm.inPacte ? "Participe au pacte" : "Ne participe pas au pacte"}
              </Label>
            </div>

            {editForm.inPacte && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="pacte-hours-target">Heures à effectuer</Label>
                  <Input
                    id="pacte-hours-target"
                    type="number"
                    value={editForm.pacteHoursTarget}
                    onChange={(e) => setEditForm({ ...editForm, pacteHoursTarget: e.target.value })}
                    placeholder="Nombre d'heures"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pacte-start-date">Date de début du contrat</Label>
                  <Input
                    id="pacte-start-date"
                    type="date"
                    value={editForm.pacteStartDate}
                    onChange={(e) => setEditForm({ ...editForm, pacteStartDate: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleSubmitEdit}
              disabled={updatePacteMutation.isPending}
            >
              {updatePacteMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
