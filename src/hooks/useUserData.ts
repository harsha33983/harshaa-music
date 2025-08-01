import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, addDoc, deleteDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { YouTubeVideo } from '../types/youtube';
import { Playlist, UserData } from '../types/user';

export const useUserData = (userId: string | null) => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchUserData();
      fetchPlaylists();
    } else {
      setUserData(null);
      setPlaylists([]);
    }
  }, [userId]);

  const fetchUserData = async () => {
    if (!userId) return;
    
    try {
      setLoading(true);
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data() as UserData;
        setUserData(data);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlaylists = async () => {
    if (!userId) return;
    
    try {
      const playlistsRef = collection(db, 'playlists');
      const q = query(playlistsRef, where('userId', '==', userId));
      const querySnapshot = await getDocs(q);
      
      const userPlaylists: Playlist[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        userPlaylists.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate(),
        } as Playlist);
      });
      
      setPlaylists(userPlaylists);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  const toggleLikedSong = async (track: YouTubeVideo) => {
    if (!userId || !userData) return;
    
    try {
      const userRef = doc(db, 'users', userId);
      const isLiked = userData.likedSongs.some(song => song.id === track.id);
      
      if (isLiked) {
        const updatedLikedSongs = userData.likedSongs.filter(song => song.id !== track.id);
        await updateDoc(userRef, {
          likedSongs: updatedLikedSongs,
          updatedAt: new Date(),
        });
        setUserData(prev => prev ? { ...prev, likedSongs: updatedLikedSongs } : null);
      } else {
        const updatedLikedSongs = [...userData.likedSongs, track];
        await updateDoc(userRef, {
          likedSongs: updatedLikedSongs,
          updatedAt: new Date(),
        });
        setUserData(prev => prev ? { ...prev, likedSongs: updatedLikedSongs } : null);
      }
    } catch (error) {
      console.error('Error toggling liked song:', error);
    }
  };

  const createPlaylist = async (name: string, description?: string) => {
    if (!userId) return null;
    
    try {
      const playlistData: Omit<Playlist, 'id'> = {
        name,
        description,
        tracks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
        userId,
        isPublic: false,
      };
      
      const docRef = await addDoc(collection(db, 'playlists'), playlistData);
      const newPlaylist: Playlist = { id: docRef.id, ...playlistData };
      
      setPlaylists(prev => [...prev, newPlaylist]);
      return newPlaylist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      return null;
    }
  };

  const deletePlaylist = async (playlistId: string) => {
    if (!userId) return;
    
    try {
      await deleteDoc(doc(db, 'playlists', playlistId));
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  const addToPlaylist = async (playlistId: string, track: YouTubeVideo) => {
    if (!userId) return;
    
    try {
      const playlistRef = doc(db, 'playlists', playlistId);
      const playlist = playlists.find(p => p.id === playlistId);
      
      if (playlist && !playlist.tracks.some(t => t.id === track.id)) {
        const updatedTracks = [...playlist.tracks, track];
        await updateDoc(playlistRef, {
          tracks: updatedTracks,
          updatedAt: new Date(),
        });
        
        setPlaylists(prev => prev.map(p => 
          p.id === playlistId 
            ? { ...p, tracks: updatedTracks, updatedAt: new Date() }
            : p
        ));
      }
    } catch (error) {
      console.error('Error adding to playlist:', error);
    }
  };

  const removeFromPlaylist = async (playlistId: string, trackId: string) => {
    if (!userId) return;
    
    try {
      const playlistRef = doc(db, 'playlists', playlistId);
      const playlist = playlists.find(p => p.id === playlistId);
      
      if (playlist) {
        const updatedTracks = playlist.tracks.filter(t => t.id !== trackId);
        await updateDoc(playlistRef, {
          tracks: updatedTracks,
          updatedAt: new Date(),
        });
        
        setPlaylists(prev => prev.map(p => 
          p.id === playlistId 
            ? { ...p, tracks: updatedTracks, updatedAt: new Date() }
            : p
        ));
      }
    } catch (error) {
      console.error('Error removing from playlist:', error);
    }
  };

  const isTrackLiked = (trackId: string): boolean => {
    return userData?.likedSongs.some(song => song.id === trackId) || false;
  };

  return {
    userData,
    playlists,
    loading,
    toggleLikedSong,
    createPlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    isTrackLiked,
    refetch: () => {
      fetchUserData();
      fetchPlaylists();
    },
  };
};