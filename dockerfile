# Imagem base
FROM node:20

# Criar diretório de trabalho
WORKDIR /calculadora_imc_tmb

# Copiar arquivos
COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3000

# Inicia o servidor
CMD ["node", "server.js"]
