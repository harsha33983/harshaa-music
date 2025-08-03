import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { YouTubeVideo } from '../types/youtube';
import { useAuth } from './useAuth';

interface SupabasePlaylist {
  id: string;
  name: string;
  description: string;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  tracks: YouTubeVideo[];
}

export const useSupabaseData = () => {
  const { user } = useAuth();
  const [likedSongs, setLikedSongs] = useState<YouTubeVideo[]>([]);
  const [playlists, setPlaylists] = useState<SupabasePlaylist[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch liked songs
  const fetchLikedSongs = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('liked_songs')
        .select('*')
        .eq('user_id', user.id)
        .order('liked_at', { ascending: false });

      if (error) throw error;

      const songs: YouTubeVideo[] = data.map(song => ({
        id: song.song_id,
        title: song.title,
        channelTitle: song.channel_title,
        thumbnails: song.thumbnails,
        duration: song.duration,
        publishedAt: song.published_at,
        description: ''
      }));

      setLikedSongs(songs);
    } catch (error) {
      console.error('Error fetching liked songs:', error);
    }
  };

  // Fetch playlists with songs
  const fetchPlaylists = async () => {
    if (!user) return;

    try {
      const { data: playlistsData, error: playlistsError } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (playlistsError) throw playlistsError;

      const playlistsWithSongs = await Promise.all(
        playlistsData.map(async (playlist) => {
          const { data: songsData, error: songsError } = await supabase
            .from('playlist_songs')
            .select('*')
            .eq('playlist_id', playlist.id)
            .order('position', { ascending: true });

          if (songsError) throw songsError;

          const tracks: YouTubeVideo[] = songsData.map(song => ({
            id: song.song_id,
            title: song.title,
            channelTitle: song.channel_title,
            thumbnails: song.thumbnails,
            duration: song.duration,
            publishedAt: song.published_at,
            description: ''
          }));

          return {
            id: playlist.id,
            name: playlist.name,
            description: playlist.description,
            is_public: playlist.is_public,
            created_at: playlist.created_at,
            updated_at: playlist.updated_at,
            tracks
          };
        })
      );

      setPlaylists(playlistsWithSongs);
    } catch (error) {
      console.error('Error fetching playlists:', error);
    }
  };

  // Like/Unlike song
  const toggleLikeSong = async (track: YouTubeVideo) => {
    if (!user) return;

    try {
      const isLiked = likedSongs.some(song => song.id === track.id);

      if (isLiked) {
        const { error } = await supabase
          .from('liked_songs')
          .delete()
          .eq('user_id', user.id)
          .eq('song_id', track.id);

        if (error) throw error;
        setLikedSongs(prev => prev.filter(song => song.id !== track.id));
      } else {
        const { error } = await supabase
          .from('liked_songs')
          .insert({
            user_id: user.id,
            song_id: track.id,
            title: track.title,
            channel_title: track.channelTitle,
            thumbnails: track.thumbnails,
            duration: track.duration,
            published_at: track.publishedAt
          });

        if (error) throw error;
        setLikedSongs(prev => [track, ...prev]);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Create playlist
  const createPlaylist = async (name: string, description?: string): Promise<SupabasePlaylist | null> => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name,
          description: description || '',
          is_public: false
        })
        .select()
        .single();

      if (error) throw error;

      const newPlaylist: SupabasePlaylist = {
        id: data.id,
        name: data.name,
        description: data.description,
        is_public: data.is_public,
        created_at: data.created_at,
        updated_at: data.updated_at,
        tracks: []
      };

      setPlaylists(prev => [newPlaylist, ...prev]);
      return newPlaylist;
    } catch (error) {
      console.error('Error creating playlist:', error);
      return null;
    }
  };

  // Delete playlist
  const deletePlaylist = async (playlistId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId)
        .eq('user_id', user.id);

      if (error) throw error;
      setPlaylists(prev => prev.filter(p => p.id !== playlistId));
    } catch (error) {
      console.error('Error deleting playlist:', error);
    }
  };

  // Add song to playlist
  const addToPlaylist = async (playlistId: string, track: YouTubeVideo) => {
    if (!user) return;

    try {
      // Get current max position
      const { data: existingSongs } = await supabase
        .from('playlist_songs')
        .select('position')
        .eq('playlist_id', playlistId)
        .order('position', { ascending: false })
        .limit(1);

      const nextPosition = existingSongs && existingSongs.length > 0 
        ? existingSongs[0].position + 1 
        : 0;

      const { error } = await supabase
        .from('playlist_songs')
        .insert({
          playlist_id: playlistId,
          song_id: track.id,
          title: track.title,
          channel_title: track.channelTitle,
          thumbnails: track.thumbnails,
          duration: track.duration,
          published_at: track.publishedAt,
          position: nextPosition
        });

      if (error) throw error;

      // Update local state
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId 
          ? { ...playlist, tracks: [...playlist.tracks, track] }
          : playlist
      ));
    } catch (error) {
      console.error('Error adding to playlist:', error);
    }
  };

  // Remove song from playlist
  const removeFromPlaylist = async (playlistId: string, songId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('playlist_songs')
        .delete()
        .eq('playlist_id', playlistId)
        .eq('song_id', songId);

      if (error) throw error;

      // Update local state
      setPlaylists(prev => prev.map(playlist => 
        playlist.id === playlistId 
          ? { ...playlist, tracks: playlist.tracks.filter(track => track.id !== songId) }
          : playlist
      ));
    } catch (error) {
      console.error('Error removing from playlist:', error);
    }
  };

  // Check if song is liked
  const isTrackLiked = (trackId: string): boolean => {
    return likedSongs.some(song => song.id === trackId);
  };

  // Load data when user changes
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([fetchLikedSongs(), fetchPlaylists()]).finally(() => {
        setLoading(false);
      });
    } else {
      setLikedSongs([]);
      setPlaylists([]);
    }
  }, [user]);

  return {
    likedSongs,
    playlists,
    loading,
    toggleLikeSong,
    createPlaylist,
    deletePlaylist,
    addToPlaylist,
    removeFromPlaylist,
    isTrackLiked,
    fetchLikedSongs,
    fetchPlaylists
  };
};