# backend/Dockerfile
# NOTE: uses `npm install` rather than `npm ci` because no package-lock.json
# exists in this project yet — run `npm install` locally once to generate
# one, commit it, then switch this to `npm ci --omit=dev` for faster,
# fully-reproducible builds. Left as `install` for now so this Dockerfile
# actually works today.
FROM node:20-slim AS deps
WORKDIR /app
COPY package*.json ./
COPY prisma ./prisma
RUN npm install --omit=dev
# prisma generate only needs the schema file, not a live DB connection —
# safe to run at build time with no secrets present.
RUN npx prisma generate

FROM node:20-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

# bcrypt is a native module — node:20-slim (Debian) usually gets a
# prebuilt binary for it via node-pre-gyp with no extra build tools
# needed. If `npm install` above ever fails specifically on bcrypt,
# add: `RUN apt-get update && apt-get install -y python3 build-essential`
# before the deps stage's npm install, or switch to the pure-JS `bcryptjs`
# package instead.
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

EXPOSE 5000
CMD ["node", "src/server.js"]
