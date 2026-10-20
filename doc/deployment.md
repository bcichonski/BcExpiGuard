# Deployment

BcExpiGuard ships as a container image. The image contains the Express server and the built React app (`react-ui/build`). It listens on port `5000` and serves a health endpoint at `GET /healthz`.

- Image: `ghcr.io/bcichonski/bcexpiguard`
- Tags: `latest` (the current `master`) and `sha-<short>` (one per commit, for rollback)
- Published by [`.github/workflows/docker.yml`](../.github/workflows/docker.yml) on every push to `master`. Pull requests only build the image.
- Build definition: [`Dockerfile`](../Dockerfile). Local run: [`docker-compose.yml`](../docker-compose.yml).

Replace `<your-domain>` in the examples below with the host name the app is served from, for example `bcexpiguard.example.com`. Do not put secrets in the environment or in this repository. The values used here are public SPA settings.

## 1. Run the image

```sh
docker pull ghcr.io/bcichonski/bcexpiguard:latest

docker run -d --name bcexpiguard \
  --restart unless-stopped \
  -p 127.0.0.1:5000:5000 \
  ghcr.io/bcichonski/bcexpiguard:latest
```

If the package is private, log in first with `docker login ghcr.io` using a GitHub token that has `read:packages`.

Publishing the port on `127.0.0.1` only makes the container reachable from the host itself. Put a TLS-terminating reverse proxy in front of it.

### Behind a TLS-terminating proxy

Production runs behind a proxy (for example Caddy, nginx, Traefik or a cloud load balancer) that:

1. terminates TLS for `https://<your-domain>`;
2. forwards requests to `http://127.0.0.1:5000` (or to the container on the same Docker network);
3. sets the `X-Forwarded-Proto` header to the scheme the client used.

The server trusts `X-Forwarded-Proto` (it runs with Express `trust proxy`). HTTPS is enforced by default: a plain-HTTP request is redirected to `https://`, and HSTS and `upgrade-insecure-requests` are sent. The image sets `FORCE_HTTPS=true`, and the server also defaults to it whenever `NODE_ENV=production`. Only expose the container through the proxy. Do not publish port 5000 directly to the internet, because a client could then send a forged `X-Forwarded-Proto: https` header.

Example nginx location (placeholders only):

```nginx
server {
    listen 443 ssl;
    server_name <your-domain>;
    # ssl_certificate / ssl_certificate_key: managed by your certificate tooling

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Run locally with Compose

```sh
docker compose up --build
```

This builds the image from the working tree and serves the app at [http://localhost:5000](http://localhost:5000). Compose sets `FORCE_HTTPS=false`, so local HTTP works. This is the only place HTTPS enforcement is switched off. Never set `FORCE_HTTPS=false` on a production container.

## 2. Environment variables

Build-time values are baked into the JavaScript bundle when the image is built. Runtime values are read by the server when the container starts. Changing a build-time value needs a new image. Changing a runtime value needs only a container restart.

### Runtime (container environment)

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `PORT` | `5000` | Port the server listens on inside the container. |
| `FORCE_HTTPS` | `true` (image and any `NODE_ENV=production` run) | HTTPS redirect, HSTS and `upgrade-insecure-requests`. Only the exact value `false` turns them off, for plain-HTTP local runs such as Compose. |
| `VITE_AUTH0_DOMAIN` | from `react-ui/.env.production` | Used only to build the Content-Security-Policy (`connect-src`, `frame-src`). |
| `VITE_COUCH_URL` | from `react-ui/.env.production` | Used only to build the Content-Security-Policy (`connect-src`). |

Runtime values are used only for the CSP. Set them to the same values as the build-time ones. Otherwise the CSP and the bundle disagree.

### Build time (`docker build --build-arg`)

| Variable | Purpose |
| :--- | :--- |
| `VITE_COUCH_URL` | CouchDB server URL, with protocol and trailing slash. |
| `VITE_AUTH0_DOMAIN` | Auth0 tenant domain, for example `<tenant>.<region>.auth0.com`. |
| `VITE_AUTH0_CLIENT_ID` | Auth0 SPA application client ID (public). |
| `VITE_AUTH0_AUDIENCE` | Auth0 API audience identifier. |

Each build argument is optional. When it is not set, the value comes from [`react-ui/.env.production`](../react-ui/.env.production). To build an image for a different environment:

```sh
docker build -t bcexpiguard:<your-tag> \
  --build-arg VITE_COUCH_URL=https://<your-couch-host>/ \
  --build-arg VITE_AUTH0_DOMAIN=<your-tenant>.auth0.com \
  --build-arg VITE_AUTH0_CLIENT_ID=<your-spa-client-id> \
  --build-arg VITE_AUTH0_AUDIENCE=https://<your-api-audience> \
  .
```

## 3. Updating to a new master image

Pull the new image and recreate the container:

```sh
docker pull ghcr.io/bcichonski/bcexpiguard:latest
docker stop bcexpiguard && docker rm bcexpiguard
docker run -d --name bcexpiguard --restart unless-stopped \
  -p 127.0.0.1:5000:5000 \
  ghcr.io/bcichonski/bcexpiguard:latest
```

With Watchtower or a similar tool, the same pull-and-restart happens automatically. Those tools are optional and not configured by this repository.

**Rollback:** every master build also has a `sha-<short>` tag. Find the commit you want, then run that tag in place of `latest`:

```sh
docker run -d --name bcexpiguard --restart unless-stopped \
  -p 127.0.0.1:5000:5000 \
  ghcr.io/bcichonski/bcexpiguard:sha-<short>
```

## 4. Health check

- The image has a `HEALTHCHECK` that requests `http://127.0.0.1:<PORT>/healthz` every 30 seconds.
- `GET /healthz` returns `200` with `{"status":"ok"}`. It is answered before the HTTPS redirect, so plain-HTTP probes always succeed.

```sh
curl -i http://127.0.0.1:5000/healthz
docker inspect --format '{{.State.Health.Status}}' bcexpiguard
```

The second command prints `healthy` or `unhealthy`. Point your load balancer or uptime monitor at `https://<your-domain>/healthz`.

## 5. Auth0 checklist

The app sends `redirect_uri = window.location.origin`, so Auth0 must accept the origin the app is served from. This is a setting in the Auth0 tenant, not in this repository. For the SPA application (client ID as in `VITE_AUTH0_CLIENT_ID`), go to **Applications → Applications → <application> → Settings** and add the new origin `https://<your-domain>` to:

- [ ] **Allowed Callback URLs**
- [ ] **Allowed Logout URLs**
- [ ] **Allowed Web Origins**

Include the scheme and no trailing slash. Add `http://localhost:5000` as well if you test the container locally. Save the changes. Use the same origin in every field.

## 6. CouchDB CORS checklist

The browser syncs PouchDB with the CouchDB server directly, so CouchDB must allow the app's origin.

- [ ] In the CouchDB server configuration (`local.ini`), add the new origin to `[cors] origins`, for example `origins = https://<your-domain>, http://localhost:3000`. Keep the existing entries and the `credentials`, `methods` and `headers` settings.
- [ ] Restart CouchDB if your setup needs it.

The server-side setup, including the JWT and CORS settings, is described in [`doc/couchdb/README.md`](couchdb/README.md). This repository does not change the live CouchDB configuration.

## 7. Content-Security-Policy

The server sends a CSP header with its responses. The origins come from the configuration, not from hard-coded values:

| Directive | Allowed sources |
| :--- | :--- |
| `default-src`, `script-src`, `worker-src`, `manifest-src`, `base-uri` | `'self'` |
| `style-src` | `'self' 'unsafe-inline'` (MUI/Emotion injects styles at runtime) |
| `font-src` | `'self' data:` |
| `img-src` | `'self' data: https:` (Auth0 user avatars come from various HTTPS hosts) |
| `connect-src` | `'self'`, the origin of `VITE_AUTH0_DOMAIN`, the origin of `VITE_COUCH_URL` |
| `frame-src` | the origin of `VITE_AUTH0_DOMAIN` (Auth0 silent-auth iframe) |
| `object-src` | `'none'` |
| `frame-ancestors` | `'none'` |

The two origins are read from the runtime `VITE_AUTH0_DOMAIN` and `VITE_COUCH_URL` at startup. If they are not set, the server reads them from `react-ui/.env.production`. If an origin is still missing, the server logs an error and omits that origin. The browser then blocks Auth0 or CouchDB requests, and the console shows a CSP violation. Check the runtime values first when this happens.

## 8. Troubleshooting

- **Login loops or Auth0 "callback URL mismatch":** the origin is missing from the Auth0 Allowed lists (section 5).
- **Sync fails with CORS errors:** the origin is missing from CouchDB `[cors] origins` (section 6).
- **Console shows `Refused to connect` or similar CSP errors:** the runtime `VITE_*` values do not match the build, or are missing (section 7).
- **Container is `unhealthy`:** check `docker logs bcexpiguard`. The server logs the port and whether HTTPS enforcement is on.
