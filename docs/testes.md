# Relatório de validação

Execução em 28 de novembro de 2026, no ambiente local com Node.js 24, Chromium e Next.js 16.4.6. As páginas públicas e o painel foram testados no modo de demonstração, com SQLite isolado. O build e a auditoria Lighthouse foram executados em modo de produção, sem credenciais Supabase.

| Verificação | Resultado |
| --- | --- |
| `npm run typecheck` | Aprovado, sem erros de TypeScript. |
| `npm run lint` | Aprovado, sem erros ou avisos de ESLint. |
| `npm test` | 13 testes unitários aprovados em 2 arquivos. Cobrem validação, sacola, preços, publicação e segurança. |
| `npm run build` | Aprovado em modo de demonstração e em modo de produção. |
| `npm run test:e2e` | 18 testes Playwright aprovados. Cobrem 8 larguras de 320 a 1920 px, navegação pública, busca e filtros, teclado, regras automáticas WCAG A/AA, acesso administrativo, cadastro e upload de produto, promoção com expiração, agenda com arquivo de calendário e QR Code com exportação SVG/PNG. |
| Migrations SQL | As duas migrations foram aplicadas em PostgreSQL 17 com esquemas locais simulados de `auth` e `storage`. Foram exercitados cadastro administrativo, função `save_menu_item`, leitura anônima publicada, ocultação de dados privados e bloqueio de leitura anônima de auditoria. |
| Servidor de produção | `/` respondeu 200, `/admin` redirecionou para login com 307 e `robots.txt` refletiu a opção de indexação configurada no teste. |

## Lighthouse

Lighthouse 13.6.0, Chromium local, servidor `next start` em modo de produção, `SITE_INDEXABLE=true` e origem local para a auditoria. Cada pontuação abaixo vem de uma execução. Os relatórios JSON detalhados foram gerados em `test-results/performance/`, que é ignorado pelo Git.

| Página | Performance | Acessibilidade | Boas práticas | SEO | LCP | CLS | TBT |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Início | 92 | 100 | 100 | 100 | 3,4 s | 0 | 48 ms |
| Cardápio | 100 | 100 | 100 | 100 | 0,91 s | 0 | 90 ms |

O catálogo de produção estava vazio por falta de dados comerciais aprovados. As pontuações podem variar quando o conteúdo real, as imagens oficiais, o domínio e o Supabase forem configurados. A verificação automática de acessibilidade não substitui uma avaliação assistiva com leitores de tela.

## Validações pendentes para publicar

- Conectar um projeto Supabase real, aplicar as migrations nesse projeto e repetir os fluxos de autenticação, upload, métricas e reservas com suas permissões finais.
- Confirmar com o responsável endereço, telefone, WhatsApp, horários, cardápio, preços, imagens, eventos, identidade visual e política de privacidade. Os exemplos comerciais permanecem restritos à demonstração.
- Validar o domínio HTTPS e refazer a auditoria Lighthouse e os QR Codes no ambiente hospedado.
- Repetir a inspeção manual de teclado e leitor de tela no site final. O teste atual cobre regras automáticas WCAG A/AA e interações selecionadas por teclado.

A consulta a Instagram, diretórios e BrasilAPI recebeu recusa do proxy neste ambiente. [A ficha de dados](business-data.md) registra as fontes e pendências.
