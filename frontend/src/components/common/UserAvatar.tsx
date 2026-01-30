/**
 * UserAvatar Component
 * Displays user profile picture with Kitchen48 logo fallback
 */

import { useState } from 'react';

interface UserAvatarProps {
  /** URL to the user's profile picture */
  profilePicture?: string | null;
  /** User's name for alt text */
  name?: string;
  /** Size of the avatar */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Additional CSS classes */
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-16 h-16',
  xl: 'w-24 h-24',
};

// Kitchen48 logo SVG as a fallback
const K48Logo = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 100 100"
    className={className}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Background circle */}
    <circle cx="50" cy="50" r="48" fill="#2C3E50" />
    {/* K48 text */}
    <text
      x="50"
      y="58"
      textAnchor="middle"
      fill="#FF5722"
      fontSize="28"
      fontWeight="bold"
      fontFamily="Inter, sans-serif"
    >
      K48
    </text>
  </svg>
);

export function UserAvatar({
  profilePicture,
  name = 'User',
  size = 'md',
  className = '',
}: UserAvatarProps) {
  const [imageError, setImageError] = useState(false);

  const sizeClass = sizeClasses[size];
  const showFallback = !profilePicture || imageError;

  return (
    <div
      className={`${sizeClass} rounded-full overflow-hidden flex-shrink-0 ${className}`}
    >
      {showFallback ? (
        <K48Logo className="w-full h-full" />
      ) : (
        <img
          src={profilePicture}
          alt={`${name}'s profile picture`}
          className="w-full h-full object-cover"
          onError={() => setImageError(true)}
        />
      )}
    </div>
  );
}

export default UserAvatar;
