FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json tsconfig.json prisma ./
RUN npm install
COPY src ./src
RUN npm run build && npm run prisma:generate

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY prisma ./prisma
COPY package*.json ./
ENV NODE_ENV=production
CMD ["node", "dist/index.js"]
