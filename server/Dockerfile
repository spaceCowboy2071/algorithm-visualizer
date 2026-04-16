# ── Stage 1: Build ──
# Start from a small Linux with Node.js 20 pre-installed.
# "alpine" is a tiny Linux distribution (~50MB vs ~900MB for full Linux).
# We use a two-stage build: stage 1 compiles TypeScript, stage 2 runs the result.
# This keeps the final image small — no TypeScript compiler or devDependencies in production.
FROM node:20-alpine AS build

WORKDIR /app

# Copy package files first, THEN install. Docker caches each step — if package.json
# hasn't changed, Docker reuses the cached node_modules instead of reinstalling.
# This makes rebuilds much faster when only source code changes.
COPY package.json package-lock.json ./
RUN npm ci

# Copy source code and compile TypeScript → JavaScript in the dist/ folder
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# ── Stage 2: Production ──
# Start fresh from a clean Node.js image (no leftover build tools or devDependencies).
FROM node:20-alpine

WORKDIR /app

# Only install production dependencies (no devDependencies like vitest, tsx, @types/*)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy the compiled JavaScript from the build stage
COPY --from=build /app/dist ./dist

# Accept the git commit SHA at build time and bake it into the image
# as an environment variable. The CI/CD pipeline passes this via --build-arg.
# Defaults to "dev" for local Docker builds where no SHA is provided.
ARG COMMIT_SHA=dev
ENV COMMIT_SHA=$COMMIT_SHA

# Tell Docker this container listens on port 4000
EXPOSE 4000

# When the container starts, run the compiled server
CMD ["node", "dist/index.js"]
