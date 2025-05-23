const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');


const pool = mysql.createPool({
    host: 'db',
    user: 'usuario',
    password: 'senhausuario',
    database: 'breakappdb',
    charset: 'utf8mb4',
    port: 3306
});

// Saida GET /api/alimentos
router.get('/', async(req, res) => {
    const { q } = req.query;

    if (!q) {
        return res.status(400).json({ erro: 'Parâmetro de busca "q" é obrigatório.' });
    }

    try {
        const [rows] = await pool.query(
            `SELECT Codigo, descricao_do_alimento, Energia_kcal 
             FROM alimentos 
             WHERE LOWER(descricao_do_alimento) LIKE ? 
             LIMIT 15`, [`%${q.toLowerCase()}%`]
        );

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar alimentos:', err);
        res.status(500).json({ erro: 'Erro ao buscar alimentos' });
    }
});

module.exports = router;