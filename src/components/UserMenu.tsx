import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, LogOut, Heart, Music, Settings } from 'lucide-react';
import { User as UserType } from '../types/user';

interface UserMenuProps {
  user: UserType;
  onLogout: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({
  user,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
      >
        <div className="w-8 h-8 bg-gradient-to-r from-[#FF3CAC] to-[#784BA0] rounded-full flex items-center justify-center">
          <User className="h-4 w-4 text-white" />
        </div>
        <span className="text-white text-sm font-medium hidden md:block">
          {user.displayName || user.email.split('@')[0]}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 top-full mt-2 w-48 bg-[#2B2D42] border border-white/10 rounded-lg shadow-xl z-50">
            <div className="p-3 border-b border-white/10">
              <p className="text-white font-medium truncate">
                {user.displayName || 'User'}
              </p>
              <p className="text-gray-400 text-sm truncate">{user.email}</p>
            </div>
            
            <div className="py-2">
              <button
                onClick={() => {
                  navigate('/liked');
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Heart className="h-4 w-4" />
                <span>Liked Songs</span>
              </button>
              
              <button
                onClick={() => {
                  navigate('/playlists');
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <Music className="h-4 w-4" />
                <span>My Playlists</span>
              </button>
            </div>
            
            <div className="border-t border-white/10 py-2">
              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center space-x-3 px-3 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};