FROM node:current-alpine
ADD . /app
RUN cd /app && npm i

EXPOSE 80

CMD [ "node", "/app/index.js" ]