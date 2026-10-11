/**
 * Express API server for the Henna Design Hub.
 * Dev default port 4000 (web runs on 3000).
 */

import express from 'express';

const app = express();

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api', (_req, res) => {
  res.send({ message: 'Welcome to the henna-hub api!' });
});

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log(`Henna Hub API listening at http://localhost:${port}`);
});
server.on('error', console.error);