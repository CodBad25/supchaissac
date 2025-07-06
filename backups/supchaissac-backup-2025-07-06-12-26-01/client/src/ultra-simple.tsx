import React, { useState } from 'react';

function UltraSimpleApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState('');

  const handleLogin = (name: string) => {
    console.log("Login clicked for:", name);
    setUserName(name);
    setIsLoggedIn(true);
    console.log("isLoggedIn set to:", true);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName('');
  };

  console.log("Current state - isLoggedIn:", isLoggedIn, "userName:", userName);

  if (!isLoggedIn) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        fontFamily: 'Arial, sans-serif',
        backgroundColor: '#f0f4f8'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h1 style={{ textAlign: 'center', color: '#2563eb', marginBottom: '1.5rem' }}>
            Gestion des Heures Supplémentaires
          </h1>

          <h2 style={{ textAlign: 'center', fontSize: '1.2rem', marginBottom: '1.5rem' }}>
            Choisissez un profil
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <button
              onClick={() => handleLogin('Sophie Martin')}
              style={{
                padding: '0.75rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Sophie Martin (Enseignante)
            </button>

            <button
              onClick={() => handleLogin('Jean Dupont')}
              style={{
                padding: '0.75rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Jean Dupont (Direction)
            </button>

            <button
              onClick={() => handleLogin('Admin')}
              style={{
                padding: '0.75rem',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Admin (Administrateur)
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      backgroundColor: '#f0f4f8',
      minHeight: '100vh'
    }}>
      <header style={{
        backgroundColor: 'white',
        padding: '1rem',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '1.25rem', color: '#1e3a8a' }}>
          Gestion des Heures Supplémentaires
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            padding: '0.25rem 0.75rem',
            borderRadius: '9999px',
            fontSize: '0.875rem'
          }}>
            {userName}
          </span>
          <button
            onClick={handleLogout}
            style={{
              padding: '0.25rem 0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.375rem',
              backgroundColor: 'white',
              fontSize: '0.875rem',
              cursor: 'pointer'
            }}
          >
            Déconnexion
          </button>
        </div>
      </header>

      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '0.5rem',
          padding: '1.5rem',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#111827',
            marginBottom: '1rem'
          }}>
            Bienvenue, {userName}
          </h2>

          <p style={{ color: '#4b5563', marginBottom: '1rem' }}>
            Vous êtes connecté à l'application de gestion des heures supplémentaires.
          </p>

          <div style={{
            backgroundColor: '#dbeafe',
            border: '1px solid #bfdbfe',
            borderRadius: '0.375rem',
            padding: '1rem',
            color: '#1e40af'
          }}>
            <p style={{ fontWeight: 'medium' }}>Interface de démonstration</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>
              Cette interface simplifiée est destinée à la phase de développement et de test.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UltraSimpleApp;
