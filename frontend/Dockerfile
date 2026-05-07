# ListWorks PRO — Frontend Dockerfile (React build + serve)
FROM node:20-alpine AS builder
WORKDIR /app

# Cache deps
COPY package.json yarn.lock* ./
RUN yarn install --frozen-lockfile || yarn install

# Build (REACT_APP_BACKEND_URL is read at build time)
ARG REACT_APP_BACKEND_URL
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL
COPY . .
RUN yarn build

# Serve the built static site
FROM node:20-alpine
WORKDIR /app
RUN yarn global add serve
COPY --from=builder /app/build ./build
ENV PORT=3000
EXPOSE 3000
CMD ["sh", "-c", "serve -s build -l ${PORT:-3000}"]
