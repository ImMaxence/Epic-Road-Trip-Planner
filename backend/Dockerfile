FROM node:21-alpine

WORKDIR /app

COPY package*.json .

COPY . .

RUN npm install --production
# RUN npm i

EXPOSE 8080

CMD ["npm", "start"]
