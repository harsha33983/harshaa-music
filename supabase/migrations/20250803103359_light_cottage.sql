/*
  # Authentication and User Management Schema

  1. New Tables
    - `profiles`
      - `id` (uuid, references auth.users)
      - `username` (text, unique)
      - `email` (text, unique)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `liked_songs`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `song_id` (text, YouTube video ID)
      - `title` (text)
      - `channel_title` (text)
      - `thumbnails` (jsonb)
      - `duration` (text)
      - `published_at` (text)
      - `liked_at` (timestamp)
    
    - `playlists`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `name` (text)
      - `description` (text, optional)
      - `is_public` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `playlist_songs`
      - `id` (uuid, primary key)
      - `playlist_id` (uuid, references playlists)
      - `song_id` (text, YouTube video ID)
      - `title` (text)
      - `channel_title` (text)
      - `thumbnails` (jsonb)
      - `duration` (text)
      - `published_at` (text)
      - `position` (integer)
      - `added_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users to manage their own data
    - Add policies for public playlist viewing
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL,
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create liked_songs table
CREATE TABLE IF NOT EXISTS liked_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  song_id text NOT NULL,
  title text NOT NULL,
  channel_title text NOT NULL,
  thumbnails jsonb NOT NULL DEFAULT '{}',
  duration text NOT NULL DEFAULT '',
  published_at text NOT NULL DEFAULT '',
  liked_at timestamptz DEFAULT now(),
  UNIQUE(user_id, song_id)
);

-- Create playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text DEFAULT '',
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create playlist_songs table
CREATE TABLE IF NOT EXISTS playlist_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE NOT NULL,
  song_id text NOT NULL,
  title text NOT NULL,
  channel_title text NOT NULL,
  thumbnails jsonb NOT NULL DEFAULT '{}',
  duration text NOT NULL DEFAULT '',
  published_at text NOT NULL DEFAULT '',
  position integer NOT NULL DEFAULT 0,
  added_at timestamptz DEFAULT now(),
  UNIQUE(playlist_id, song_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE liked_songs ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Liked songs policies
CREATE POLICY "Users can view own liked songs"
  ON liked_songs
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own liked songs"
  ON liked_songs
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own liked songs"
  ON liked_songs
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Playlists policies
CREATE POLICY "Users can view own playlists"
  ON playlists
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public playlists"
  ON playlists
  FOR SELECT
  TO authenticated
  USING (is_public = true);

CREATE POLICY "Users can insert own playlists"
  ON playlists
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own playlists"
  ON playlists
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own playlists"
  ON playlists
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Playlist songs policies
CREATE POLICY "Users can view songs in own playlists"
  ON playlist_songs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_songs.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view songs in public playlists"
  ON playlist_songs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_songs.playlist_id 
      AND playlists.is_public = true
    )
  );

CREATE POLICY "Users can insert songs to own playlists"
  ON playlist_songs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_songs.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update songs in own playlists"
  ON playlist_songs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_songs.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete songs from own playlists"
  ON playlist_songs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM playlists 
      WHERE playlists.id = playlist_songs.playlist_id 
      AND playlists.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_liked_songs_user_id ON liked_songs(user_id);
CREATE INDEX IF NOT EXISTS idx_liked_songs_song_id ON liked_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_position ON playlist_songs(playlist_id, position);

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON playlists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();