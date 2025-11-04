import { createClient } from '@supabase/supabase-js';

// ❗️❗️❗️ AÇÃO NECESSÁRIA ❗️❗️❗️
// Cole sua URL e chave anônima (anon key) do Supabase aqui.
// Você pode encontrá-las nas configurações do seu projeto Supabase em "Project Settings" > "API".
const supabaseUrl = 'https://cdbxkxyobmirmtytwfmj.supabase.co';
const supabaseKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkYnhreHlvYm1pcm10eXR3Zm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTk5NzAsImV4cCI6MjA3NzQ5NTk3MH0.IIlU3yAsPvyiiZ_bOknn9EjX_Qd1Y7WiNfZgNyNh78o';

export const supabase = createClient(supabaseUrl, supabaseKey);