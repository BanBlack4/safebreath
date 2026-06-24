# Multi-stage build for optimal image size in production
FROM node:22-alpine AS builder

WORKDIR /usr/src/app

# Copy dependency manifests
COPY package*.json ./

# Install absolute dependencies, including devDependencies for compiling code
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build the client spa and the compiled node backend
RUN npm run build

# --- Runtime stage ---
FROM node:22-alpine AS runner

WORKDIR /usr/src/app

# Set production environment flags
ENV NODE_ENV=production
ENV PORT=3000

# Copy manifests to install only production dependencies
COPY package*.json ./

# Install only production dependencies (external packages used by bundled server.cjs)
RUN npm ci --only=production

# Copy built code from the build stage
COPY --from=builder /usr/src/app/dist ./dist

# Expose port 3000
EXPOSE 3000

# Start command
CMD ["npm", "run", "start"]
