import { useEffect, useState } from 'react';
import { Avatar, Loader } from '@mantine/core';
import { dolibarr } from '../api/dolibarr';

/** Télécharge la photo via l'API Dolibarr et la convertit en image affichable. */
async function fetchPhotoDataUrl(userId, photo) {
  const response = await dolibarr.get('/documents/download', {
    params: {
      modulepart: 'user',
      original_file: `${userId}/photos/${photo}`,
    },
  });
  if (!response.data?.content) return null;
  const contentType = response.data['content-type'] || 'image/png';
  return `data:${contentType};base64,${response.data.content}`;
}

/**
 * Avatar d'un employé : sa photo Dolibarr si elle existe, sinon ses initiales.
 *
 * On mémorise la DERNIÈRE photo chargée avec sa clé (`loaded`). Si la clé
 * mémorisée ne correspond plus à la photo demandée (changement d'employé),
 * c'est qu'un chargement est en cours -> on affiche un spinner.
 */
export default function EmployeeAvatar({ userId, photo, name, size = 60, radius = 'xl' }) {
  // { key: 'userId/photo', src: 'data:image/...' } de la dernière photo chargée.
  const [loaded, setLoaded] = useState(null);

  // Identifiant unique de la photo demandée (null si l'employé n'en a pas).
  const photoKey = photo ? `${userId}/${photo}` : null;

  useEffect(() => {
    if (!photoKey) return;

    // `active` évite d'écrire dans l'état si le composant a été démonté
    // (ou si l'employé affiché a changé) avant la fin du téléchargement.
    let active = true;

    fetchPhotoDataUrl(userId, photo)
      .then((src) => {
        if (active) setLoaded({ key: photoKey, src });
      })
      .catch((err) => {
        console.error(`Échec du chargement de la photo (user ${userId}):`, err);
        if (active) setLoaded({ key: photoKey, src: null });
      });

    return () => {
      active = false;
    };
  }, [photoKey, userId, photo]);

  // Valeurs dérivées : la photo affichable et l'état de chargement se déduisent
  // de `loaded`, pas besoin d'états supplémentaires à synchroniser.
  const isCurrent = loaded !== null && loaded.key === photoKey;
  const src = isCurrent ? loaded.src : null;
  const loading = photoKey !== null && !isCurrent;

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '?';

  if (loading) {
    return (
      <Avatar size={size} radius={radius}>
        <Loader size="xs" color="blue" />
      </Avatar>
    );
  }

  return (
    <Avatar src={src} size={size} radius={radius} alt={name}>
      {initials}
    </Avatar>
  );
}
