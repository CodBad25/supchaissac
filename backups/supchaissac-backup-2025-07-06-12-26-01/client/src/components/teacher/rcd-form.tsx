import { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Sun, Moon } from 'lucide-react';

// Schéma de validation pour le formulaire RCD
const formSchema = z.object({
  date: z.string().min(1, { message: "La date est requise" }),
  timeSlot: z.string().min(1, { message: "Le créneau horaire est requis" }),
  className: z.string().min(1, { message: "La classe est requise" }),
  replacedTeacherPrefix: z.string().min(1, { message: "La civilité est requise" }),
  replacedTeacherLastName: z.string().min(1, { message: "Le nom est requis" }),
  replacedTeacherFirstName: z.string().min(1, { message: "Le prénom est requis" }),
  comment: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface RCDFormProps {
  initialData?: any;
  onSubmit: (data: FormValues) => void;
  onCancel: () => void;
  selectedDate?: Date;
  selectedTimeSlot?: string;
}

export function RCDForm({
  initialData,
  onSubmit,
  onCancel,
  selectedDate,
  selectedTimeSlot
}: RCDFormProps) {
  const [selectedClass, setSelectedClass] = useState<string | null>(initialData?.className || null);
  const [showClassSelector, setShowClassSelector] = useState(false);
  
  // Initialiser le formulaire
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      date: initialData?.date || (selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''),
      timeSlot: initialData?.timeSlot || selectedTimeSlot || '',
      className: initialData?.className || '',
      replacedTeacherPrefix: initialData?.replacedTeacherPrefix || '',
      replacedTeacherLastName: initialData?.replacedTeacherLastName || '',
      replacedTeacherFirstName: initialData?.replacedTeacherFirstName || '',
      comment: initialData?.comment || '',
    },
  });
  
  // Gérer la sélection de classe
  const handleClassSelect = (className: string) => {
    form.setValue('className', className);
    setSelectedClass(className);
    setShowClassSelector(false);
  };
  
  // Gérer la soumission du formulaire
  const handleFormSubmit = (values: FormValues) => {
    // Convertir le nom en majuscules
    values.replacedTeacherLastName = values.replacedTeacherLastName.toUpperCase();
    // Capitaliser le prénom
    values.replacedTeacherFirstName = values.replacedTeacherFirstName.charAt(0).toUpperCase() + 
                                      values.replacedTeacherFirstName.slice(1).toLowerCase();
    
    onSubmit(values);
  };
  
  // Déterminer si le créneau est du matin ou de l'après-midi
  const isMorningSlot = (slot: string) => ['M1', 'M2', 'M3', 'M4'].includes(slot);
  const isAfternoonSlot = (slot: string) => ['S1', 'S2', 'S3', 'S4'].includes(slot);
  
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Remplacement de Courte Durée</h2>
      <p className="text-sm text-muted-foreground">Veuillez remplir les informations du remplacement</p>
      
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
          
          {/* Sélection de classe */}
          <div className="space-y-2">
            <FormField
              control={form.control}
              name="className"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Classe</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Input
                        {...field}
                        placeholder="Sélectionner une classe"
                        readOnly
                        onClick={() => setShowClassSelector(true)}
                        className="cursor-pointer"
                      />
                      {showClassSelector && (
                        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
                          <div className="p-4">
                            <h4 className="text-center font-medium mb-4">Sélectionnez la classe pour ce créneau</h4>
                            
                            {/* 6ème */}
                            <div className="mb-4">
                              <h5 className="text-sm font-medium mb-2">6ème</h5>
                              <div className="grid grid-cols-4 gap-2">
                                {['6A', '6B', '6C', '6D'].map((cls) => (
                                  <Button
                                    key={cls}
                                    type="button"
                                    variant="outline"
                                    className={`bg-blue-500 text-white hover:bg-blue-600 dark:bg-blue-700 dark:hover:bg-blue-800`}
                                    onClick={() => handleClassSelect(cls)}
                                  >
                                    {cls}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            
                            {/* 5ème */}
                            <div className="mb-4">
                              <h5 className="text-sm font-medium mb-2">5ème</h5>
                              <div className="grid grid-cols-4 gap-2">
                                {['5A', '5B', '5C', '5D'].map((cls) => (
                                  <Button
                                    key={cls}
                                    type="button"
                                    variant="outline"
                                    className={`bg-green-500 text-white hover:bg-green-600 dark:bg-green-700 dark:hover:bg-green-800`}
                                    onClick={() => handleClassSelect(cls)}
                                  >
                                    {cls}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            
                            {/* 4ème */}
                            <div className="mb-4">
                              <h5 className="text-sm font-medium mb-2">4ème</h5>
                              <div className="grid grid-cols-4 gap-2">
                                {['4A', '4B', '4C', '4D'].map((cls) => (
                                  <Button
                                    key={cls}
                                    type="button"
                                    variant="outline"
                                    className={`bg-orange-500 text-white hover:bg-orange-600 dark:bg-orange-700 dark:hover:bg-orange-800`}
                                    onClick={() => handleClassSelect(cls)}
                                  >
                                    {cls}
                                  </Button>
                                ))}
                              </div>
                            </div>
                            
                            {/* 3ème */}
                            <div>
                              <h5 className="text-sm font-medium mb-2">3ème</h5>
                              <div className="grid grid-cols-4 gap-2">
                                {['3A', '3B', '3C', '3D'].map((cls) => (
                                  <Button
                                    key={cls}
                                    type="button"
                                    variant="outline"
                                    className={`bg-red-500 text-white hover:bg-red-600 dark:bg-red-700 dark:hover:bg-red-800`}
                                    onClick={() => handleClassSelect(cls)}
                                  >
                                    {cls}
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          {/* Enseignant remplacé */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">
              {form.watch('replacedTeacherPrefix') === 'Mme' ? 'Enseignante remplacée' : 'Enseignant remplacé'}
            </h3>
            
            <div className="flex gap-2 items-start">
              <FormField
                control={form.control}
                name="replacedTeacherPrefix"
                render={({ field }) => (
                  <FormItem className="space-y-1 flex-shrink-0">
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        variant={field.value === 'M.' ? "default" : "outline"}
                        className={`px-3 py-2 h-auto ${field.value === 'M.' ? 'bg-blue-500 text-white' : ''}`}
                        onClick={() => form.setValue('replacedTeacherPrefix', 'M.')}
                      >
                        M.
                      </Button>
                      <Button
                        type="button"
                        variant={field.value === 'Mme' ? "default" : "outline"}
                        className={`px-3 py-2 h-auto ${field.value === 'Mme' ? 'bg-pink-500 text-white' : ''}`}
                        onClick={() => form.setValue('replacedTeacherPrefix', 'Mme')}
                      >
                        Mme
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-2 flex-grow">
                <FormField
                  control={form.control}
                  name="replacedTeacherLastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="NOM" className="uppercase" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="replacedTeacherFirstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} placeholder="Prénom" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
          
          {/* Commentaire */}
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commentaire (optionnel)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Informations complémentaires sur ce remplacement..."
                    className="resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
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
