import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { TIME_SLOTS } from "@shared/schema";
import { Sun, Moon, FileText, Image, FileSpreadsheet } from 'lucide-react';

// Schéma de validation pour le formulaire Autre activité
const formSchema = z.object({
  date: z.string().min(1, { message: "La date est requise" }),
  timeSlot: z.string().min(1, { message: "Le créneau horaire est requis" }),
  description: z.string().min(1, { message: "Une description est requise pour ce type d'activité" }),
  attachDocument: z.boolean().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AutreFormProps {
  initialData?: any;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  selectedDate?: Date;
  selectedTimeSlot?: string;
}

export function AutreForm({
  initialData,
  onSubmit,
  onCancel,
  selectedDate,
  selectedTimeSlot
}: AutreFormProps) {
  const [showDocumentOptions, setShowDocumentOptions] = useState(false);
  
  // Initialiser le formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData?.date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''),
      timeSlot: initialData?.timeSlot || selectedTimeSlot || '',
      description: initialData?.description || '',
      attachDocument: initialData?.attachDocument || false,
    },
  });
  
  // Gérer la soumission du formulaire
  const handleFormSubmit = (values: FormValues) => {
    onSubmit(values);
  };
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Autre activité</h2>
      <p className="text-sm text-muted-foreground">Veuillez décrire l'activité réalisée</p>
      
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
          
          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Description de l'activité (obligatoire)"
                    className="resize-none h-32"
                    {...field}
                  />
                </FormControl>
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
