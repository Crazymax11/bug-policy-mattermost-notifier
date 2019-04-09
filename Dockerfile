FROM node:10

COPY . .
RUN npm i
CMD ["node", "index.js"]