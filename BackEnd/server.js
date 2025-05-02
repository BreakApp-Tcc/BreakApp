const express = require('express');
const session = require('express-session');
const userRoutes = require('./routes/user');
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

app.get('/home', (req, res) => {
    if (req.session.loggedin) {
        res.send(`Bem-vindo, ${req.session.usuario}!`);
    } else {
        res.redirect('/login');
    }
});

app.use(express.static(path.join(__dirname, 'FrontEnd')));

app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'FrontEnd/Login/Login.html'));
});

app.get('/cadastrar', (req, res) => {
    res.sendFile(path.join(__dirname, 'FrontEnd/register/register.html'));
});
app.get('/register-page2', (req, res) => {
    res.sendFile(path.join(__dirname, 'FrontEnd/register/register-page2.html'));
});


app.use('/api/user', userRoutes);

app.listen(3000, () => console.log('Servidor rodando na porta 3000'));