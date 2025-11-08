import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://cdbxkxyobmirmtytwfmj.supabase.co';
const supabaseKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkYnhreHlvYm1pcm10eXR3Zm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTk5NzAsImV4cCI6MjA3NzQ5NTk3MH0.IIlU3yAsPvyiiZ_bOknn9EjX_Qd1Y7WiNfZgNyNh78o';

export const supabase = createClient(supabaseUrl, supabaseKey);

let projectId = '';
try {
  // Extracts the project ID (subdomain) from the Supabase URL
  projectId = new URL(supabaseUrl).hostname.split('.')[0];
} catch (error) {
  console.error("Could not parse Supabase URL to get project ID", error);
}

export const supabaseProjectId = projectId;