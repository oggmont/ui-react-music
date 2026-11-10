# syntax=docker/dockerfile:1
#
# Runlist web UI. Three targets:
#   dev   Vite dev server with hot reload; the source is bind-mounted by docker-compose.yml.
#   build Static production bundle (npm run build).
#   prod  nginx serving the bundle and proxying /api to the Spring API. Non-root, port 8080.

ARG NODE_VERSION=26
ARG NGINX_VERSION=1.30

# ---- deps: install exactly what package-lock.json says --------------------------------------------
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# ---- dev: the Vite dev server ---------------------------------------------------------------------
FROM deps AS dev
ENV NODE_ENV=development
COPY . .
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# ---- build: lint and unit tests gate the bundle ---------------------------------------------------
FROM deps AS build
COPY . .
ARG VITE_API_BASE_URL=
ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
RUN npm run lint && npm run test:run && npm run build

# ---- prod: static files behind nginx --------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:${NGINX_VERSION}-alpine AS prod
# Where /api goes. Default: the API container on the shared music-db network.
ENV API_UPSTREAM=http://music-api:8080 \
    NGINX_ENTRYPOINT_LOCAL_RESOLVERS=1
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
