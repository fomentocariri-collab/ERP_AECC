import { createClient } from '@supabase/supabase-js';

// As credenciais do Supabase são definidas aqui.
// Em um ambiente de produção real, é altamente recomendável usar variáveis de ambiente
// para proteger essas chaves.
const supabaseUrl = 'https://cdbxkxyobmirmtytwfmj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNkYnhreHlvYm1pcm10eXR3Zm1qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE5MTk5NzAsImV4cCI6MjA3NzQ5NTk3MH0.IIlU3yAsPvyiiZ_bOknn9EjX_Qd1Y7WiNfZgNyNh78o';

export const supabase = createClient(supabaseUrl, supabaseKey);

let projectId = '';
try {
  // Extrai o ID do projeto (subdomínio) da URL do Supabase para links úteis.
  projectId = new URL(supabaseUrl).hostname.split('.')[0];
} catch (error) {
  console.error("Não foi possível analisar a URL do Supabase para obter o ID do projeto", error);
}

export const supabaseProjectId = projectId;
