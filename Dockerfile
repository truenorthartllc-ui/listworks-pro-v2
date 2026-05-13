FROM node:20-alpine
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./
RUN cd frontend && npm install
COPY frontend/ ./frontend/
RUN cd frontend && npm run build
FROM node:20-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=0 /app/frontend/build ./build
EXPOSE 8080
CMD [\"npx\", \"serve\", \"-s\", \"build\", \"-l\", \"8080\"]
