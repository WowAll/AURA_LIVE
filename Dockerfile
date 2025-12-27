# Production stage
FROM oven/bun:1-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
RUN bun install --production

# Copy built application (pre-built locally)
COPY dist ./dist

# Expose port
EXPOSE 3001

# Start the application
CMD ["bun", "run", "start"]
