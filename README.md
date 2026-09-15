# Papi Penguin

Papi Penguin is a personal productivity app built with React, Vite, Express, and a small JSON data store.

## Run locally

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env` and set a private `JWT_SECRET`.
3. Start the frontend and API together with `npm run dev`.
4. Open the Vite URL shown in the terminal, normally `http://localhost:5176`.

Useful commands:

```sh
npm run dev       # frontend plus API with file watching
npm run build     # production client build
npm start         # serve dist and the API from Express
npm run preview   # preview the Vite production build
```

## Project map

- `src/App.jsx`: authentication UI, page switching, tasks, routines, focus timer, calendar menus, and progress analytics.
- `src/styles.css`: light/dark theme tokens, layout, responsive rules, forms, dropdowns, calendars, and reward overlay.
- `src/main.jsx`: React entry point; mounts `App` and imports the global stylesheet.
- `server/index.js`: Express server, authentication endpoints, JWT protection, and account data persistence.
- `data/store.json`: local account data. It is ignored by Git and is created/updated at runtime.
- `vite.config.js`: React plugin and local `/api` proxy to port `3001`.
- `DEPLOYMENT.md`: production deployment notes.

## Data ownership

Tasks belong to the authenticated user and are saved through the REST task endpoints. Routines are saved through `PUT /api/data`.
Progress history and the selected theme are currently browser-local, using `localStorage`.
The server stores passwords as bcrypt hashes and sends short-lived JWT sessions to the client.

Tasks also expose REST endpoints: `GET /api/tasks`, `POST /api/tasks`, `PUT /api/tasks/:taskId`, and `DELETE /api/tasks/:taskId`. All require the JWT bearer token and only operate on the signed-in user's tasks.

## Where to make common changes

- Add task fields or task behavior in `src/App.jsx`, then update the task form and `server/index.js` validation if needed.
- Change colors or spacing in the theme variables at the top of `src/styles.css`.
- Change authentication or persistence in `server/index.js`.
- Change navigation pages in the main navigation and the `page === ...` sections in `src/App.jsx`.
- Change progress calculations in the `rangeSummary` and `progressTrend` blocks in `src/App.jsx`.

## Production notes

Set a long random `JWT_SECRET` and a production `PORT`. Express serves the compiled `dist` folder when running `npm start`.
The JSON store is suitable for local use and small demos; use a managed database before running multiple server instances.
