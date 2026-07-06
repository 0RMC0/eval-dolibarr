import { createContext, useContext, useState, useCallback } from 'react';
import {
  getBackofficeCode,
  setBackofficeCode,
  clearBackofficeCode,
} from '../auth/backofficeCode';
import { verifyCode } from '../services/authService';

const AuthContext = createContext(null);

/**
 * Contexte d'authentification du backoffice (code unique global). [J1 - 1 / 1.a]
 * S'appuie sur backofficeCode.js (sessionStorage), également lu par l'intercepteur axios.
 */
export function AuthProvider({ children }) {
  const [code, setCode] = useState(getBackofficeCode());

  // Vérifie le code auprès du backend avant de déverrouiller. Renvoie true/false.
  const unlock = useCallback(async (value) => {
    const trimmed = value.trim();
    const ok = await verifyCode(trimmed);
    if (ok) {
      setBackofficeCode(trimmed);
      setCode(trimmed);
    }
    return ok;
  }, []);

  const lock = useCallback(() => {
    clearBackofficeCode();
    setCode('');
  }, []);

  const value = { code, isUnlocked: Boolean(code), unlock, lock };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans <AuthProvider>.');
  return ctx;
}
