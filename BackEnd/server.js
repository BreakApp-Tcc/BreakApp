const express = require('express');
const session = require('express-session');
const userRoutes = require('./routes/user');
const alimentosRoutes = require('./routes/alimentos');
const path = require('path');

const app = express();

app.use(session({
    secret: 'mysecretkey',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apenas redirecionando a raiz para /login
app.get('/', (req, res) => {
    res.redirect('/login');
});

// Configuração da pasta estática
app.use(express.static(path.join(__dirname, '../Frontend/refeicao')));
app.use(express.static(path.join(__dirname, '../Frontend/Login e Cadastro'), {
    setHeaders: (res, path) => {
        if (path.endsWith('.html')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        }
        if (path.endsWith('.js')) {
            res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
        }
        if (path.endsWith('.css')) {
            res.setHeader('Content-Type', 'text/css; charset=utf-8');
        }
    }
}));

// Rota para o login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Login e Cadastro/login/login.html'));
});

// Rota de cadastro
app.get('/cadastrar', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Login e Cadastro/register/register.html'));
});

// Rota de cadastro 2
app.get('/register-page2', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend/Login e Cadastro/register/register-page2.html'));
});

// Rota pagina refeiçõs
app.get('/refeicoes', (req, res) => {
    res.type('html');
    res.sendFile(path.join(__dirname, '../Frontend/refeicao/refeicao.html'));
});

// Usando as rotas para usuários e alimentos
app.use('/api/user', userRoutes);
app.use('/api/alimentos', alimentosRoutes);

// Rodando o servidor
app.listen(3000, () => console.log('Servidor rodando na porta 3000'));