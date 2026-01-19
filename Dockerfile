# Use a base Node.js image
FROM node:18

# Set the working directory inside the container
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install -g pnpm && pnpm install

# Copy the rest of the application code
COPY . .

# Expose the port and start the backend server
EXPOSE 3000
CMD ["pnpm", "run", "start"]