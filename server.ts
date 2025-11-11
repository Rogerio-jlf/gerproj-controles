// import { createServer } from 'http';
// import next from 'next';
// import './cron'; // inicia o agendamento ao subir

// const port = parseInt(process.env.PORT || '3000', 10);
// const dev = process.env.NODE_ENV !== 'production';
// const app = next({ dev });
// const handle = app.getRequestHandler();

// app.prepare().then(() => {
//   createServer((req, res) => handle(req, res)).listen(port, () => {
//     console.log(`> Servidor rodando em http://localhost:${port}`);
//   });
// });

import { config } from 'dotenv';
import { resolve } from 'path';

// Carrega o .env ANTES de qualquer outra coisa
config({ path: resolve(process.cwd(), '.env') });

import { createServer } from 'http';
import next from 'next';
import './cron';

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => handle(req, res)).listen(port, () => {
    console.log(`> Servidor rodando em http://localhost:${port}`);
    console.log(
      `[Firebird] Conectando em ${process.env.FIREBIRD_HOST}:${process.env.FIREBIRD_PORT}`,
    );
  });
});
