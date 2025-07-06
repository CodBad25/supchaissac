
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { Info } from "lucide-react";

const DEMO_ACCOUNTS = [
  { role: "Admin", username: "admin@ac-nantes.fr", password: "aaa" },
  { role: "Enseignant", username: "m.belhaj", password: "bbb" },
  { role: "Enseignant", username: "s.rio", password: "rrr" }
];

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showDemoAccounts, setShowDemoAccounts] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (login(username, password)) {
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans l'application."
      });
      navigate("/");
    } else {
      toast({
        title: "Erreur de connexion",
        description: "Identifiants incorrects",
        variant: "destructive"
      });
    }
  };

  const handleDemoLogin = (demoAccount) => {
    setUsername(demoAccount.username);
    setPassword(demoAccount.password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Utilisez vos identifiants académiques
          </p>
        </div>

        <div className="relative">
          <Button
            type="button"
            variant="outline"
            className="absolute right-0 -top-12 flex items-center gap-2"
            onClick={() => setShowDemoAccounts(!showDemoAccounts)}
          >
            <Info className="h-4 w-4" />
            {showDemoAccounts ? "Masquer les comptes démo" : "Voir les comptes démo"}
          </Button>

          {showDemoAccounts && (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Comptes de démonstration</h3>
              <div className="space-y-3">
                {DEMO_ACCOUNTS.map((account, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between bg-white p-3 rounded border border-blue-100"
                  >
                    <div>
                      <div className="text-sm font-medium text-gray-900">{account.role}</div>
                      <div className="text-sm text-gray-500">
                        Identifiant : {account.username}
                        <br />
                        Mot de passe : {account.password}
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDemoLogin(account)}
                      className="ml-4"
                    >
                      Utiliser
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="username" className="sr-only">
                Identifiant
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Identifiant"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <Button type="submit" className="w-full">
              Se connecter
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
