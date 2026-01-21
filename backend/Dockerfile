FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY tsconfig.json ./
COPY src ./src

RUN npm install typescript tsx
RUN npx tsc

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "dist/index.js"]
