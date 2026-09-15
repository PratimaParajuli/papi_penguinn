# Papi Penguin deployment

## Local development

1. Copy `.env.example` to `.env` and replace `JWT_SECRET` with a long random value.
2. Start the API: `npm.cmd run dev:server`.
3. Start the client in another terminal: `npm.cmd run dev`.

## Production

Deploy the whole repository as one Node/Express service. The frontend and API must use the same public origin because the session is stored in an HttpOnly cookie.

Set `NODE_ENV=production`, set `JWT_SECRET` to a long random value, and optionally set `PORT` through your host's environment settings. Then run:

```sh
npm run build
npm start
```

Express serves both the compiled React site and its API. The starter data store is `data/store.json`; use a managed database before scaling across multiple server instances.

The server creates the `data` directory automatically on first startup. If the host uses an ephemeral filesystem, replace the JSON store with a managed database or persistent volume before relying on accounts in production.
