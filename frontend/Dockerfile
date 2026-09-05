# frontend/Dockerfile
FROM node:20-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Vite bakes VITE_* env vars into the built JS at BUILD time, not
# runtime — they have to arrive as build args, not container env vars.
# These should be the URL the BROWSER will use, not an internal Docker
# hostname (the browser runs on the host machine, outside the Docker
# network) — see docker-compose.yml's frontend build.args for the values.
ARG VITE_API_URL
ARG VITE_SOCKET_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

RUN npm run build

FROM nginx:alpine AS runtime
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
