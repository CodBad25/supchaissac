import React from 'react';
import { useQuery } from '@tanstack/react-query';

type User = {
  id: number;
  name: string;
  username: string;
  role: string;
};

async function fetchUsers(): Promise<User[]> {
  const res = await fetch('http://localhost:4000/api/users');
  if (!res.ok) throw new Error('Erreur lors du chargement des utilisateurs');
  return res.json();
}

export default function DashboardPage() {
  const { data: users = [], isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Tableau de bord</h1>
      <div style={{color: 'red', fontWeight: 'bold', fontSize: '1.2em'}}>CODE TEMOIN : 42-OK 🚦</div>
      <p>Bienvenue sur la refonte de SupChaissac !</p>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Utilisateurs</h2>
        {isLoading && <div>Chargement...</div>}
        {error && <div className="text-red-600">Erreur : {(error as Error).message}</div>}
        {users.length > 0 ? (
          <table className="min-w-full border mt-2">
            <thead>
              <tr>
                <th className="border px-2 py-1">Nom</th>
                <th className="border px-2 py-1">Email</th>
                <th className="border px-2 py-1">Rôle</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td className="border px-2 py-1">{user.name}</td>
                  <td className="border px-2 py-1">{user.username}</td>
                  <td className="border px-2 py-1">{user.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div>Aucun utilisateur trouvé.</div>
        )}
      </div>
    </div>
  );
}
