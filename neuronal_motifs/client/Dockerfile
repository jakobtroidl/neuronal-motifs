FROM node:12 as build-stage
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY ./ /app/
RUN npm run build

FROM nginx:1.17
COPY --from=build-stage /app/build/ /usr/share/nginx/html
EXPOSE 80