FROM node:18-alpine

RUN apk add --no-cache python3 make g++

WORKDIR /app

COPY package*.json ./
RUN npm config set python python3 && npm install --production

COPY . .

RUN mkdir -p /app/data

EXPOSE 5000

CMD ["node", "server.js"]
