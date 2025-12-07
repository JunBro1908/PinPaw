export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      sightings: {
        Row: {
          id: string;
          image_url: string;
          latitude: number;
          longitude: number;
          breed: string | null;
          color: string | null;
          features: Json | null;
          description: string | null;
          sighted_at: string;
          ip_address: string | null;
          embedding: string | null;
        };
        Insert: {
          id?: string;
          image_url: string;
          latitude: number;
          longitude: number;
          breed?: string | null;
          color?: string | null;
          features?: Json | null;
          description?: string | null;
          sighted_at?: string;
          ip_address?: string | null;
          embedding?: string | null;
        };
        Update: {
          id?: string;
          image_url?: string;
          latitude?: number;
          longitude?: number;
          breed?: string | null;
          color?: string | null;
          features?: Json | null;
          description?: string | null;
          sighted_at?: string;
          ip_address?: string | null;
          embedding?: string | null;
        };
      };
      lost_posts: {
        Row: {
          id: string;
          user_id: string;
          dog_name: string;
          breed: string | null;
          color: string | null;
          features: Json | null;
          description: string | null;
          latitude: number;
          longitude: number;
          missing_at: string;
          status: "searching" | "found" | "closed";
          embedding: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          dog_name: string;
          breed?: string | null;
          color?: string | null;
          features?: Json | null;
          description?: string | null;
          latitude: number;
          longitude: number;
          missing_at: string;
          status?: "searching" | "found" | "closed";
          embedding?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          dog_name?: string;
          breed?: string | null;
          color?: string | null;
          features?: Json | null;
          description?: string | null;
          latitude?: number;
          longitude?: number;
          missing_at?: string;
          status?: "searching" | "found" | "closed";
          embedding?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      users: {
        Row: {
          id: string;
          nickname: string;
          created_at: string;
        };
        Insert: {
          id: string;
          nickname: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          nickname?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      lost_status: "searching" | "found" | "closed";
    };
  };
};
