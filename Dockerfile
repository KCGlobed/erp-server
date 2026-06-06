FROM node:22-alpine AS builder

WORKDIR /app

# Copy package files (handling both npm and yarn)
COPY package.json yarn.lock* package-lock.json* ./

# Install dependencies using yarn or npm based on what's available
RUN if [ -f yarn.lock ]; then yarn install --frozen-lockfile; else npm ci || npm install; fi

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the NestJS application
RUN npm run build

# --- Production Image ---
FROM node:22-alpine

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/package.json ./
COPY --from=builder /app/yarn.lock* ./
COPY --from=builder /app/package-lock.json* ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Expose port (Cloud Run sets the PORT env var dynamically, usually to 8080)
EXPOSE 8080

# Start the application
CMD ["npm", "run", "start:prod"]
