# Coffee Leaders

## Configuration

Copy environment templates and adjust for your machine or server:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
```

| Variable | Purpose |
|----------|---------|
| `PORT` | Frontend development server port (default `3100`) |
| `PUBLIC_URL` | Optional URL for the development server |
| `BACKEND_PORT` / `REACT_APP_API_PROXY` | Where `/api` is proxied during development |
| `BACKEND_HOST` | Backend bind address; defaults to `127.0.0.1` |

The frontend uses relative `/api` URLs, so a production domain does not need to be embedded in the frontend build. `CORS_ORIGIN` is only needed if the browser calls the API from a different origin; same-origin `/api` proxying does not need CORS.

## Production deployment

Production serves the static React build through Nginx and keeps the API on loopback. Do not run the Create React App development server as the public production frontend.

1. Point an A record for the chosen hostname to the server's public IP.
2. Build the frontend and backend:

   ```bash
   npm ci
   npm run build
   npm --prefix backend ci
   npm --prefix backend run build
   ```

3. Keep the production `backend/.env` and its `DATABASE_URL` pointed at the existing SQLite database. Back up and preserve that database file during deployment.
4. Start the backend with `pm2 start ecosystem.production.config.js` and save the PM2 process list with `pm2 save`.
5. Configure Nginx from [deploy/nginx.conf.example](deploy/nginx.conf.example). Update the hostname, build path, and certificate paths. Obtain the TLS certificate before enabling the final HTTPS server block.
6. Install [deploy/coffee-leaders-access.conf.example](deploy/coffee-leaders-access.conf.example) as `/etc/nginx/snippets/coffee-leaders-access.conf` and replace its default `deny all` with the approved VPN, SSO, or allowlist policy. The include is required and protects both the UI and API.
7. Allow inbound TCP `80` and `443` for Nginx. Do not expose `3100` or `3011` publicly; the API binds to `127.0.0.1:3011` by default.

The Nginx template uses the same hostname for the UI and `/api`, and redirects HTTP to HTTPS. If access must be internal-only, configure internal DNS or VPN access as well as the Nginx gate. The existing `ecosystem.config.js` remains for development; production uses `ecosystem.production.config.js`.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
