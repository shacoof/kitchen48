/**
 * UserCard
 * Card component for displaying a user in a grid.
 * Media priority: profilePhoto > profilePicture > introVideo thumbnail > placeholder.
 * If introVideo exists, shows play overlay; clicking it plays video inline.
 */

import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { VideoPlayer } from '../../media/components/VideoPlayer';
import type { PublicUserProfile } from '../services/users.api';

interface UserCardProps {
  user: PublicUserProfile;
  className?: string;
}

export function UserCard({ user, className = '' }: UserCardProps) {
  const { t } = useTranslation('profile');
  const [playing, setPlaying] = useState(false);

  const profileUrl = user.nickname ? `/${user.nickname}` : '#';
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(' ') || t('view.default_name', 'User');

  // Media priority: profilePhoto URL > legacy profilePicture > introVideo thumbnail
  const profilePhoto = user.profilePhoto?.status === 'ready' ? user.profilePhoto : null;
  const introVid = user.introVideo?.status === 'ready' ? user.introVideo : null;
  const imageSource = profilePhoto?.url || user.profilePicture || introVid?.thumbnailUrl || null;
  const videoSource = introVid?.url || null;
  const hasVideo = !!videoSource;

  const handlePlayClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPlaying(true);
  }, []);

  const handleStopClick = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPlaying(false);
  }, []);

  return (
    <div className={`bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow group ${className}`}>
      {/* Thumbnail / Video */}
      {playing && videoSource ? (
        <div className="w-full h-44 bg-black relative">
          <VideoPlayer
            src={videoSource}
            poster={imageSource || undefined}
            autoPlay
          />
          <button
            type="button"
            onClick={handleStopClick}
            className="absolute top-2 right-2 z-10 w-7 h-7 bg-black/60 rounded-full flex items-center justify-center hover:bg-black/80 transition-colors"
          >
            <span className="material-symbols-outlined text-white text-sm">close</span>
          </button>
        </div>
      ) : (
        <Link to={profileUrl} className="block">
          <div className="w-full h-44 bg-gray-100 overflow-hidden relative">
            {imageSource ? (
              <img
                src={imageSource}
                alt={displayName}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
                <span className="material-symbols-outlined text-5xl text-gray-300">person</span>
              </div>
            )}
            {/* Play overlay when video exists */}
            {hasVideo && (
              <button
                type="button"
                onClick={handlePlayClick}
                className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <div className="w-12 h-12 rounded-full bg-black/60 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    play_arrow
                  </span>
                </div>
              </button>
            )}
          </div>
        </Link>
      )}

      {/* Content */}
      <div className="p-4">
        <Link to={profileUrl}>
          <h3 className="font-semibold text-gray-800 text-lg leading-snug mb-1 line-clamp-1 hover:text-accent-orange transition-colors">
            {displayName}
          </h3>
        </Link>
        {user.nickname && (
          <p className="text-sm text-gray-400 mb-2">@{user.nickname}</p>
        )}
        {user.description && (
          <p className="text-sm text-gray-500 line-clamp-2">{user.description}</p>
        )}
      </div>
    </div>
  );
}

export default UserCard;
