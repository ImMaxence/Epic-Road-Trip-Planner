# syntax=docker/dockerfile:1.7
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY . .
ARG VITE_SITE_URL=https://tripplanner.mbonnici.fr
ENV VITE_SITE_URL=${VITE_SITE_URL}
RUN npm run build

FROM nginx:1.30-alpine AS runtime
RUN rm /etc/nginx/conf.d/default.conf && mkdir -p /etc/nginx/snippets /var/cache/nginx/tiles
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build/client /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=4s --start-period=10s --retries=3 CMD wget -qO- http://127.0.0.1/healthz >/dev/null || exit 1
