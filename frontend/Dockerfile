FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig*.json vite.config.ts .eslintrc.cjs ./
COPY src ./src
COPY public ./public
RUN npm install && npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY public/manifest.webmanifest /usr/share/nginx/html/manifest.webmanifest
COPY public/sw.js /usr/share/nginx/html/sw.js
COPY public/offline.html /usr/share/nginx/html/offline.html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
