import { createClient } from '@supabase/supabase-js'

// Esta configuração do cliente Supabase utiliza variáveis de ambiente, o que é uma boa prática de segurança.
// Certifique-se de que as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY estão definidas em seu ambiente.
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);
