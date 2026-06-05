FROM node:20-slim

# Set working directory
WORKDIR /usr/src/app

# Copy dependency definitions
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Expose API port
EXPOSE 5001

# Command to run the application
CMD [ "node", "server.js" ]
