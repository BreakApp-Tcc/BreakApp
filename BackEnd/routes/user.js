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

// ROTA GET - Retorna dados do usuário por nome ou por query param
router.get('/', (req, res) => {
    const nome_usuario = req.query.nome || req.session.usuario;
    
    if (!nome_usuario) {
        return res.status(400).json({ erro: 'Usuário não informado' });
    }

    pool.query(
        'SELECT id, nome_usuario AS nome, peso, altura, imc, tmb, idade, sexo, email FROM usuario WHERE nome_usuario = ?',
        [nome_usuario],
        (err, results) => {
            if (err) {
                console.error("Erro ao buscar usuário:", err);
                return res.status(500).json({ erro: 'Erro no servidor' });
            }
            
            if (!results.length) {
                return res.status(404).json({ erro: 'Usuário não encontrado' });
            }
            
            console.log("Usuário retornado:", results[0]);
            res.json(results[0]);
        }
    );
});

// ROTA PUT - Atualizar dados do usuário
router.put('/atualizar/:id', (req, res) => {
    const { id } = req.params;
    const { nome_usuario, peso, altura, imc, tmb } = req.body;

    console.log("Recebendo atualização para usuário ID:", id);
    console.log("Dados recebidos:", req.body);

    if (!id) {
        return res.status(400).json({ erro: 'ID do usuário é obrigatório' });
    }

    // Construir query dinamicamente baseado nos campos enviados
    const campos = [];
    const valores = [];

    if (nome_usuario) {
        campos.push('nome_usuario = ?');
        valores.push(nome_usuario);
    }
    if (peso !== undefined && peso !== null) {
        campos.push('peso = ?');
        valores.push(peso);
    }
    if (altura !== undefined && altura !== null) {
        campos.push('altura = ?');
        valores.push(altura);
    }
    if (imc !== undefined && imc !== null) {
        campos.push('imc = ?');
        valores.push(imc);
    }
    if (tmb !== undefined && tmb !== null) {
        campos.push('tmb = ?');
        valores.push(tmb);
    }

    if (campos.length === 0) {
        return res.status(400).json({ erro: 'Nenhum campo para atualizar' });
    }

    // Adicionar o ID no final dos valores
    valores.push(id);

    const sql = `UPDATE usuario SET ${campos.join(', ')} WHERE id = ?`;

    console.log("Executando SQL:", sql);
    console.log("Com valores:", valores);

    pool.query(sql, valores, (err, result) => {
        if (err) {
            console.error("Erro ao atualizar usuário:", err);
            return res.status(500).json({ erro: 'Erro ao atualizar dados' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: 'Usuário não encontrado' });
        }

        // Buscar dados atualizados
        pool.query(
            'SELECT id, nome_usuario AS nome, peso, altura, imc, tmb, idade, sexo, email FROM usuario WHERE id = ?',
            [id],
            (err, results) => {
                if (err) {
                    console.error("Erro ao buscar usuário atualizado:", err);
                    return res.status(500).json({ erro: 'Erro ao buscar dados atualizados' });
                }

                console.log("Usuário atualizado com sucesso:", results[0]);
                res.json({
                    mensagem: 'Dados atualizados com sucesso',
                    usuario: results[0]
                });
            }
        );
    });
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
        'SELECT * FROM usuario WHERE nome_usuario = ? OR email = ?', 
        [nome_usuario, email],
        (error, results) => {
            if (error) {
                console.error("Erro ao verificar usuário existente:", error);
                return res.status(500).send('Erro no servidor: ' + error.message);
            }

            if (results.length > 0) {
                return res.status(400).send('Usuário ou e-mail já existem');
            }

            // Hash da senha e inserção
            bcrypt.hash(senha, 10, (err, hashedPassword) => {
                if (err) {
                    console.error("Erro ao processar senha:", err);
                    return res.status(500).send('Erro ao processar senha');
                }

                pool.query(
                    'INSERT INTO usuario (nome_usuario, senha, email) VALUES (?, ?, ?)', 
                    [nome_usuario, hashedPassword, email],
                    (insertErr, insertResult) => {
                        if (insertErr) {
                            console.error("Erro ao inserir usuário:", insertErr);
                            return res.status(500).send('Erro ao cadastrar usuário');
                        }

                        pool.query(
                            'SELECT id, nome_usuario, email FROM usuario WHERE id = ?', 
                            [insertResult.insertId],
                            (checkErr, checkResults) => {
                                if (checkErr || checkResults.length === 0) {
                                    console.error("Erro ao confirmar cadastro:", checkErr);
                                    return res.status(500).send('Erro ao confirmar cadastro');
                                }
                                
                                console.log("Usuário cadastrado com sucesso:", checkResults[0]);
                                res.status(201).json({ 
                                    mensagem: 'Usuário cadastrado com sucesso!',
                                    usuario: checkResults[0]
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
    let { identificador, senha } = req.body;

    if (!identificador || !senha) {
        return res.status(400).send('Preencha usuário ou e-mail e senha');
    }

    const campo = identificador.includes('@') ? 'email' : 'nome_usuario';
    const query = `SELECT * FROM usuario WHERE LOWER(${campo}) = ?`;

    pool.query(query, [identificador.toLowerCase()], (error, results) => {
        if (error) {
            console.error("Erro no login:", error);
            return res.status(500).send('Erro no servidor: ' + error.message);
        }

        if (results.length === 0) {
            return res.status(400).send('Usuário ou e-mail não encontrado');
        }

        const usuario = results[0];
        
        bcrypt.compare(senha, usuario.senha, (err, isMatch) => {
            if (err) {
                console.error("Erro ao verificar senha:", err);
                return res.status(500).send('Erro ao verificar senha');
            }

            if (!isMatch) {
                return res.status(400).send('Senha incorreta');
            }

            // Login bem-sucedido
            req.session.loggedin = true;
            req.session.usuario = usuario.nome_usuario;

            // Retornar dados completos para o frontend
            const localStorageDefaults = {
                aguaConsumida: 0,
                metaAgua: Math.round(usuario.peso * 35) || 2000,
                ultimoDia: new Date().toISOString().split("T")[0],
                usuarioId: usuario.id,
                nome_usuario: usuario.nome_usuario
            };

            console.log("Login bem-sucedido:", {
                id: usuario.id,
                nome: usuario.nome_usuario
            });

            return res.status(200).json({
                mensagem: 'Login realizado com sucesso!',
                usuario: {
                    id: usuario.id,
                    nome_usuario: usuario.nome_usuario,
                    email: usuario.email,
                    peso: usuario.peso,
                    altura: usuario.altura,
                    imc: usuario.imc,
                    tmb: usuario.tmb
                },
                localStorageDefaults
            });
        });
    });
});

// Rota calcular IMC e TMB
router.post('/calcular', (req, res) => {
    const { nome_usuario, idade, peso, altura, sexo } = req.body;

    if (!nome_usuario || !idade || !peso || !altura || !sexo) {
        return res.status(400).json({ erro: "Todos os campos são obrigatórios." });
    }

    const imc = peso / ((altura / 100) ** 2);
    const tmb = 10 * peso + 6.25 * altura - 5 * idade + (sexo === "masculino" ? 5 : -161);

    const sql = `
        UPDATE usuario
        SET idade = ?, peso = ?, altura = ?, sexo = ?, imc = ?, tmb = ?
        WHERE nome_usuario = ?
    `;
    const params = [idade, peso, altura, sexo, imc, tmb, nome_usuario];

    pool.query(sql, params, (err, result) => {
        if (err) {
            console.error("Erro ao atualizar usuário:", err);
            return res.status(500).json({ erro: "Erro ao atualizar no banco." });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ erro: "Usuário não encontrado." });
        }

        console.log("Dados calculados e salvos:", { nome_usuario, imc, tmb });
        res.json({ nome_usuario, idade, peso, altura, sexo, imc, tmb });
    });
});

module.exports = router;