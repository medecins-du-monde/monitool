###################################
# Builder stage
###################################

# We use the nodejs base image to build
FROM node:8 as builder

WORKDIR /app

# Install build dependencies
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Build the app
COPY webpack.config.js ./
COPY src ./src
RUN yarn run build

###################################
# Production stage
###################################

# Switch to the nginx image
FROM fholzer/nginx-brotli

# Retrieve the files that need to be hosted
COPY --from=builder /app/dist /usr/share/nginx/html
