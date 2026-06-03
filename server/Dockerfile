FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npx tsc

EXPOSE 4000
CMD ["node", "dist/index.js"]
