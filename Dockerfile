FROM node:22-bookworm AS build
WORKDIR /app
COPY frontend/package*.json ./frontend/
RUN npm ci --prefix frontend
COPY frontend ./frontend
RUN npm run build --prefix frontend
COPY backend/package*.json ./backend/
RUN npm ci --prefix backend --omit=dev

FROM node:22-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production PORT=3001
COPY --from=build /app/backend/node_modules ./backend/node_modules
COPY backend ./backend
COPY database ./database
COPY --from=build /app/frontend/dist ./frontend/dist
USER node
EXPOSE 3001
CMD ["node", "backend/server.js"]
