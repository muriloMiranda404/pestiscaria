# Hospedagem e custos

## Apresentação comercial

Para uma apresentação em máquina Node com volume gravável, inicie o projeto com `APP_MODE=demo` seguindo o README. O SQLite, as imagens enviadas e o material da sessão da demonstração precisam desse volume. O diretório de trabalho da máquina na nuvem atende a esse fluxo. Preserve uma cópia do volume para manter alterações entre reinicializações. Restrinja o acesso do preview ao público convidado. O bloqueio de indexação é um complemento ao controle de acesso.

## Site do restaurante

1. Obtenha aprovação do proprietário para o domínio, os dados comerciais, as imagens e as condições de hospedagem. Escolha uma região compatível com os requisitos de privacidade do estabelecimento.
2. Crie um projeto Supabase dedicado à produção. Execute as migrations versionadas na ordem indicada e configure o primeiro administrador conforme a documentação do banco. Exija HTTPS no domínio e nos retornos de autenticação.
3. Cadastre as variáveis de produção do arquivo `.env.example` no cofre da hospedagem. Mantenha a credencial privilegiada acessível exclusivamente no servidor e o modo de produção ativo. Preencha `NEXT_PUBLIC_SITE_URL` com a origem HTTPS definitiva que aparecerá em links compartilhados, canônicos e QR Codes.
4. Na Vercel, importe o repositório como aplicação Next.js com Node 24 e a raiz do projeto. Use `npm ci` e `npm run build`. Separe Preview de Production tanto nas credenciais quanto no banco. Mantenha previews restritos e com domínio separado. Para instalações em servidor Node, após o build execute `npm run start` atrás de HTTPS. A produção usa Supabase para mídia e registros.
5. Em homologação, valide login do administrador, publicação e retirada de uma ficha, upload de mídia, consentimento, resposta às reservas conforme a configuração e leitura do QR por um telefone. Remova os registros de teste desse ambiente. Teste backup e restauração antes de habilitar dados de clientes.
6. Com autorização de publicação, associe o domínio ao deployment verificado. Confira o redirecionamento HTTPS, os canônicos, `/sitemap.xml` e `/robots.txt`. Envie o sitemap pelo Search Console após comprovar propriedade do domínio e confira nome, endereço e telefone no Perfil da Empresa no Google.
7. Guarde o identificador da versão publicada e o backup que precede mudanças de schema. Para recuperar a aplicação, redirecione o domínio para o último deployment compatível. Quando houver incompatibilidade de schema, restaure o backup em projeto separado, verifique dados e Storage e só então altere a conexão. Reconcilie reservas e edições posteriores ao backup antes da troca.

## Orçamento indicativo

Estimativa em dólares americanos para uma unidade, um responsável técnico, um projeto de produção, pequena galeria e tráfego dentro das franquias. Os valores abaixo são premissas de planejamento. Revalide a oferta vigente, tributos, câmbio e cobrança por excedentes no momento da contratação.

| Componente | Orçamento para comparação | Condições |
| --- | ---: | --- |
| Preview na máquina de desenvolvimento existente | US$ 0 adicional em fornecedores externos | Usa recursos já disponíveis nesse ambiente. |
| Hospedagem Next.js comercial | Cerca de US$ 20/mês como premissa para um assento Vercel Pro | O Hobby destina-se a uso pessoal e não comercial. Verifique os termos vigentes do plano escolhido, franquias de execução, tráfego e transformações de imagens. |
| Banco, Auth e Storage gerenciados | Cerca de US$ 25/mês como premissa para uma organização Supabase Pro com um projeto Micro | As franquias são compartilhadas por organização. Mais projetos, armazenamento, tráfego ou recursos de recuperação podem elevar a conta. |
| Domínio próprio | Reserva de R$ 40–80/ano | Estimativa para um domínio disponível. O valor depende da extensão, registrador e prazo. |
| Estimativa inicial da operação | Cerca de US$ 45/mês, mais domínio | Exclui tributos, câmbio, excedentes, monitoramento contratado e trabalho de suporte. |

A documentação de cobrança do Supabase consultada no repositório oficial informa franquias do Free de 500 MB de banco por projeto e 5 GB de saída por organização. O Free admite pausa em projetos inativos. Nos planos pagos, a documentação de compute informa US$ 10/mês de crédito por organização para cobrir um projeto Micro. O responsável deve conferir disponibilidade contratual, retenção de backups e limites antes de aceitar o plano. Configure alertas e os controles de gasto oferecidos pelo fornecedor antes de abrir o site.

Em 27 de novembro de 2026, a rede do ambiente recusou a conexão direta às páginas comerciais da Vercel, do Supabase e do Registro.br. As duas páginas de documentação do Supabase abaixo puderam ser consultadas no repositório mantido pelo provedor. A estimativa de preço-base depende de uma cotação atual.

- Condições de uso e oferta comercial. [Vercel Hobby](https://vercel.com/docs/plans/hobby) · [Vercel Pro](https://vercel.com/docs/plans/pro-plan) · [Termos da Vercel](https://vercel.com/legal/terms)
- Franquias e custos por organização e projeto. [Documentação de cobrança consultada](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/platform/billing-on-supabase.mdx) · [Documentação de compute consultada](https://github.com/supabase/supabase/blob/master/apps/docs/content/guides/platform/manage-your-usage/compute.mdx) · [Preços do Supabase](https://supabase.com/pricing)
- Tarifas de registro de domínio. [Registro.br](https://registro.br/dominio/precos/)
