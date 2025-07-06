import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Type pour le mapping des colonnes CSV
type CSVMapping = {
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  role: string | null;
  pacteEnseignant: string | null;
};

// Type pour les utilisateurs importés
type ImportedUser = {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN';
  pacteEnseignant: boolean;
};

export function CSVImport() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // État pour le fichier CSV et les données extraites
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<string[][]>([]);
  const [step, setStep] = useState<'upload' | 'mapping' | 'preview' | 'complete'>('upload');
  const [isLoading, setIsLoading] = useState(false);
  
  // Mapping des colonnes CSV
  const initialMapping: CSVMapping = {
    username: null,
    firstName: null,
    lastName: null,
    email: null,
    role: null,
    pacteEnseignant: null
  };
  const [mapping, setMapping] = useState<CSVMapping>(initialMapping);
  
  // Utilisateurs importés
  const [importedUsers, setImportedUsers] = useState<ImportedUser[]>([]);
  
  // Méthode de génération d'identifiants à partir des noms/prénoms
  const [usernameGenMethod, setUsernameGenMethod] = useState<'firstlast' | 'fnameinitlast' | 'custom'>('firstlast');
  
  // Fonction pour lire le fichier CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setCsvFile(file);
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        parseCSV(content);
      };
      
      reader.readAsText(file);
    }
  };
  
  // Analyser le contenu CSV
  const parseCSV = (content: string) => {
    const lines = content.split('\n');
    
    // Extraire les en-têtes (première ligne)
    if (lines.length > 0) {
      const headers = lines[0].split(',').map(h => h.trim());
      setCsvHeaders(headers);
      
      // Extraire les données (lignes suivantes)
      const data = lines.slice(1)
        .filter(line => line.trim().length > 0)
        .map(line => line.split(',').map(cell => cell.trim()));
      
      setCsvData(data);
      setStep('mapping');
    } else {
      toast({
        title: "Erreur de fichier",
        description: "Le fichier CSV est vide ou mal formaté.",
        variant: "destructive"
      });
    }
  };
  
  // Mettre à jour le mapping des colonnes
  const updateMapping = (field: keyof CSVMapping, value: string | null) => {
    setMapping(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Générer un nom d'utilisateur à partir du prénom et du nom
  const generateUsername = (firstName: string, lastName: string): string => {
    firstName = firstName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    lastName = lastName.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    
    switch (usernameGenMethod) {
      case 'firstlast':
        return `${firstName}.${lastName}`;
      case 'fnameinitlast':
        return `${firstName.charAt(0)}.${lastName}`;
      default:
        return `${firstName}.${lastName}`;
    }
  };
  
  // Mapper le rôle depuis la valeur CSV
  const mapRole = (roleValue: string): 'TEACHER' | 'SECRETARY' | 'PRINCIPAL' | 'ADMIN' => {
    const lowercased = roleValue.toLowerCase();
    
    if (lowercased.includes('admin')) return 'ADMIN';
    if (lowercased.includes('direct') || lowercased.includes('principal')) return 'PRINCIPAL';
    if (lowercased.includes('secret') || lowercased.includes('admin')) return 'SECRETARY';
    
    return 'TEACHER'; // Valeur par défaut
  };
  
  // Générer l'aperçu des utilisateurs
  const generatePreview = () => {
    // Vérifier que les champs obligatoires sont mappés
    if (mapping.firstName === null || mapping.lastName === null) {
      toast({
        title: "Mapping incomplet",
        description: "Le prénom et le nom sont obligatoires pour l'importation.",
        variant: "destructive"
      });
      return;
    }
    
    // Convertir les données CSV en utilisateurs
    const users: ImportedUser[] = csvData.map(row => {
      const firstName = mapping.firstName !== null ? row[parseInt(mapping.firstName)] : '';
      const lastName = mapping.lastName !== null ? row[parseInt(mapping.lastName)] : '';
      const email = mapping.email !== null ? row[parseInt(mapping.email)] : `${firstName.toLowerCase()}.${lastName.toLowerCase()}@example.fr`;
      const username = mapping.username !== null ? 
        row[parseInt(mapping.username)] : 
        generateUsername(firstName, lastName);
      
      const role = mapping.role !== null ? 
        mapRole(row[parseInt(mapping.role)]) : 
        'TEACHER';
      
      const pacteValue = mapping.pacteEnseignant !== null ? 
        row[parseInt(mapping.pacteEnseignant)] : 
        'non';
      const pacteEnseignant = 
        pacteValue.toLowerCase() === 'oui' || 
        pacteValue.toLowerCase() === 'yes' || 
        pacteValue === '1' || 
        pacteValue.toLowerCase() === 'true';
      
      return {
        username,
        firstName,
        lastName: lastName.toUpperCase(),
        email,
        role,
        pacteEnseignant
      };
    });
    
    setImportedUsers(users);
    setStep('preview');
  };
  
  // Finaliser l'importation
  const completeImport = () => {
    setIsLoading(true);
    
    // Simuler un appel API pour l'importation
    setTimeout(() => {
      setIsLoading(false);
      setStep('complete');
      toast({
        title: "Importation réussie",
        description: `${importedUsers.length} utilisateurs ont été importés avec succès.`
      });
    }, 1500);
  };
  
  // Réinitialiser l'importation
  const resetImport = () => {
    setCsvFile(null);
    setCsvHeaders([]);
    setCsvData([]);
    setMapping(initialMapping);
    setImportedUsers([]);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Formatter l'affichage du rôle
  const formatRole = (role: string) => {
    const roleNames: Record<string, string> = {
      'TEACHER': 'Enseignant',
      'SECRETARY': 'Secrétariat',
      'PRINCIPAL': 'Direction',
      'ADMIN': 'Admin'
    };
    
    return roleNames[role] || role;
  };
  
  // Obtenir la classe CSS pour le badge de rôle
  const getRoleBadgeClass = (role: string) => {
    switch (role) {
      case 'TEACHER':
        return "bg-green-100 text-green-800 border-green-200";
      case 'SECRETARY':
        return "bg-blue-100 text-blue-800 border-blue-200";
      case 'PRINCIPAL':
        return "bg-purple-100 text-purple-800 border-purple-200";
      case 'ADMIN':
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Import CSV depuis PRONOTE</h2>
        {step !== 'upload' && (
          <Button variant="outline" onClick={resetImport}>
            Nouvel import
          </Button>
        )}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{
            step === 'upload' ? "Télécharger un fichier CSV" :
            step === 'mapping' ? "Mapper les colonnes" :
            step === 'preview' ? "Aperçu des utilisateurs" :
            "Import complété"
          }</CardTitle>
          <CardDescription>
            {step === 'upload' && "Sélectionnez un fichier CSV exporté depuis PRONOTE pour importer les utilisateurs"}
            {step === 'mapping' && "Associez les colonnes du fichier CSV aux champs de l'application"}
            {step === 'preview' && "Vérifiez les données avant l'importation définitive"}
            {step === 'complete' && "Les utilisateurs ont été importés avec succès"}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* Étape de téléchargement */}
          {step === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <input 
                  type="file" 
                  accept=".csv" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleFileUpload} 
                />
                <div className="flex flex-col items-center justify-center space-y-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="text-sm text-gray-500">
                    Cliquez pour sélectionner un fichier CSV ou glissez-le ici
                  </p>
                  <Button onClick={() => fileInputRef.current?.click()}>
                    Choisir un fichier
                  </Button>
                </div>
              </div>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-700">
                <h3 className="font-medium mb-1">Conseils d'importation :</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Assurez-vous que le fichier CSV contient au moins les colonnes nom et prénom</li>
                  <li>Les en-têtes de colonne doivent être sur la première ligne</li>
                  <li>Exporter la liste des personnels depuis PRONOTE au format CSV</li>
                </ul>
              </div>
            </div>
          )}
          
          {/* Étape de mapping */}
          {step === 'mapping' && (
            <div className="space-y-6">
              <div className="space-y-4 border-b pb-4">
                <div className="flex flex-col space-y-1.5">
                  <Label>Nom d'utilisateur</Label>
                  <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
                    <Select
                      value={usernameGenMethod}
                      onValueChange={(v: 'firstlast' | 'fnameinitlast' | 'custom') => setUsernameGenMethod(v)}
                    >
                      <SelectTrigger className="w-full sm:w-[200px]">
                        <SelectValue placeholder="Méthode de génération" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="firstlast">prenom.nom</SelectItem>
                        <SelectItem value="fnameinitlast">p.nom</SelectItem>
                        <SelectItem value="custom">Colonne CSV</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    {usernameGenMethod === 'custom' && (
                      <Select
                        value={mapping.username ?? undefined}
                        onValueChange={(value) => updateMapping('username', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner une colonne" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">-- Non spécifié --</SelectItem>
                          {csvHeaders.map((header, index) => (
                            <SelectItem key={index} value={index.toString()}>
                              {header}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {usernameGenMethod !== 'custom' ? 
                      "Les identifiants seront générés automatiquement" : 
                      "Sélectionnez la colonne contenant les identifiants"
                    }
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label>Prénom <span className="text-red-500">*</span></Label>
                    <Select
                      value={mapping.firstName ?? undefined}
                      onValueChange={(value) => updateMapping('firstName', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une colonne" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- Non spécifié --</SelectItem>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label>NOM <span className="text-red-500">*</span></Label>
                    <Select
                      value={mapping.lastName ?? undefined}
                      onValueChange={(value) => updateMapping('lastName', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une colonne" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- Non spécifié --</SelectItem>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex flex-col space-y-1.5">
                  <Label>Email</Label>
                  <Select
                    value={mapping.email ?? undefined}
                    onValueChange={(value) => updateMapping('email', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner une colonne" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">-- Non spécifié --</SelectItem>
                      {csvHeaders.map((header, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    Si non spécifié, une adresse email sera générée au format prenom.nom@example.fr
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1.5">
                    <Label>Rôle</Label>
                    <Select
                      value={mapping.role ?? undefined}
                      onValueChange={(value) => updateMapping('role', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une colonne" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- Non spécifié --</SelectItem>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Si non spécifié, le rôle "Enseignant" sera attribué
                    </p>
                  </div>
                  
                  <div className="flex flex-col space-y-1.5">
                    <Label>Pacte Enseignant</Label>
                    <Select
                      value={mapping.pacteEnseignant ?? undefined}
                      onValueChange={(value) => updateMapping('pacteEnseignant', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Sélectionner une colonne" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">-- Non spécifié --</SelectItem>
                        {csvHeaders.map((header, index) => (
                          <SelectItem key={index} value={index.toString()}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500 mt-1">
                      Valeurs acceptées: "Oui", "Yes", "1" ou "True"
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Aperçu des données</h3>
                <div className="border rounded-lg overflow-x-auto max-h-60">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {csvHeaders.map((header, index) => (
                          <TableHead key={index}>{header}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {csvData.slice(0, 5).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <TableCell key={cellIndex}>{cell || "-"}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {csvData.length > 5 && (
                  <p className="text-xs text-gray-500 text-right">
                    {csvData.length - 5} lignes supplémentaires non affichées
                  </p>
                )}
              </div>
            </div>
          )}
          
          {/* Étape de prévisualisation */}
          {step === 'preview' && (
            <div className="space-y-4">
              <div className="border rounded-lg overflow-x-auto max-h-80">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Identifiant</TableHead>
                      <TableHead>Prénom</TableHead>
                      <TableHead>NOM</TableHead>
                      <TableHead className="hidden md:table-cell">Email</TableHead>
                      <TableHead>Rôle</TableHead>
                      <TableHead>Pacte</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedUsers.map((user, index) => (
                      <TableRow key={index}>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>{user.firstName}</TableCell>
                        <TableCell>{user.lastName}</TableCell>
                        <TableCell className="hidden md:table-cell">{user.email}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getRoleBadgeClass(user.role)}>
                            {formatRole(user.role)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {user.role === 'TEACHER' && (
                            <Badge variant="outline" className={
                              user.pacteEnseignant ? 
                                "bg-teal-50 text-teal-700 border-teal-200" : 
                                "bg-gray-50 text-gray-600 border-gray-200"
                            }>
                              {user.pacteEnseignant ? "Oui" : "Non"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-700">
                <h3 className="font-medium mb-1">Confirmation d'importation :</h3>
                <p>
                  Vous êtes sur le point d'importer {importedUsers.length} utilisateurs. 
                  Veuillez vérifier que les données sont correctes avant de confirmer.
                </p>
              </div>
            </div>
          )}
          
          {/* Étape de complétion */}
          {step === 'complete' && (
            <div className="flex flex-col items-center py-8 space-y-4">
              <div className="bg-green-100 p-4 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold">Importation réussie !</h3>
              <p className="text-gray-600 text-center max-w-md">
                {importedUsers.length} utilisateurs ont été importés avec succès dans le système.
                Vous pouvez maintenant gérer ces utilisateurs depuis l'interface d'administration.
              </p>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="border-t pt-4 flex justify-between">
          {step === 'mapping' && (
            <>
              <Button variant="outline" onClick={resetImport}>Annuler</Button>
              <Button onClick={generatePreview}>Aperçu</Button>
            </>
          )}
          
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('mapping')}>Retour</Button>
              <Button 
                onClick={completeImport} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Importation...
                  </>
                ) : "Importer"}
              </Button>
            </>
          )}
          
          {step === 'complete' && (
            <Button onClick={resetImport}>Nouvel import</Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}