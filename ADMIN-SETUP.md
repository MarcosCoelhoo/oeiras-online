# Painel administrativo do Oeiras OnLine — configuração

O painel fica em **`/admin`** (em produção: `https://www.oeirasonline.com.br/admin`).
Ele usa o **Supabase** (plano gratuito) para três coisas:

| O quê | Para quê |
|---|---|
| **Auth** (login por e-mail e senha) | Só administradores entram no painel |
| **Banco de dados** (PostgreSQL) | Guarda as notícias de forma permanente |
| **Storage** | Guarda as imagens de capa |

A segurança fica **no banco**, não no navegador: as políticas RLS de `supabase/schema.sql` garantem que
visitantes só leiam notícias publicadas (cuja data já chegou) e que apenas contas cadastradas em
`public.admins` possam criar, editar, excluir ou enviar imagens. Mesmo alguém que altere o JavaScript do
site não consegue ver rascunhos nem gravar nada.

Enquanto o Supabase não estiver configurado, o site funciona em **modo demonstração** (notícias de exemplo)
e o `/admin` mostra uma tela avisando que falta a configuração.

---

## Passo a passo (uma única vez)

### 1. Criar o projeto no Supabase
1. Crie uma conta em <https://supabase.com> e clique em **New project**.
2. Nome: `oeiras-online`. Região: **South America (São Paulo)**. Guarde a senha do banco num lugar seguro.

### 2. Criar as tabelas, as regras de segurança e o armazenamento de imagens
1. No menu do projeto, abra **SQL Editor → New query**.
2. Cole todo o conteúdo de [`supabase/schema.sql`](supabase/schema.sql) e clique em **Run**.
   (Pode rodar de novo no futuro sem perder dados.)
3. *(Opcional)* Para guardar as 12 notícias de exemplo do esboço, rode também
   [`supabase/seed-exemplos.sql`](supabase/seed-exemplos.sql). Elas entram como **rascunho** e não aparecem
   no site — revise, troque as fotos ilustrativas e publique só o que for real.

### 3. Bloquear cadastros públicos
**Authentication → Sign In / Providers → Email**: desative **“Allow new users to sign up”**.
Assim, ninguém cria conta sozinho. (Mesmo que criasse, não teria acesso: só quem está em `public.admins` entra.)

### 4. Criar a conta de administrador
1. **Authentication → Users → Add user → Create new user**: informe o e-mail e uma senha forte e marque
   **Auto Confirm User**.
2. No **SQL Editor**, autorize essa conta como administradora (troque o e-mail e o nome):
   ```sql
   insert into public.admins (user_id, nome)
   select id, 'Nome do responsável' from auth.users where email = 'email@exemplo.com';
   ```
   Repita para cada pessoa que puder publicar. Para remover um acesso:
   `delete from public.admins where user_id = (select id from auth.users where email = 'email@exemplo.com');`

### 5. Endereços permitidos (recuperação de senha)
**Authentication → URL Configuration**:
- **Site URL**: `https://www.oeirasonline.com.br`
- **Redirect URLs**: adicione `https://www.oeirasonline.com.br/admin/`
  e, enquanto o site estiver no endereço provisório, `https://marcoscoelhoo.github.io/oeiras-online/admin/`.

> O envio de e-mails do Supabase gratuito é limitado (poucos por hora). Para produção, configure um SMTP
> próprio em **Authentication → Emails → SMTP Settings**.

### 6. Conectar o site ao projeto
Em **Project Settings → API** (ou **API Keys**), copie a **Project URL** e a chave **anon / public** e
preencha [`assets/config.js`](assets/config.js):
```js
window.OO_CONFIG = {
  supabaseUrl: "https://SEU-PROJETO.supabase.co",
  supabaseAnonKey: "eyJhbGciOi...",   // chave "anon public" — pode ficar no código, ela é pública
  bucket: "noticias",
};
```
**Nunca** coloque a chave `service_role` no site.

### 7. Publicar
Envie as alterações para o GitHub (`git add -A`, `git commit`, `git push`). Em cerca de 1 minuto o
GitHub Pages atualiza o site e o painel passa a funcionar em `/admin`.

### 8. Domínio `www.oeirasonline.com.br` (quando for apontar)
1. No GitHub: **Settings → Pages → Custom domain** → `www.oeirasonline.com.br` → **Save**, depois marque
   **Enforce HTTPS** quando liberar.
2. No registro do domínio (Registro.br ou onde estiver o DNS): crie um registro **CNAME** de `www` para
   `marcoscoelhoo.github.io`.

---

## Como usar o painel
- **Notícias**: lista com busca por título, filtros por categoria, situação (publicada, rascunho, agendada)
  e intervalo de datas. Ações por notícia: editar, ver no site, publicar/despublicar e excluir (com confirmação).
- **Nova notícia**: título, subtítulo, resumo, categoria, autor, data e hora, destaque na capa, imagem de capa
  (envio ou galeria) com legenda, e conteúdo com intertítulos, listas, citações e links.
  - **Salvar rascunho** guarda sem publicar. **Publicar** exige todos os campos obrigatórios e imagem de capa.
  - Data no futuro = notícia **agendada** (aparece sozinha no site no horário marcado).
  - **Prévia** abre a matéria com o visual do site antes de publicar.
  - O formulário tem cópia de segurança automática no navegador: se a aba fechar sem salvar, o painel oferece
    restaurar as alterações.
- **Imagens**: galeria das capas enviadas, mostrando onde cada uma é usada. Fotos grandes são reduzidas para
  até 1600 px automaticamente; imagens em uso não podem ser excluídas.
- **Destaque na capa**: a manchete da página inicial é a notícia em destaque mais recente (ou, se não houver,
  a mais recente). As demais em destaque aparecem em “Destaques do Dia”.

## Categorias
A lista fica em `assets/data.js` (`OO.categorias`) e vale para o site e para o painel. Para criar uma nova,
adicione-a ali **e** inclua o mesmo `slug` na restrição `noticias_categoria_valida` de `supabase/schema.sql`
(rode o arquivo de novo no SQL Editor).

## Testes locais (para quem for mexer no código)
Requer Node.js. Na pasta `tests/`:
```bash
npm install
npm run testar-banco   # 36 testes das regras de segurança num PostgreSQL real (PGlite)
npm run emulador       # site em http://localhost:5510 ligado a um Supabase local de teste
```
O emulador recria um banco vazio a cada execução, com o mesmo `schema.sql`, e grava contas de teste
(administrador e leitor comum) em `tests/credenciais-teste.json` — arquivo fora do git.
