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
router.get('/', async (req, res) => {
    const {
        q
    } = req.query;

    if (!q) {
        return res.status(400).json({
            erro: 'Parâmetro de busca "q" é obrigatório.'
        });
    }

    try {
        const [rows] = await pool.query(`SELECT Codigo, descricao_do_alimento, Energia_kcal, Proteina_g, Lipidios_totais_g, Carboi_drato_g 
     FROM alimentos 
     WHERE LOWER(descricao_do_alimento) LIKE ?
     LIMIT 15`,
            [`%${q.toLowerCase()}%`]
        );

        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.json(rows);
    } catch (err) {
        console.error('Erro ao buscar alimentos:', err);
        res.status(500).json({
            erro: 'Erro ao buscar alimentos'
        });
    }
});
router.post('/salvar-refeicao', async (req, res) => {
    const { nome, dataHora, alimentos } = req.body;

    if (!nome || !dataHora || !alimentos || !Array.isArray(alimentos)) {
        return res.status(400).json({ erro: 'Dados inválidos ou incompletos' });
    }

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const [refeicaoResult] = await conn.query(
            'INSERT INTO refeicoes (nome, data_hora) VALUES (?, ?)',
            [nome, dataHora]
        );
        const refeicaoId = refeicaoResult.insertId;

        const insertAlimentos = alimentos.map(alimento =>
            conn.query(
                `INSERT INTO refeicao_alimentos 
                (refeicao_id, descricao, quantidade, energia, proteina, lipidio, carboidrato)
                VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [
                    refeicaoId,
                    alimento.descricao,
                    alimento.quantidade,
                    alimento.energia,
                    alimento.proteina,
                    alimento.lipidio,
                    alimento.carboidrato
                ]
            )
        );

        await Promise.all(insertAlimentos);

        await conn.commit();
        res.status(200).json({ sucesso: true, refeicaoId });
    } catch (err) {
        await conn.rollback();
        console.error('Erro ao salvar refeição:', err);
        res.status(500).json({ erro: 'Erro ao salvar a refeição' });
    } finally {
        conn.release();
    }
});
router.post('/adicionar', async (req, res) => {
    const {
        descricao_do_alimento,
        Categoria,
        Energia_kcal,
        Proteina_g,
        Lipidios_totais_g,
        Carboi_drato_g,
        Fibra_alimentar_total_g
    } = req.body;

    if (!descricao_do_alimento || !Categoria) {
        return res.status(400).json({ erro: "Nome e categoria do alimento são obrigatórios." });
    }

    try {
        const sql = `
            INSERT INTO alimentos (
                Codigo,
                descricao_do_alimento,
                Categoria,
                Codigo_de_preparacao,
                descricao_da_preparacao,
                Energia_kcal,
                Proteina_g,
                Lipidios_totais_g,
                Carboi_drato_g,
                Fibra_alimentar_total_g,
                criado_por_usuario
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const valores = [
            null, 
            descricao_do_alimento,
            Categoria,
            null, 
            null,
            Energia_kcal || 0,
            Proteina_g || 0,
            Lipidios_totais_g || 0,
            Carboi_drato_g || 0,
            Fibra_alimentar_total_g || 0,
            true
        ];

        await pool.query(sql, valores);

        res.status(201).json({ mensagem: "Alimento adicionado com sucesso!" });
    } catch (err) {
        console.error("Erro ao adicionar alimento:", err);
        res.status(500).json({ erro: "Erro no servidor ao adicionar alimento." });
    }
});




module.exports = router;