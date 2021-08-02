FROM node:14

WORKDIR /code

COPY www /www

COPY package.json /code/package.json

RUN npm install

COPY src /code

CMD ["node", "--trace-warnings", "--unhandled-rejections=strict", "main.js"]