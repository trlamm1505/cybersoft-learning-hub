# Backend NestJS. Build context phải là thư mục learning-hub (xem docker-compose.yml):
#   docker build -f BE/Dockerfile .
# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app/BE
COPY BE/package.json BE/package-lock.json ./
RUN npm ci
COPY BE/ ./
# Prisma client (code cũ còn import kiểu của nó) rồi build, sau đó bỏ devDependencies.
RUN npx prisma generate && npm run build && npm prune --omit=dev

FROM node:22-alpine AS runtime
# python3: chạy bài Python của học viên (PYTHON_SANDBOX=local trong container, đã có
# AST guard + timeout + giới hạn bộ nhớ); tini: dọn tiến trình con, bắt tín hiệu dừng.
RUN apk add --no-cache python3 tini
ENV NODE_ENV=production \
    PORT=3000 \
    PYTHON_SANDBOX=local
WORKDIR /app/BE
COPY --from=build /app/BE/node_modules ./node_modules
COPY --from=build /app/BE/dist ./dist
COPY BE/package.json ./
COPY BE/assets ./assets
RUN mkdir -p uploads/tester-labs && chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=5s --start-period=40s --retries=5 \
  CMD wget -qO- http://127.0.0.1:3000/api/health | grep -q '"status":"ok"' || exit 1
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main"]
