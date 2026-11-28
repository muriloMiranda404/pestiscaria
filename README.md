# Lucrécio Petiscaria

Site e cardápio digital com painel administrativo, desenvolvidos pela KodexBase. O projeto usa Next.js 16, React 19, TypeScript strict, Tailwind CSS 4, Motion, Radix UI, Supabase Auth, PostgreSQL e Storage. A apresentação comercial usa um banco SQLite isolado, com conteúdo fictício identificado em todas as páginas públicas.

## Iniciar a demonstração

É necessário Node.js 24 e npm. O desenvolvimento local usa as imagens ilustrativas incluídas em `public/images`.

```bash
npm ci
printf 'APP_MODE=demo\nSITE_INDEXABLE=false\nDEMO_DB_PATH=.local/demo.sqlite\n' > .env.local
npm run dev
```

Abra o endereço mostrado pelo Next.js. Em `/admin/login`, escolha **Entrar na demonstração**. A sessão dura quatro horas. Os cadastros, configurações e QR Codes ficam no banco `.local/demo.sqlite`. Em **Configurações**, o botão **Redefinir demonstração** repõe os exemplos. O banco, a chave de sessão e os uploads locais ficam no diretório ignorado `.local`. O modo de demonstração bloqueia envios reais de pedidos e reservas e solicita a não indexação.

Para validar o build e iniciar uma prévia da versão compilada:

```bash
npm run build
npm run start:demo
```

O site público de produção usa apenas as informações institucionais iniciais indicadas em [docs/business-data.md](docs/business-data.md) até o proprietário aprovar e publicar conteúdo pelo painel. O endereço abre uma busca textual no Maps. Horários, WhatsApp, reservas, pedidos e métricas começam desativados.

## Supabase e produção

Crie um projeto Supabase dedicado e aplique `supabase/migrations` na ordem numérica com o Supabase CLI ou editor SQL. As migrations criam tabelas, índices, funções, políticas de Row Level Security, bucket de mídia e quotas. A aplicação não inclui senha ou chave privilegiada. Copie as **variáveis** de [`.env.example`](.env.example) para o cofre da hospedagem e preencha `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. `SUPABASE_SERVICE_ROLE_KEY` fica apenas no servidor e é necessária quando métricas opcionais ou solicitações de reserva são habilitadas. Configure `NEXT_PUBLIC_SITE_URL` com o domínio HTTPS aprovado antes de imprimir os QR Codes. Ative `SITE_INDEXABLE=true` após aprovar o domínio e os dados publicados.

No Supabase Auth, desative o cadastro público e crie a primeira pessoa administradora por convite ou pelo painel de autenticação do próprio Supabase. Após confirmar seu e-mail, associe seu UUID em `admin_profiles` usando o editor SQL com privilégios administrativos:

```sql
select id, email, email_confirmed_at
from auth.users
where email = 'email-confirmado-do-administrador@example.com';

insert into public.admin_profiles (id)
select id from auth.users where email = 'email-confirmado-do-administrador@example.com'
on conflict (id) do nothing;
```

Substitua o e-mail pelo endereço real da pessoa convidada. Execute a consulta primeiro e confira que ela retorna exatamente uma conta com e-mail confirmado antes de executar o `insert`. A autorização do painel valida a sessão Supabase e esse perfil no servidor. As operações de banco também exigem a política de administrador. Não coloque a service role no navegador ou em variáveis `NEXT_PUBLIC_`.

O projeto usa `America/Sao_Paulo` na agenda, nos horários e nos relatórios. Faça a homologação com os dados reais do proprietário antes de ligar os módulos opcionais. A publicação em produção depende de autorização. [docs/hospedagem.md](docs/hospedagem.md) detalha implantação, custos, backup e rollback.

## Verificações

```bash
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Os testes de navegador usam Chromium local e iniciam um servidor de demonstração isolado na porta 3100. As capturas ficam em `test-results/` e são ignoradas pelo Git. Há um script de Lighthouse em `tests/performance/audit.mjs` que usa `AUDIT_URL` para medir páginas representativas de um servidor já iniciado. Os resultados desta execução estão em [docs/testes.md](docs/testes.md).

## Conteúdo e operação

O painel em `/admin` permite gerir produtos, categorias, promoções, eventos, imagens, QR Codes, informações do restaurante e métricas consentidas. [docs/manual-painel.md](docs/manual-painel.md) explica o uso. As regras de retenção, tabelas e restauração estão em [docs/banco.md](docs/banco.md).

As imagens entregues em `public/images` foram geradas para este projeto e aparecem como **ilustrativas**. A assinatura visual textual e o monograma são provisórios. Fotografias oficiais, logo, cardápio, preços, horários, endereço e canais devem ser confirmados com o responsável antes de publicar o site.
