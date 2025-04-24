import Image from 'next/image';
import { useState } from 'react';

// Simple Avatar component that shows user's avatar or their initials
const Avatar = ({ user, size = 40 }) => {
  const [error, setError] = useState(false);
  
  // If we have an avatar URL and no error, show the image
  if (user?.avatar && !error) {
    return (
      <div 
        className="relative rounded-full overflow-hidden" 
        style={{ width: size, height: size }}
      >
        <Image
          src={user.avatar}
          alt={user.name || 'User'}
          width={size}
          height={size}
          className="object-cover"
          onError={() => setError(true)}
        />
      </div>
    );
  }
  
  // Otherwise, show initials in a colored circle
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';
  
  // Generate a consistent color based on the user's name or id
  const colorIndex = user?.id?.charCodeAt(0) % 5 || 0;
  const bgColors = ['bg-emerald-500', 'bg-blue-500', 'bg-purple-500', 'bg-amber-500', 'bg-pink-500'];
  
  return (
    <div 
      className={`flex items-center justify-center rounded-full text-white ${bgColors[colorIndex]}`}
      style={{ width: size, height: size, fontSize: size / 2.5 }}
    >
      {initials}
    </div>
  );
};

export default Avatar;