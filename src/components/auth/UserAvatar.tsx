import { useEffect, useState } from 'react';
import { initials } from '../../utils/format';

interface UserAvatarProps {
  name: string;
  photoURL?: string | null;
  className: string;
  imageAlt?: string;
}

export function UserAvatar({ name, photoURL, className, imageAlt = '' }: UserAvatarProps) {
  const [imageUnavailable, setImageUnavailable] = useState(false);

  useEffect(() => {
    setImageUnavailable(false);
  }, [photoURL]);

  if (photoURL && !imageUnavailable) {
    return (
      <img
        src={photoURL}
        alt={imageAlt}
        referrerPolicy="no-referrer"
        onError={() => setImageUnavailable(true)}
        className={`${className} object-cover`}
      />
    );
  }

  return (
    <span className={`${className} flex items-center justify-center bg-accent-soft font-bold text-accent`}>
      {initials(name)}
    </span>
  );
}
