FROM node:18-bullseye-slim AS build
WORKDIR /app

# Copiar definições de dependências
COPY package.json ./

# Garantir instalação de devDependencies mesmo que NODE_ENV seja injetado como production
ENV NODE_ENV=development
RUN npm install --legacy-peer-deps --include=dev --no-package-lock

# Copiar restante do código
COPY . .

# Build da aplicação
RUN npm run build

# Stage de produção minimalista com nginx
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
