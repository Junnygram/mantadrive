FROM node:18-alpine AS builder

# Set the working directory in the container
WORKDIR /app

# Copy over the package.json content and package-lock.json file to the container
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application over to the container
COPY . .

# Build the Next.js application
RUN npm run build

# Production image
FROM node:18-alpine
WORKDIR /app

# Copy package.json and built files from builder stage
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.mjs ./

# Install only production dependencies
RUN npm ci --only=production

# Expose the port on which the app runs
EXPOSE 3000

# Start the application in production mode
CMD ["npm", "run", "start"]
