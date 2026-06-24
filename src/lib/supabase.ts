import { createClient } from "@supabase/supabase-js";

// Pon tus llaves reales aquí adentro de las comillas:
const rawUrl = "https://qxrqbjglfdopmfrkbqxj.supabase.co";
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, "");
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF4cnFiamdsZmRvcG1mcmticXhqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEyODc1NTYsImV4cCI6MjA5Njg2MzU1Nn0.GNlrMnaIBgFPW5hgquEl8rsbmM1E5i_JKCs3BjDzrYc";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);