# Use Node.js 22 slim as the base image
FROM node:24-slim

# Set working directory
WORKDIR /app

# Copy package files first for better Docker layer caching
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy the rest of the application code (excluding files in .dockerignore)
COPY . .

# Accept build arguments
ARG FIREBASE_API_KEY
ARG BUILD_VERSION

# Create production environment file
RUN echo "NEXT_PUBLIC_FIREBASE_KEY=${FIREBASE_API_KEY}" > .env.production && \
    echo "NEXT_PUBLIC_BUILD_VERSION=${BUILD_VERSION}" >> .env.production

# Build the Next.js app
RUN npm run build

# Create non-root user for security (Cloud Run best practice)
RUN groupadd -r appuser && useradd -r -g appuser appuser
RUN chown -R appuser:appuser /app
USER appuser

# Cloud Run uses PORT environment variable, so we expose it dynamically
EXPOSE $PORT

# Set environment variables optimized for Cloud Run
ENV NODE_ENV=production
ENV PATH="/app/venv/bin:$PATH"

# Cloud Run requires listening on 0.0.0.0 and using PORT env variable
CMD ["sh", "-c", "npm start -- --port=${PORT:-3000} --hostname=0.0.0.0"]
