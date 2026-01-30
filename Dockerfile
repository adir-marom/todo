# Build stage
FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:22-alpine AS production

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

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

# Start the server
CMD ["npm", "start"]
