// Configuração do backend (Supabase). Veja ADMIN-SETUP.md.
// A "anon key" é pública por natureza: a segurança vem das políticas RLS do banco (supabase/schema.sql).
// Enquanto estes campos estiverem vazios, o site funciona em "modo demonstração" (notícias de exemplo)
// e o painel /admin mostra as instruções de configuração.
window.OO_CONFIG = {
  supabaseUrl: "https://yehydlchiswiciwnrixf.supabase.co/rest/v1/",      // ex.: "https://abcdefghijkl.supabase.co"
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllaHlkbGNoaXN3aWNpd25yaXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE4Nzc3NTcsImV4cCI6MjEwNzQ1Mzc1N30.V5Zxnum6kbmXqKIZkwTfzHjkRFu_UabXLaQ9MpyopLE",  // Project Settings → API → "anon public"
  bucket: "noticias",   // bucket de imagens criado pelo schema.sql
};
