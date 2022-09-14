FROM node:16.16.0-alpine

WORKDIR /vtsApp

COPY package.json ./

RUN npm install

COPY . /vtsApp

EXPOSE 8080

CMD ["npm", "start"]
