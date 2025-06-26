FROM node:latest

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm install -y
COPY . .

CMD ["bash", "-c", "node server.js"]
