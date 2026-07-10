import { createContext, useContext } from 'react';

// Contexte créé ici, rempli par <AuthProvider> (voir AuthContext.jsx).
// Fichier séparé pour que AuthContext.jsx n'exporte qu'un composant
// (exigence du rechargement à chaud de Vite).
export const AuthContext = createContext(null);

/**
 * Accès à l'authentification backoffice depuis n'importe quel composant :
 *   const { isUnlocked, unlock, lock } = useAuth();
 */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>.');
  return ctx;
}
