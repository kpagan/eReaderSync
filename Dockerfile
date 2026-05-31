ARG NODE_VERSION=24.16.0
FROM node:${NODE_VERSION}-alpine AS builder
WORKDIR /app

# Install dependencies (including dev deps needed for build)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source and build distributable into /app/dist
COPY . .
RUN npm run build

FROM node:${NODE_VERSION}-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Install only production deps
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy built distributable and uploads from builder
# COPY ./dist /app/dist
COPY --from=builder /app/dist ./dist
# COPY --from=builder /app/uploads ./uploads

# Expose uploads as a volume so host can mount it
VOLUME ["/app/uploads"]

# App listens on port 3000
EXPOSE 3000

# Entrypoint: run the distributable server
ENTRYPOINT ["node", "dist/server.js"]
