This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

<!-- ----------------------------------------------------------------------------------------------------------- -->

create Materialized View Apontamentos as select
chamado_os, cod_os, dtini_os, hrini_os, hrfim_os, dthrini_apont, dthrfim_apont, respcli_os, obs,
codrec_os, chap.cod_cliente, limmes_tarefa, chap.dat_load, ch.status_chamado,
(select nome_cliente from chamados ch2 where ch2.cod_cliente = chap.cod_cliente limit 1 ) as nome_cliente,
(select nome_recurso from chamados ch3 where ch3.cod_recurso = chap.codrec_os limit 1 ) as nome_recurso
FROM public.chamados_apontamentos chap
Left join public.chamados ch on (ch.cod_chamado = chap.chamado_os)

<!-- ------------------------------------------------------------------------------ -->

CREATE TRIGGER trigger_atualiza_view
AFTER INSERT OR UPDATE OR DELETE
ON tabela_base
FOR EACH STATEMENT
EXECUTE FUNCTION atualizar_view_mat();
$$ REFRESH MATERIALIZED VIEW public.apontamentos $$);

<!-- ------------------------------------------------------------------------------ -->

-- Ativa a extensão de UUID se ainda não estiver criada
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cria a view materializada com coluna `id` única
CREATE MATERIALIZED VIEW public."Apontamentos" AS
SELECT
uuid_generate_v4() AS id,
chamado_os,
cod_os,
dtini_os,
hrini_os,
hrfim_os,
dthrini_apont,
dthrfim_apont,
respcli_os,
obs,
codrec_os,
chap.cod_cliente,
limmes_tarefa,
chap.dat_load,
ch.status_chamado,
(
SELECT nome_cliente
FROM chamados ch2
WHERE ch2.cod_cliente = chap.cod_cliente
LIMIT 1
) AS nome_cliente,
(
SELECT nome_recurso
FROM chamados ch3
WHERE ch3.cod_recurso = chap.codrec_os
LIMIT 1
) AS nome_recurso
FROM public.chamados_apontamentos chap
LEFT JOIN public.chamados ch ON ch.cod_chamado = chap.chamado_os;

<!-- ------------------------------------------------------------------------------ -->

CREATE OR REPLACE FUNCTION atu_view_mat()
RETURNS trigger AS $$
BEGIN
REFRESH MATERIALIZED VIEW CONCURRENTLY Apontamentos;
RETURN NULL;
END;

$$
LANGUAGE plpgsql;

% <!-- ------------------------------------------------------------------------------ -->

CREATE TRIGGER trigger_atualiza_view
AFTER INSERT OR UPDATE OR DELETE
ON chamados_apontamentos
FOR EACH STATEMENT
EXECUTE FUNCTION atu_view_mat();
$$
