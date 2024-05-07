# Etape de Build
FROM node:alpine as builder

WORKDIR /app

COPY . .

# localhost
ARG REACT_APP_BACK_HOST=127.0.0.1
ARG REACT_APP_BACK_PORT=8080
ARG REACT_APP_HTTP=http

#prod HTTP
# ARG REACT_APP_BACK_HOST=129.151.239.123
# ARG REACT_APP_BACK_PORT=:8080
# ARG REACT_APP_HTTP=http

# #prod HTTPS
# ARG REACT_APP_BACK_HOST=kryptonews.fun
# ARG REACT_APP_BACK_PORT=/back
# ARG REACT_APP_HTTP=https

# ARG REACT_APP_DISCORD_URL=https://discord.com/api/oauth2/authorize?client_id=1176451433000861786&response_type=code&redirect_uri=https%3A%2F%2Fkryptonews.fun%2Fback%2Fapi%2Fauth%2Fdiscord%2Fcallback&scope=identify+email


RUN npm install

RUN npm run build

# Creation du conteneur
FROM nginx:alpine

COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD [ "nginx", "-g", "daemon off;" ]