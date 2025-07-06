import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TIME_SLOTS } from "@shared/schema";
import { Sun, Moon, Plus, FileText, Image, FileSpreadsheet } from 'lucide-react';

// Schéma de validation pour le formulaire Devoirs Faits
const formSchema = z.object({
  date: z.string().min(1, { message: "La date est requise" }),
  timeSlot: z.string().min(1, { message: "Le créneau horaire est requis" }),
  studentCount: z.string().min(1, { message: "Le nombre d'élèves est requis" }),
  gradeLevel: z.string().min(1, { message: "Le niveau est requis" }),
  attachDocument: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface DevoirsFaitsFormProps {
  initialData?: any;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  selectedDate?: Date;
  selectedTimeSlot?: string;
}

export function DevoirsFaitsForm({
  initialData,
  onSubmit,
  onCancel,
  selectedDate,
  selectedTimeSlot
}: DevoirsFaitsFormProps) {
  const [showDocumentOptions, setShowDocumentOptions] = useState(false);
  
  // Initialiser le formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData?.date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''),
      timeSlot: initialData?.timeSlot || selectedTimeSlot || '',
      studentCount: initialData?.studentCount?.toString() || '',
      gradeLevel: initialData?.gradeLevel || '',
      attachDocument: initialData?.attachDocument || false,
    },
  });
  
  // Gérer la soumission du formulaire
  const handleFormSubmit = (values: FormValues) => {
    onSubmit(values);
  };
  
  // Déterminer si le créneau est du matin ou de l'après-midi
  const isMorningSlot = (slot: string) => ['M1', 'M2', 'M3', 'M4'].includes(slot);
  const isAfternoonSlot = (slot: string) => ['S1', 'S2', 'S3', 'S4'].includes(slot);
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Devoirs Faits</h2>
      <p className="text-sm text-muted-foreground">Veuillez remplir les informations de la séance de Devoirs Faits</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Sélection du créneau horaire */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Créneau horaire</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Sun className="h-4 w-4 text-amber-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Matin</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['M1', 'M2', 'M3', 'M4'].map((slot) => (
                    <FormField
                      key={slot}
                      control={form.control}
                      name="timeSlot"
                      render={({ field }) => (
                        <Button
                          type="button"
                          variant={field.value === slot ? "default" : "outline"}
                          className={`w-full ${field.value === slot ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200' : ''}`}
                          onClick={() => form.setValue('timeSlot', slot)}
                        >
                          {slot}
                        </Button>
                      )}
                    />
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Moon className="h-4 w-4 text-indigo-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Après-midi</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {['S1', 'S2', 'S3', 'S4'].map((slot) => (
                    <FormField
                      key={slot}
                      control={form.control}
                      name="timeSlot"
                      render={({ field }) => (
                        <Button
                          type="button"
                          variant={field.value === slot ? "default" : "outline"}
                          className={`w-full ${field.value === slot ? 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-200' : ''}`}
                          onClick={() => form.setValue('timeSlot', slot)}
                        >
                          {slot}
                        </Button>
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
            {form.formState.errors.timeSlot && (
              <p className="text-sm text-red-500">{form.formState.errors.timeSlot.message}</p>
            )}
          </div>
          
          {/* Nombre d'élèves */}
          <FormField
            control={form.control}
            name="studentCount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nombre d'élèves</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="1"
                    {...field}
                    placeholder="Nombre d'élèves présents"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Niveau */}
          <FormField
            control={form.control}
            name="gradeLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Niveau</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un niveau" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="6e">6ème</SelectItem>
                    <SelectItem value="5e">5ème</SelectItem>
                    <SelectItem value="4e">4ème</SelectItem>
                    <SelectItem value="3e">3ème</SelectItem>
                    <SelectItem value="mixte">Niveaux mixtes</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Joindre un document */}
          <FormField
            control={form.control}
            name="attachDocument"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) => {
                        field.onChange(checked);
                        setShowDocumentOptions(!!checked);
                      }}
                    />
                  </FormControl>
                  <FormLabel className="font-normal">
                    Joindre un document
                  </FormLabel>
                </div>
                <FormMessage />
                
                {showDocumentOptions && (
                  <div className="mt-2 ml-6 flex gap-2">
                    <Button type="button" variant="outline" className="flex items-center gap-1">
                      <FileSpreadsheet className="h-4 w-4" />
                      <span>Excel</span>
                    </Button>
                    <Button type="button" variant="outline" className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      <span>PDF</span>
                    </Button>
                    <Button type="button" variant="outline" className="flex items-center gap-1">
                      <Image className="h-4 w-4" />
                      <span>Photo</span>
                    </Button>
                  </div>
                )}
              </FormItem>
            )}
          />
          
          {/* Liste des élèves */}
          <div className="space-y-2">
            <Label>Liste des élèves</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full flex items-center justify-center gap-1"
            >
              <Plus className="h-4 w-4" />
              <span>Ajouter un élève manuellement</span>
            </Button>
          </div>
          
          {/* Boutons d'action */}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
            >
              Fermer
            </Button>
            <Button type="submit">Soumettre</Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
