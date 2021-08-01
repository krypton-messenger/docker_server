FROM node:14

WORKDIR /code

COPY src/package.json /code/package.json

RUN npm install

COPY src /code

CMD ["node", "main.js"]