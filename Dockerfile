FROM node:10 as builder
COPY . /src
RUN cd /src && npm i

FROM node:10-alpine
COPY --from=builder /src .
CMD ["node", "index.js"]