// constants.tsx
// Arquivo ajustado para migração — sem dados Base64 nem imagens pesadas.

export const API_URL = "https://seu-endpoint-aqui.supabase.co";
export const SUPABASE_KEY = "chave-publica-ou-placeholder";
export const PROJECT_NAME = "CaririBancoDoFuturo";
export const VERSION = "1.0.0";

// Placeholder para o logotipo (imagem será adicionada após a migração)
export const LOGO_BASE64 = "[PLACEHOLDER_LOGO]";

// Cores e identidade visual
export const THEME = {
  primary: "#1E88E5",
  secondary: "#1565C0",
  accent: "#42A5F5",
  background: "#F5F5F5",
  text: "#212121",
};

// Mensagens globais e padrões de validação
export const MESSAGES = {
  error: "Ocorreu um erro. Tente novamente.",
  success: "Operação concluída com sucesso!",
  loginRequired: "Você precisa estar autenticado para acessar esta área.",
  invalidCredentials: "Usuário ou senha inválidos.",
};

// Configurações de tempo e formato
export const DATE_FORMAT = "DD/MM/YYYY";
export const TIMEZONE = "America/Fortaleza";

// Permissões padrão
export const DEFAULT_ROLES = ["admin", "user", "guest"];

// Configurações de cache e sessão
export const CACHE_KEYS = {
  userSession: "cariri_user_session",
  lastSync: "cariri_last_sync",
};
