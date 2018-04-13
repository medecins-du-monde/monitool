# We use the nodejs base image to build
FROM node:8 as builder

WORKDIR /app

# Install build dependencies
COPY package.json yarn.lock ./
RUN yarn install

# Build the app
COPY gulpfile.js ./
COPY src ./src
RUN yarn run build

# Switch to the nginx image
FROM nginx:stable

# Retrieve the files that need to be hosted
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html
