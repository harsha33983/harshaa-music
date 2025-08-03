export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          username: string;
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      liked_songs: {
        Row: {
          id: string;
          user_id: string;
          song_id: string;
          title: string;
          channel_title: string;
          thumbnails: any;
          duration: string;
          published_at: string;
          liked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          song_id: string;
          title: string;
          channel_title: string;
          thumbnails?: any;
          duration?: string;
          published_at?: string;
          liked_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          song_id?: string;
          title?: string;
          channel_title?: string;
          thumbnails?: any;
          duration?: string;
          published_at?: string;
          liked_at?: string;
        };
      };
      playlists: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string;
          is_public?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      playlist_songs: {
        Row: {
          id: string;
          playlist_id: string;
          song_id: string;
          title: string;
          channel_title: string;
          thumbnails: any;
          duration: string;
          published_at: string;
          position: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          playlist_id: string;
          song_id: string;
          title: string;
          channel_title: string;
          thumbnails?: any;
          duration?: string;
          published_at?: string;
          position?: number;
          added_at?: string;
        };
        Update: {
          id?: string;
          playlist_id?: string;
          song_id?: string;
          title?: string;
          channel_title?: string;
          thumbnails?: any;
          duration?: string;
          published_at?: string;
          position?: number;
          added_at?: string;
        };
      };
    };
  };
}