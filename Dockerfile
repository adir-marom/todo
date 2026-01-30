# Build stage - Use Node 20 (Node 22 has npm exit handler bugs in Alpine)
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package.json only (not lock file to avoid private registry refs)
COPY package.json ./

# Use yarn instead of npm (more reliable in Alpine containers)
RUN yarn install --registry https://registry.npmjs.org/

# Copy source code
COPY . .

# Build the application
RUN yarn build

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Copy package.json only
COPY package.json ./

# Install only production dependencies with yarn
RUN yarn install --production --registry https://registry.npmjs.org/

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Copy server files and scripts
COPY server.js ./
COPY db.js ./
COPY scripts ./scripts

# Expose port
EXPOSE 3001

# Set environment
ENV NODE_ENV=production
ENV PORT=3001

# Start the server directly with node (better signal handling than npm)
CMD ["node", "server.js"]
