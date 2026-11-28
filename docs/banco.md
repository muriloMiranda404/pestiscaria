# Dados, acesso e continuidade

As migrations em `supabase/migrations` são versionadas. O banco de produção contém categorias, produtos, fotografias e opções, eventos, promoções, galeria, configurações, horários dentro de configurações, QR Codes, eventos de métricas, reservas, cotas e auditoria. Valores monetários são inteiros em centavos. Chaves estrangeiras restringem exclusão de categorias com produtos e de produtos com promoções. Registros ligados a um produto são removidos quando o próprio produto é excluído.

Todas as tabelas de aplicação usam RLS. A leitura pública recebe somente conteúdo publicado, e o servidor filtra categorias vazias e promoções fora da vigência. A gravação exige conta autenticada associada a `admin_profiles`. O bucket `restaurant-media` admite upload WebP por administrador. Reservas e métricas opcionais passam por validação, cotas e funções RPC acionadas pelo servidor. A chave service role é exclusiva do processo servidor. Alterações administrativas ficam em `audit_logs`.

O banco de demonstração é SQLite em `.local/demo.sqlite` ou `DEMO_DB_PATH`. Ele nasce com exemplos fictícios. A redefinição repõe esse catálogo em uma transação, apaga métricas e QR Codes demonstrativos e preserva a separação da produção. Faça cópia do arquivo e da pasta `.local/media` se precisar conservar alterações entre máquinas.

## Retenção

A função `public.purge_expired_data()` remove solicitações de reserva e métricas com mais de 90 dias e registros de auditoria com mais de 365 dias. Agende sua execução diária no Supabase após contratar a instância, ou execute-a periodicamente como serviço operacional com a service role. Monitore seu resultado. A política de privacidade descreve esses prazos como previstos enquanto o agendamento não estiver verificado. Atenda pedidos de acesso ou exclusão conforme a situação concreta e obrigações legais avaliadas pelo responsável. A cópia de segurança também precisa ter prazo de retenção definido com o fornecedor.

## Backup e restauração

Antes de cada migração, faça backup do PostgreSQL com a ferramenta de backup do Supabase ou `pg_dump` usando uma conexão privilegiada guardada em cofre. Copie também os objetos do bucket `restaurant-media`, pois um dump SQL não contém seus bytes. Registre a versão do código, os arquivos de migração aplicados e o horário do backup. Verifique uma restauração em um projeto Supabase separado e confira login, catálogo, imagens e reservas.

Para rollback da aplicação, selecione o deployment anterior compatível e direcione o domínio para ele. Se a migração do banco impedir essa versão de funcionar, restaure o backup em outro projeto e valide o estado antes de trocar as credenciais. Reconcilie solicitações e edições feitas após o backup com o responsável pelo restaurante. A demonstração local pode ser restaurada pelo botão de redefinição do painel, que elimina as alterações da apresentação.
