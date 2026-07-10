import { useEffect, useState } from 'react';

/**
 * Gère le chargement des données d'une page.
 *
 * Usage type :
 *   const { loading, error, reload } = useAsyncLoad(async () => {
 *     setEmployees(await listRealEmployees());
 *   }, 'Message affiché si le chargement échoue.');
 *
 * - `loading` : vrai pendant le premier chargement (affichez <LoadingScreen />)
 * - `error`   : message d'erreur ou null (affichez <PageError />)
 * - `reload()` : à appeler après une création/modification/suppression
 *                pour recharger les données de la page.
 */
export function useAsyncLoad(loadFn, errorText) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Compteur de rechargements : reload() l'incrémente, ce qui relance
  // l'effet ci-dessous (car `tick` est dans ses dépendances).
  const [tick, setTick] = useState(0);

  useEffect(() => {
    // `active` évite d'écrire dans l'état si on a quitté la page
    // avant la fin du chargement.
    let active = true;

    loadFn()
      .then(() => {
        if (active) setError(null);
      })
      .catch((err) => {
        console.error(err);
        if (active) setError(errorText || 'Erreur de chargement.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tick]);

  const reload = () => setTick((t) => t + 1);

  return { loading, error, reload };
}
