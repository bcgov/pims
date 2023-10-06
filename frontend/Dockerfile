#############################################
#                 Dev Build                 #
#############################################
# https://hub.docker.com/layers/library/node/18.16-bullseye-slim/images/
# sha256-8463e2d7bacf0cb576453a0ea8425f3b3c87fa9dd5c8a84ab1908cfd407f3edd?context=explore
FROM node:18.17.1-bullseye-slim as dev

WORKDIR /app
ENV NODE_ENV=development

# Copy files, excluding those in .dockerignore
COPY . .

# Install dependencies and disable npm progress bar
RUN npm set progress=false
RUN npm i

EXPOSE 3000

CMD ["npm", "start"]

#############################################
#                Prod Build                 #
#############################################
FROM node:18.17.1-bullseye-slim as prod-build

# Set the working directory to /app
WORKDIR /app
ENV NODE_ENV=production

# Copy files
COPY ./src ./src
COPY ./public ./public
COPY package.json .
COPY tsconfig.json .
COPY vite.config.js .
COPY ./public/index.html .

EXPOSE 8080

# Npm install packages. Omits dev dependencies when NODE_ENV=production
RUN npm set progress=false
RUN npm i vite@4.4.9 @vitejs/plugin-react@4.0.4 vite-plugin-svgr@3.3.0 vite-tsconfig-paths@4.2.1

# Build the project.
RUN npm run build-ocp

## Stage 2: Nginx state for serving content
FROM nginx:alpine-slim as prod

# copy custom nginx configuration from host to container
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Set working directory to nginx asset directory
WORKDIR /usr/share/nginx/html

# Remove default nginx static assets
RUN rm -rf ./*

# Copy static assets from builder stage
COPY --from=prod-build /app/build .

# Provide nginx directory the required permissions
RUN chmod g+rwx /var/cache/nginx /var/run /var/log/nginx

# Run nginx with global directives and daemon off
ENTRYPOINT ["nginx", "-g", "daemon off;"]
