FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package.json /app/
RUN npm install

# Copy source code
COPY . /app/

# Expose Vite dev port
EXPOSE 5173

# Start development server
CMD ["npm", "run", "dev"]
