import { useState } from "react";
import { useLocation } from "wouter";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  username: z.string().email({ message: "Adresse email invalide" }),
  password: z.string().min(6, {
    message: "Le mot de passe doit contenir au moins 6 caractères",
  }),
});

const registerSchema = z.object({
  username: z.string().email({ message: "Adresse email invalide" }),
  password: z.string().min(6, {
    message: "Le mot de passe doit contenir au moins 6 caractères",
  }),
  name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères",
  }),
  role: z.enum(["TEACHER", "SECRETARY", "PRINCIPAL"], {
    required_error: "Veuillez sélectionner un rôle",
  }),
});

type LoginFormValues = z.infer<typeof loginSchema>;
type RegisterFormValues = z.infer<typeof registerSchema>;

export default function AuthPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  const registerForm = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: "",
      password: "",
      name: "",
      role: "TEACHER",
    },
  });

  // Create direct mutations instead of using useAuth
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginFormValues) => {
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Connexion réussie",
        description: `Bienvenue, ${user.name}`,
      });
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Échec de connexion",
        description: "Nom d'utilisateur ou mot de passe incorrect",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (userData: RegisterFormValues) => {
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (user) => {
      queryClient.setQueryData(["/api/user"], user);
      toast({
        title: "Inscription réussie",
        description: `Bienvenue, ${user.name}`,
      });
      navigate("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Échec d'inscription",
        description: error.message || "Une erreur est survenue lors de l'inscription",
        variant: "destructive",
      });
    },
  });

  const onLoginSubmit = (data: LoginFormValues) => {
    loginMutation.mutate(data);
  };

  const onRegisterSubmit = (data: RegisterFormValues) => {
    registerMutation.mutate(data);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left column - Auth forms */}
      <div className="w-full md:w-1/2 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
              TeacherHours
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Gestion des heures supplémentaires
            </p>
          </div>

          <Tabs defaultValue="login" onValueChange={(value) => setIsRegistering(value === "register")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Connexion</TabsTrigger>
              <TabsTrigger value="register">Inscription</TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <Card>
                <CardContent className="pt-6">
                  <Form {...loginForm}>
                    <form
                      onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={loginForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="email@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={loginForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mot de passe</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={loginMutation.isPending}
                      >
                        {loginMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Connexion en cours...
                          </>
                        ) : (
                          "Se connecter"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              <Card>
                <CardContent className="pt-6">
                  <Form {...registerForm}>
                    <form
                      onSubmit={registerForm.handleSubmit(onRegisterSubmit)}
                      className="space-y-4"
                    >
                      <FormField
                        control={registerForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nom complet</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Martin Dubois"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Adresse email</FormLabel>
                            <FormControl>
                              <Input
                                type="email"
                                placeholder="email@example.com"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Mot de passe</FormLabel>
                            <FormControl>
                              <Input
                                type="password"
                                placeholder="••••••••"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={registerForm.control}
                        name="role"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Rôle</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionnez un rôle" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="TEACHER">Enseignant</SelectItem>
                                <SelectItem value="SECRETARY">Secrétariat</SelectItem>
                                <SelectItem value="PRINCIPAL">Direction</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        className="w-full"
                        disabled={registerMutation.isPending}
                      >
                        {registerMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Inscription en cours...
                          </>
                        ) : (
                          "S'inscrire"
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Right column - Hero section */}
      <div className="hidden md:block md:w-1/2 bg-gradient-to-b from-blue-50 to-white">
        <div className="h-full flex flex-col justify-center items-center px-8">
          <div className="max-w-md text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-6">
              Gérez vos heures supplémentaires simplement
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              Une plateforme intuitive pour déclarer, suivre et valider les heures supplémentaires des enseignants.
            </p>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-primary-100 text-primary-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="ml-4 text-left">
                  <h3 className="text-lg font-medium text-gray-900">Calendrier intuitif</h3>
                  <p className="text-base text-gray-500">Sélectionnez simplement une date et un créneau</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-primary-100 text-primary-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <div className="ml-4 text-left">
                  <h3 className="text-lg font-medium text-gray-900">Suivi en temps réel</h3>
                  <p className="text-base text-gray-500">Statut mis à jour à chaque étape du workflow</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-md bg-primary-100 text-primary-600">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4 text-left">
                  <h3 className="text-lg font-medium text-gray-900">Export PDF</h3>
                  <p className="text-base text-gray-500">Générez des documents officiels en un clic</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
