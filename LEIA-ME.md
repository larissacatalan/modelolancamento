# Como subir no Lovable sem ele recriar do zero

1. No Lovable, crie um projeto novo com o prompt: `Projeto em branco. Não crie nenhuma tela.`
2. No projeto, clique no ícone do GitHub (canto superior direito) → **Connect to GitHub** → crie o repositório.
3. Abra o repositório no GitHub (navegador) → **Add file → Upload files** → arraste o conteúdo desta pasta (`index.html`, a pasta `src` e a pasta `public`). Confirme a substituição do `index.html` → **Commit changes**.
4. Volte ao Lovable: ele sincroniza sozinho e o preview mostra o painel igual ao protótipo.
5. Cole no chat do Lovable o prompt abaixo (só liga o banco de dados, sem mexer no visual).

---

## Prompt para o passo 5

Não altere o visual, o layout, o CSS nem a estrutura do HTML. Este projeto é um HTML + JavaScript puro (index.html + src/painel.js) — não converta para React e não recrie as telas.

Preciso apenas que os dados sejam compartilhados entre todos que acessam:

1. Ative o Lovable Cloud e crie a tabela `painel_estado` com as colunas: `id` (text, chave primária), `data` (jsonb), `updated_at` (timestamptz). Insira uma linha com id = 'quintas-da-mantiqueira'.
2. RLS: leitura pública (qualquer pessoa, sem login); insert/update só para usuários autenticados.
3. Em `src/painel.js`, altere SOMENTE o bloco marcado "ARMAZENAMENTO":
   - `load()` passa a ler a coluna `data` da linha 'quintas-da-mantiqueira'. Se estiver vazia, usa o `SEED` e grava no banco.
   - `save()` grava o objeto `data` inteiro nessa linha (mantendo `data.updatedAt`, `render()` e o `toast`).
   - Como a leitura passa a ser assíncrona, inicialize o app com `data = await load(); render();`.
   - Assine mudanças em tempo real dessa linha (Realtime) para atualizar a tela de quem estiver com o painel aberto.
4. Botão "Modo equipe" do rodapé: se o usuário não estiver logado, abrir um modal simples de login (e-mail e senha) no mesmo estilo dos modais existentes; só depois de logado ativar `document.body.classList.add("editing")`. "Sair do modo equipe" faz logout.
5. Não crie cadastro público: os usuários da equipe serão criados por mim no painel do Cloud.
