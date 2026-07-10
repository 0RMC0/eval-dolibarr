import { useState } from 'react';
import { AuthContext } from './useAuth';
import {
  getBackofficeCode,
  setBackofficeCode,
  clearBackofficeCode,
} from '../auth/backofficeCode';
import { verifyCode } from '../services/authService';

/**
 * Fournit l'authentification backoffice (code unique global) à toute l'app. [J1 - 1.a]
 * S'appuie sur backofficeCode.js (sessionStorage), également lu par l'intercepteur axios.
 */
export function AuthProvider({ children }) {
  const [code, setCode] = useState(getBackofficeCode());

  // Vérifie le code auprès du backend avant de déverrouiller. Renvoie true/false.
  const unlock = async (value) => {
    const trimmed = value.trim();
    const ok = await verifyCode(trimmed);
    if (ok) {
      setBackofficeCode(trimmed);
      setCode(trimmed);
    }
    return ok;
  };

  // Verrouille le backoffice (le code sera redemandé).
  const lock = () => {
    clearBackofficeCode();
    setCode('');
  };

  return (
    <AuthContext.Provider value={{ code, isUnlocked: Boolean(code), unlock, lock }}>
      {children}
    </AuthContext.Provider>
  );
}
