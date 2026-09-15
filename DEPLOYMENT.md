# Papi Penguin deployment

## Local development

1. Copy `.env.example` to `.env` and replace `JWT_SECRET` with a long random value.
2. Start the API: `npm.cmd run dev:server`.
3. Start the client in another terminal: `npm.cmd run dev`.

## Production

Set `JWT_SECRET` and optionally `PORT` through your host's environment settings. Then run:

```sh
npm run build
npm start
```

Express serves both the compiled React site and its API. The starter data store is `data/store.json`; use a managed database before scaling across multiple server instances.
