import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

console.log("--------------------------------");
console.log("CEK ENV VARS:");
console.log("URL:", supabaseUrl); 
console.log("KEY:", supabaseAnonKey ? "Key Ada (Panjang: " + supabaseAnonKey.length + ")" : "KEY KOSONG!!");
console.log("--------------------------------");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type UserRole = 'user' | 'event_organizer' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  avatar_url?: string;
}

export interface Submission {
  id: string;
  submitted_by: string;
  type: 'add' | 'edit' | 'delete';
  status: 'pending' | 'approved' | 'rejected';
  destination_id?: string;
  data: any;
  created_at: string;
  reviewed_at?: string;
  reviewed_by?: string;
  review_notes?: string;
}

export interface Destination {
  id: string;
  name: string;
  location: string;
  type: 'destination' | 'event';
  description: string;
  image: string;
  rating: number;
  reviews_count: number;
  likes_count: number;
  tags: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  price?: string;
  date?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}