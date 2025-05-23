const express = require('express');
const session = require('express-session');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Criação pool conexão com o banco
const pool = mysql.createPool({
    host: 'db',
    user: 'usuario',
    password: 'senhausuario',
    database: 'breakappdb',
    port: 3306
});

// Função para validar formato de e-mail
const validarEmail = (email) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
    return regex.test(email);
};

// Rota para cadastro
router.post('/cadastrar', (req, res) => {
    const { nome_usuario, senha, email } = req.body;

    if (!nome_usuario || !senha || !email) {
        return res.status(400).send('Preencha todos os campos');
    }

    if (!validarEmail(email)) {
        return res.status(400).send('E-mail inválido');
    }

    pool.query(
        'SELECT * FROM usuario WHERE nome_usuario = ? OR email = ?', [nome_usuario, email],
        (error, results) => {
            if (error) {
                return res.status(500).send('Erro no servidor: ' + error.message);
            }

            if (results.length > 0) {
                return res.status(400).send('Usuário ou e-mail já existem');
            }

            // Hash da senha e inserção
            bcrypt.hash(senha, 10, (err, hashedPassword) => {
                if (err) {
                    return res.status(500).send('Erro ao processar senha');
                }

                pool.query(
                    'INSERT INTO usuario (nome_usuario, senha, email) VALUES (?, ?, ?)', [nome_usuario, hashedPassword, email],
                    (insertErr, insertResult) => {
                        if (insertErr) {
                            return res.status(500).send('Erro ao cadastrar usuário');
                        }

                        pool.query(
                            'SELECT * FROM usuario WHERE id = ?', [insertResult.insertId],
                            (checkErr, checkResults) => {
                                if (checkErr || checkResults.length === 0) {
                                    return res.status(500).send('Erro ao confirmar cadastro');
                                }

                                return res.status(201).json({
                                    mensagem: 'Cadastro realizado com sucesso!',
                                    usuario: {
                                        id: checkResults[0].id,
                                        nome_usuario: checkResults[0].nome_usuario,
                                        email: checkResults[0].email
                                    }
                                });
                            }
                        );
                    }
                );
            });
        }
    );
});


// Rota login
router.post('/login', (req, res) => {
    // Captura dados para requisição
    //identificador = email e nome
    let { identificador, senha } = req.body;

    console.log('Login recebido:', identificador, senha);

    if (identificador && senha) {
        const campo = identificador.includes('@') ? 'email' : 'nome_usuario';
        const query = `SELECT * FROM usuario WHERE LOWER(${campo}) = ?`;

        console.log('Executando query:', query);

        pool.query(query, [identificador], (error, results) => {
            if (error) {
                console.error('Erro no banco:', error);
                return res.status(500).send('Erro no servidor: ' + error.message);
            }

            console.log('Resultado da query:', results);

            if (results.length > 0) {
                const usuario = results[0];
                bcrypt.compare(senha, usuario.senha, (err, isMatch) => {
                    if (err) {
                        console.error('Erro ao verificar senha:', err);
                        return res.status(500).send('Erro ao verificar senha');
                    }

                    if (isMatch) {
                        req.session.loggedin = true;
                        req.session.usuario = usuario.nome_usuario;
                        console.log('Login bem-sucedido:', usuario.nome_usuario);
                    } else {
                        return res.status(400).send('Senha incorreta');
                    }
                });
            } else {
                return res.status(400).send('Usuário ou e-mail não encontrado');
            }
        });
    } else {
        return res.status(400).send('Preencha usuário ou e-mail e senha');
    }
});

// Rota calcular imc e tmb
router.post('/calcular', (req, res) => {
    const { idade, peso, altura, sexo } = req.body;

    if (!req.session.usuario) {
        return res.status(401).json({ erro: "Usuário não autenticado." });
    }

    if (!idade || !peso || !altura || !sexo) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
    }

    const imc = peso / (altura * altura);
    const tmb = 10 * peso + 6.25 * altura * 100 - 5 * idade + (sexo === "masculino" ? 5 : -161);

    const sql = `
        UPDATE usuario
        SET idade = ?, peso = ?, altura = ?, sexo = ?, imc = ?, tmb = ?
        WHERE nome_usuario = ?
    `;
    const params = [idade, peso, altura, sexo, imc, tmb, req.session.usuario];

    pool.query(sql, params, (err, result) => {
        if (err) {
            console.error("Erro na consulta:", err);
            return res.status(500).json({ erro: "Erro ao atualizar no banco." });
        }
        res.json({ idade, peso, altura, sexo, imc, tmb });
    });
});

module.exports = router;