# Use a imagem oficial do Node.js como base
FROM node:20-alpine

# Defina o diretório de trabalho
WORKDIR /nodelogin

# Copie o package.json e package-lock.json para instalar as dependências
COPY package*.json ./

# Instale as dependências
RUN npm install --production

# Copie todo o restante dos arquivos
COPY package*.json ./

# Expor a porta que o app irá rodar
EXPOSE 3000

# Comando para iniciar a aplicação
CMD ["node", "nodelogin.js"]