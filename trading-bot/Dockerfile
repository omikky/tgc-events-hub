# Minimal image to run the trading bot as an always-on process.
FROM node:22-slim

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json* ./
RUN npm ci || npm install

# App source.
COPY . .

# The bot reads configuration from environment variables (see .env.example).
# In production, pass them with `docker run --env-file .env ...` or your
# platform's secrets manager — do NOT bake secrets into the image.
ENV NODE_ENV=production

CMD ["npm", "run", "bot"]
