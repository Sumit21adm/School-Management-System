FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose API port
EXPOSE 3001

# Start in development mode (can be changed to start:prod)
CMD ["npm", "run", "start:dev"]
