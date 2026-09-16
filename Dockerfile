# Build backend
FROM node:22-alpine AS backend-builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Build frontend
FROM node:22-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm install

COPY frontend/ .
RUN npm run build

# Production
FROM node:22-alpine

RUN apk add --no-cache nginx

WORKDIR /app

# Backend
COPY package*.json ./
RUN npm ci

COPY --from=backend-builder /app/prisma ./prisma
RUN npx prisma generate

COPY --from=backend-builder /app/dist ./dist

# Frontend
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/next.config.ts ./frontend/
RUN cd frontend && npm install --omit=dev

# Nginx config — single port, proxy to backend and frontend
RUN mkdir -p /run/nginx
COPY <<'NGINX' /etc/nginx/http.d/default.conf
server {
    listen 3000;

    location /api/ {
        proxy_pass http://127.0.0.1:4000/api/;
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://127.0.0.1:4001;
        proxy_set_header Host $host;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX

EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && PORT=4000 node dist/main.js & cd frontend && npx next start -p 4001 & nginx -g 'daemon off;' & wait"]
