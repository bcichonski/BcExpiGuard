# CouchDB setup

The app syncs PouchDB (browser) with a self-hosted CouchDB. This page separates what the client code **proves** from what is an **unverified reference** that must be replaced by an export from the live server.

## 1. Facts proven by the client code

Sources: `react-ui/src/persistence/DbProvider.js`, `react-ui/src/constants/constants.js`, `react-ui/src/constants/auth_config.json`.

**Server address.** `REMOTE_API_ADDRESS = https://expiguard.bartq.toh.info/` (a commented-out dev alternative is `http://malina:5984/`). Remote DB URL = address + DB name.

**Databases.**

| Remote DB | Local PouchDB (per user) | Replication filter query params |
|---|---|---|
| `users` | `users_<userId>` | `{ user: <userId> }` |
| `items` | `items_<userId>` | `{ groups: [<groupId>] }` |
| `item_names` | `item_names_<userId>` | `{ groups: [<groupId>] }` |
| `groups` | `groups_<userId>` | `{ users: [<userId>] }` |

`<userId>` is a UUID derived from the user's Auth0 e-mail (`users.js`, `getId`). Currently `groupId == userId`.

**Replication.** Per DB, in this order (`replicate()`):
1. Pull: `remote.replicate.to(local, { filter: 'restrict/restrict', query_params })` - filtered by the design doc `_design/restrict`, filter function `restrict`.
2. Push: `local.replicate.to(remote)` - unfiltered.

The client also writes directly to the remote `items` DB (`putIfNotExists`, `upsert`).

**Document fields the filter must look at** (as written by the client):
- `items` / `item_names`: `groupId` (set to the user id on create; also `userId`). Matched against `query_params.groups`.
- `users`: `_id` is the user id (`userEmail`, `creation_timestamp` also stored). Matched against `query_params.user`.
- `groups`: a `users` array of user ids is implied by the `{ users: [...] }` param; the code in this repo does not show the document shape, so treat it as an assumption.
- `_design/*` documents are ignored by the client when reading.

**Authentication.** Auth0 (`bcexpiguard.eu.auth0.com`, audience `https://expiguard.bartq.toh.info`). The client sends `Authorization: Bearer <JWT access token>` on every PouchDB remote request. CouchDB must therefore accept JWTs issued by that Auth0 tenant (see section 2). No secrets belong in this repo.

**CORS.** Browser requests come from the web app's origin, with the `Authorization` header and PouchDB's usual methods. CORS must allow that origin (the production site origin and `http://localhost:3000` for dev), credentials, methods `GET, PUT, POST, HEAD, DELETE`, and headers `accept, authorization, content-type, origin, referer`.

## 2. UNVERIFIED reference - replace with a live export

> Everything below was reconstructed from the client requirements above. It was **not** read from the live server and may differ from it. Replace it with the real export.

**Design doc:** [`restrict.design-doc.reference.json`](restrict.design-doc.reference.json) - a `_design/restrict` with a `restrict` filter that implements the param semantics in section 1. Open assumptions: how `query_params` arrays arrive in `req.query` (the filter accepts a JSON string or a plain value), and the `groups` document shape.

**Server settings reference** (`local.ini`, names from CouchDB 3.x docs; verify against the real config):

```ini
[chttpd]
authentication_handlers = {chttpd_auth, jwt_authentication_handler}, {chttpd_auth, cookie_authentication_handler}, {chttpd_auth, default_authentication_handler}

[jwt_auth]
required_claims = exp, iss, aud
; roles_claim_name / roles_claim_path as used by the real setup

[jwt_keys]
; rsa:<kid> = <Auth0 tenant public key, PEM>   (public key only)

[httpd]
enable_cors = true

[cors]
origins = https://<production app origin>, http://localhost:3000
credentials = true
methods = GET, PUT, POST, HEAD, DELETE
headers = accept, authorization, content-type, origin, referer
```

**Export the real values** (run as the server owner; keep output free of secrets - strip `[admins]`, passwords and private keys before committing):

```sh
# design doc
curl -s -u <admin> https://expiguard.bartq.toh.info/items/_design/restrict | jq . > doc/couchdb/restrict.design-doc.json
# repeat for users, item_names, groups if their design docs differ

# server config (JWT, CORS, auth handlers)
curl -s -u <admin> https://expiguard.bartq.toh.info/_node/_local/_config | jq '{chttpd, jwt_auth, cors, httpd}' > doc/couchdb/server-config.json
```

Then delete the `*.reference.json` file and this section, and update section 1 if the export disagrees.
