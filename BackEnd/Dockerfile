# Usar imagem base do Node.js
FROM node:20

# Criar diretório de trabalho
WORKDIR /BackEnd

# Copiar os arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install


# Copiar o restante do código
COPY . .

# Expor a porta 3000
EXPOSE 3000

# Iniciar o servidor
CMD ["node", "server.js"]
