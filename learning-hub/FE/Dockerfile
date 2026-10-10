# Frontend React (Vite) phục vụ bằng nginx, proxy /api sang backend.
# Build context phải là thư mục learning-hub vì FE dùng chung bộ mẫu phát hiện API key của BE:
#   docker build -f FE/Dockerfile .
# syntax=docker/dockerfile:1

FROM node:22-alpine AS build
WORKDIR /app
COPY FE/package.json FE/package-lock.json ./FE/
RUN cd FE && npm ci
COPY FE/ ./FE/
COPY BE/src/common/security ./BE/src/common/security
# API cùng origin (nginx proxy): không cần CORS, không lộ địa chỉ backend.
ENV VITE_API_URL=/api
RUN cd FE && npm run build

FROM nginx:1.27-alpine AS runtime
COPY FE/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/FE/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=15s --timeout=3s --retries=5 CMD wget -qO- http://127.0.0.1/ >/dev/null || exit 1
