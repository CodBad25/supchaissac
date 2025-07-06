
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    await login(email, password);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Connexion
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Accédez à votre espace personnel
          </p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Adresse email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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

        <div className="mt-4 text-center text-sm text-gray-600">
          <p className="font-medium mb-2">Comptes de test (mot de passe: aaa)</p>
          <div className="grid grid-cols-1 gap-2">
            <div className="bg-blue-50 p-2 rounded">
              <p className="font-medium text-blue-700">Enseignants :</p>
              <p>prof1@test.com</p>
              <p>prof2@test.com</p>
              <p>prof3@test.com</p>
            </div>
            <div className="bg-green-50 p-2 rounded">
              <p className="font-medium text-green-700">Secrétariat :</p>
              <p>secretaire@test.com</p>
            </div>
            <div className="bg-purple-50 p-2 rounded">
              <p className="font-medium text-purple-700">Direction :</p>
              <p>principal@test.com</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default LoginForm;
