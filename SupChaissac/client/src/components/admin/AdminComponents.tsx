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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { UserManagement } from './UserManagement';
import { CSVImport } from './CSVImport';
import { PasswordReset } from './PasswordReset';
import { AdminDashboard } from './AdminDashboard';
import { AdminTabs } from './AdminTabs';

export function AdminView() {
  return <AdminTabs />;
}

function SettingsManagement() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    allowWeekendSessions: false,
    requireAttachments: true,
    contractHoursLimit: true,
  });
  
  const handleSettingChange = (setting: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
    
    toast({
      title: "Paramètre modifié",
      description: `Le paramètre a été mis à jour avec succès.`
    });
  };
  
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-6">Paramètres de l'application</h3>
        
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Autoriser les sessions le weekend</Label>
              <p className="text-sm text-gray-500">Permettre la création de sessions les samedis et dimanches</p>
            </div>
            <Checkbox 
              checked={settings.allowWeekendSessions}
              onCheckedChange={(checked) => handleSettingChange('allowWeekendSessions', checked as boolean)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Pièces jointes obligatoires</Label>
              <p className="text-sm text-gray-500">Exiger des pièces justificatives pour les sessions "Devoirs Faits"</p>
            </div>
            <Checkbox 
              checked={settings.requireAttachments}
              onCheckedChange={(checked) => handleSettingChange('requireAttachments', checked as boolean)}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Limiter aux heures du contrat</Label>
              <p className="text-sm text-gray-500">Empêcher de dépasser le nombre d'heures prévu au contrat</p>
            </div>
            <Checkbox 
              checked={settings.contractHoursLimit}
              onCheckedChange={(checked) => handleSettingChange('contractHoursLimit', checked as boolean)}
            />
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6 border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Types de sessions</h3>
        <p className="text-sm text-gray-500 mb-4">Gérer les types de sessions disponibles dans l'application</p>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">RCD</span>
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-300">Actif</Badge>
            </div>
            <p className="text-xs text-gray-600">Remplacement de courte durée</p>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Devoirs Faits</span>
              <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-300">Actif</Badge>
            </div>
            <p className="text-xs text-gray-600">Sessions d'aide aux devoirs</p>
          </div>
          
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Autre</span>
              <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-300">Actif</Badge>
            </div>
            <p className="text-xs text-gray-600">Autres types d'activités</p>
          </div>
        </div>
      </div>
    </div>
  );
}