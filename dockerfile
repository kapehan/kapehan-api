FROM node:18-slim

WORKDIR /app

COPY package*.json ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

EXPOSE 3000
CMD ["pnpm", "run", "start"]
