FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy backend package files
COPY backend/package*.json ./backend/

# Install backend dependencies
WORKDIR /app/backend
RUN npm install --production

# Copy backend files
COPY backend/ .

# Copy app and website static files
WORKDIR /app
COPY app/ ./app/
COPY website/ ./website/

# Expose port
EXPOSE 5000

# Set working directory to backend
WORKDIR /app/backend

# Start the application
CMD ["node", "server.js"]
