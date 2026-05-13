FROM node:20
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build
RUN npm install -g serve
EXPOSE 8080
CMD ["npx", "serve", "-s", "build", "-l", "8080"]
