const mysql = require('mysql2')
const express = require('express');
const bcrypt = require('bcryptjs')
const session = require('express-session');
const path = require('path');

// conexão ao banco
const pool = mysql.createPool({
    host: 'mysql_db',
    user: 'root',
    password: 'root',
    database: 'nodelogin',
    port: 3306
});

//inicializando express
const app = express();

// modulos
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'static')));

app.get('/', function(request, response) {
    response.sendFile(path.join(__dirname + '/LoginCadastro/Login/Login.html'));
});

app.get('/cadastro', function(request, response) {
    response.sendFile(path.join(__dirname, '/LoginCadastro/register/register.html'));
});



// login 
app.post('/auth', function(request, response) {

    let { usuario, senha, email } = request.body;

    if (usuario && senha) {
        pool.query('SELECT * FROM contas WHERE usuario = ? AND senha = ?', [usuario, senha], function(error, results, fields) {
            if (error) throw error;
            if (results.length > 0) {
                request.session.loggedin = true;
                request.session.usuario = usuario;
                response.redirect('/home');
            } else {
                response.send('Usuario ou senha incorretas');
            }

        });
    } else {
        response.send('Insira usuario e senha!');

    }
})

// cadastro
app.post('/cadastrar', function(request, response) {
    let { usuario, senha, email } = request.body;

    if (usuario && senha && email) {
        pool.query('SELECT * FROM contas WHERE usuario = ? AND email=?', [usuario, email], function(error, results, fields) {
            if (error) throw error;
            if (results.length > 0) {
                response.send("Usuario ja existe");
            } else {
                pool.query('INSERT INTO contas (usuario, senha, email) VALUES (?, ?, ?)', [usuario, senha, email], function(error, results, fields) {
                    if (error) throw error;
                    response.send(`
				<h1>Cadastro realizado com sucesso!</h1>
				<p>Agora você pode fazer login. <a href="/">Clique aqui para fazer login</a></p>
		`);
                });
            }
        });
    } else {
        response.send("Preencha todos os campos");
    }
})

app.get('/home', function(request, response) {
    console.log(request.session);

    if (request.session.loggedin) {
        response.send('Bem vindo de volta, ' + request.session.usuario);
    } else {
        response.send('Logue para ver a pagina');
    }
    response.end();
});

app.listen(3000, function() {
    console.log('Servidor rodando na porta 3000');
});