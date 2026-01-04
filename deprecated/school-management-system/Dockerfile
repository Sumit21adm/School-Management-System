FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose Vite port
EXPOSE 5173

# Start in development mode with host flag to allow external access
CMD ["npm", "run", "dev", "--", "--host"]
