import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, Clock } from "lucide-react";

type SystemSetting = {
  id: number;
  key: string;
  value: string;
  description: string | null;
  updatedAt: string;
  updatedBy: string | null;
};

export function SystemSettings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editTimeWindow, setEditTimeWindow] = useState(60); // Valeur par défaut 60 minutes

  // Récupérer les paramètres système
  const { data: settings, isLoading } = useQuery<SystemSetting[]>({
    queryKey: ['/api/system-settings']
  });
  
  // Effet pour mettre à jour la valeur du délai d'édition lorsque les paramètres sont chargés
  useEffect(() => {
    if (settings) {
      const editWindowSetting = settings.find(s => s.key === 'SESSION_EDIT_WINDOW');
      if (editWindowSetting) {
        setEditTimeWindow(parseInt(editWindowSetting.value));
      }
    }
  }, [settings]);

  // Mutation pour mettre à jour un paramètre
  const updateSettingMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string, value: string }) => {
      const response = await fetch(`/api/system-settings/${key}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ value })
      });
      
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour du paramètre");
      }
      
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/system-settings'] });
      toast({
        title: "Paramètre mis à jour",
        description: "Le paramètre a été enregistré avec succès",
        variant: "default"
      });
    },
    onError: (error) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Convertir le temps (en minutes) en format plus lisible
  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (mins === 0) {
        return `${hours} heure${hours > 1 ? 's' : ''}`;
      } else {
        return `${hours} heure${hours > 1 ? 's' : ''} et ${mins} minute${mins > 1 ? 's' : ''}`;
      }
    }
  };

  // Sauvegarder le délai d'édition
  const saveEditTimeWindow = () => {
    updateSettingMutation.mutate({
      key: 'SESSION_EDIT_WINDOW',
      value: editTimeWindow.toString()
    });
  };

  return (
    <div className="space-y-6" id="settings">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Paramètres système</h2>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2">
        {/* Paramètre de délai d'édition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-muted-foreground" />
              Délai de modification des sessions
            </CardTitle>
            <CardDescription>
              Définir combien de temps un enseignant peut modifier une session après sa création
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  <Label>Durée</Label>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[editTimeWindow]}
                      onValueChange={(value) => setEditTimeWindow(value[0])}
                      min={5}
                      max={180}
                      step={5}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={editTimeWindow}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        if (!isNaN(value) && value >= 5 && value <= 180) {
                          setEditTimeWindow(value);
                        }
                      }}
                      className="w-20"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatTime(editTimeWindow)}
                  </p>
                </div>
                
                <div className="rounded-md bg-muted p-3">
                  <p className="text-sm">
                    Les enseignants pourront modifier ou supprimer leurs sessions uniquement pendant 
                    <span className="font-bold"> {formatTime(editTimeWindow)} </span> 
                    après les avoir créées.
                  </p>
                </div>
              </>
            )}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <Button 
              onClick={saveEditTimeWindow} 
              disabled={isLoading || updateSettingMutation.isPending}
              className="ml-auto"
            >
              {updateSettingMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Enregistrer
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
        
        {/* Autres paramètres système peuvent être ajoutés ici */}
      </div>
    </div>
  );
}