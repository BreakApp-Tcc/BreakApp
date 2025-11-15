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

// Retorna dados do usuário (ex.: logado)
router.get('/', (req, res) => {
    const nome_usuario = req.session.usuario; // pega o nome salvo na sessão após login
    if (!nome_usuario) return res.status(400).json({ erro: 'Usuário não está logado' });

    pool.query(
        'SELECT nome_usuario AS nome, peso, altura, imc, tmb FROM usuario WHERE nome_usuario = ?',
        [nome_usuario],
        (err, results) => {
            if (err) return res.status(500).json({ erro: 'Erro no servidor' });
            if (!results.length) return res.status(404).json({ erro: 'Usuário não encontrado' });
            res.json(results[0]);
        }
    );
});


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
                                res.status(201).json({ mensagem: 'Usuário cadastrado com sucesso!' });
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
                        return res.status(200).json({ mensagem: 'Login realizado com sucesso!' });
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

// Rota calcular IMC e TMB
router.post('/calcular', (req, res) => {
    const { nome_usuario, idade, peso, altura, sexo } = req.body;

    if (!nome_usuario || !idade || !peso || !altura || !sexo) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
    }

    // Calculando IMC (altura em cm)
    const imc = peso / ((altura / 100) ** 2);

    // Calculando TMB (altura já em cm)
    const tmb = 10 * peso + 6.25 * altura - 5 * idade + (sexo === "masculino" ? 5 : -161);

    const sql = `
        UPDATE usuario
        SET idade = ?, peso = ?, altura = ?, sexo = ?, imc = ?, tmb = ?
        WHERE nome_usuario = ?
    `;
    const params = [idade, peso, altura, sexo, imc, tmb, nome_usuario];

    pool.query(sql, params, (err, result) => {
        if (err) {
            console.error("Erro na consulta:", err);
            return res.status(500).json({ erro: "Erro ao atualizar no banco." });
        }

        res.json({ nome_usuario, idade, peso, altura, sexo, imc, tmb });
    });
});




module.exports = router;