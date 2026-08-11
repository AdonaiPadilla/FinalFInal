# Imagen base: Node.js versión LTS, variante "slim" (más ligera)
FROM node:20-slim

# Carpeta de trabajo dentro del contenedor
WORKDIR /app

# Copiamos primero SOLO los archivos de dependencias
# (esto aprovecha el cache de Docker: si no cambian, no reinstala todo cada vez)
COPY package*.json ./

# Instala las dependencias de producción
RUN npm install --omit=dev

# Ahora sí copiamos el resto del código
COPY . .

# Puerto que expone el contenedor (informativo, Railway lo detecta solo)
EXPOSE 3000

# Comando para arrancar la app (producción, NO nodemon)
CMD ["node", "src/server.js"]