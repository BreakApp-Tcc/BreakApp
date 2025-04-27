const express = require('express');
const mysql = require('mysql2');
const router = express.Router();


const db = mysql.createConnection({
    host: 'db',
    user: 'usuario',
    password: 'senhausuario',
    database: 'imcdb',
    port: 3306
});


router.post('/', (req, res) => {
    const { nome, idade, peso, altura, sexo } = req.body;

    const imc = peso / ((altura / 100) * (altura / 100));
    const tmb = sexo === 'masculino' ?
        13.7 * peso + 5 * altura - 6.8 * idade + 66 :
        9.6 * peso + 1.8 * altura - 4.7 * idade - 665;

    const query = `
        INSERT INTO usuario (nome, idade, peso, altura, sexo, imc, tmb) 
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    db.execute(query, [nome, idade, peso, altura, sexo, imc, tmb], (err, results) => {
        if (err) {
            console.error('Erro ao salvar usuário:', err);
            return res.status(500).json({ erro: 'Erro ao salvar usuário' });
        }

        const user = {
            id: results.insertId,
            nome,
            idade,
            peso,
            altura,
            sexo,
            imc,
            tmb
        };

        res.json(user);
    });
});

module.exports = router;