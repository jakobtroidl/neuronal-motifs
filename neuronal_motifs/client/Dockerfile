FROM node:16 as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY ./ /app/
RUN npm run build

FROM nginx:1.19
COPY --from=build-stage /app/build/ /usr/share/nginx/html
COPY ./nginx/default.conf /etc/nginx/conf.d/default.conf
EXPOSE 8080