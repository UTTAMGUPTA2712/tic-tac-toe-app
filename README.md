# Tic-Tac-Toe Web App

Frontend for the Nakama-powered multiplayer Tic-Tac-Toe game.

## Environment Configuration

Create `.env` from `.env.example` and set your backend:

- `REACT_APP_NAKAMA_HOST`
- `REACT_APP_NAKAMA_PORT`
- `REACT_APP_NAKAMA_USE_SSL` (`true` or `false`)
- `REACT_APP_NAKAMA_SERVER_KEY`

## Local Run

1. Install dependencies: `npm install`
2. Configure environment values in `.env`
3. Start app: `npm start`
4. Open: `http://localhost:3000`

## Build

- `npm run build`

## Hosting Checklist (Web)

- [ ] Production `.env` points to public Nakama URL
- [ ] `REACT_APP_NAKAMA_USE_SSL=true` for HTTPS deployments
- [ ] CORS/network rules allow frontend origin to access Nakama
- [ ] App builds cleanly with `npm run build`
- [ ] Multiplayer flow validated with two real users/devices
- [ ] Deploy static build to Vercel/Netlify/GitHub Pages
- [ ] Add public live URL here after deploy

## Live App

- Add your deployed URL here: `https://<your-app-domain>`