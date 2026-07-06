import { useEffect, useState } from 'react';
import { Avatar, Loader } from '@mantine/core';
import { dolibarr } from '../api/dolibarr';

export default function EmployeeAvatar({ userId, photo, name, size = 60, radius = 'xl' }) {
  const [src, setSrc] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!photo) {
      setSrc(null);
      return;
    }

    let active = true;
    async function fetchPhoto() {
      setLoading(true);
      try {
        const response = await dolibarr.get('/documents/download', {
          params: {
            modulepart: 'user',
            original_file: `${userId}/photos/${photo}`,
          },
        });
        if (active && response.data?.content) {
          const contentType = response.data['content-type'] || 'image/png';
          setSrc(`data:${contentType};base64,${response.data.content}`);
        }
      } catch (err) {
        console.error(`Failed to load photo for user ${userId}:`, err);
        if (active) setSrc(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchPhoto();

    return () => {
      active = false;
    };
  }, [userId, photo]);

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
