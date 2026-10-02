GARIMPO DO GIVA — CENTRAL ADMINISTRATIVA V3
===============================================

Esta versão usa:
- Supabase Auth para login
- Supabase PostgreSQL para os produtos
- RLS para proteger os dados
- Publishable Key no navegador
- Nenhuma Secret Key

CONFIGURAÇÃO
------------
1. Abra supabase-config.js.
2. Mantenha a URL que já está preenchida.
3. Cole no campo publishableKey SOMENTE a chave que começa com:
   sb_publishable_
4. Salve.

NÃO coloque:
- sb_secret_
- service_role
- senha do banco

COMO TESTAR
-----------
1. Abra admin.html.
2. Use o e-mail do administrador criado no Supabase.
3. Digite a senha que você criou no Supabase.
4. Entre.
5. Clique em "Novo produto".
6. Cadastre um produto de teste.
7. Confirme que ele aparece na lista.
8. Edite, inative e reative para testar.

IMPORTANTE
----------
A segurança verdadeira não depende de esconder o endereço da página.
Ela depende do Supabase Auth + RLS. Mesmo que alguém descubra a URL da
Central, sem uma sessão autorizada as políticas do banco impedem alterações.

O Score Garimpo desta V3 é o score automático preliminar da V2:
- vendas/demanda: até 30
- nota: até 20
- comissão: até 20
- avaliações: até 15
- preço: até 15

Depois podemos evoluir o score para incluir fatores como apelo visual,
potencial de Reels e solução de problema.
