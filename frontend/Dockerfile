FROM node:22-alpine AS base

FROM base AS build
COPY frontend/ ./app/
COPY contracts/deployments/ ./contracts/deployments/
WORKDIR /app
RUN npm ci
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=build /app/dist /usr/share/nginx/html
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
