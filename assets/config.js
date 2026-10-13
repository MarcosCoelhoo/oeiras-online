// Configuração do backend (Supabase). Veja ADMIN-SETUP.md.
// A "anon key" é pública por natureza: a segurança vem das políticas RLS do banco (supabase/schema.sql).
// Enquanto estes campos estiverem vazios, o site funciona em "modo demonstração" (notícias de exemplo)
// e o painel /admin mostra as instruções de configuração.
window.OO_CONFIG = {
  supabaseUrl: "",      // ex.: "https://abcdefghijkl.supabase.co"
  supabaseAnonKey: "",  // Project Settings → API → "anon public"
  bucket: "noticias",   // bucket de imagens criado pelo schema.sql
};
