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
        const [rows] = await pool.query(`SELECT Codigo, descricao_do_alimento, descricao_da_preparacao, Energia_kcal, Proteina_g, Lipidios_totais_g, Carboi_drato_g 
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

        const { usuarioId } = req.body;

        if (!usuarioId) {
            return res.status(400).json({ erro: "Usuário não informado" });
        }

        const [refeicaoResult] = await conn.query(
            'INSERT INTO refeicoes (nome, data_hora, usuario_id) VALUES (?, ?, ?)',
            [nome, dataHora, usuarioId]
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

// Rota GET que lista todas as refeições com seus alimentos
router.get('/refeicoes', async (req, res) => {
    const { usuarioId } = req.query;

    if (!usuarioId) {
        return res.status(400).json({ erro: "Usuário não informado" });
    }

    try {
        const [refeicoes] = await pool.query(
            'SELECT * FROM refeicoes WHERE usuario_id = ? ORDER BY data_hora DESC',
            [usuarioId]
        );

        const resultado = [];

        for (const r of refeicoes) {
            const [alimentos] = await pool.query(
                'SELECT descricao, quantidade, energia, proteina, lipidio, carboidrato FROM refeicao_alimentos WHERE refeicao_id = ?',
                [r.id]
            );
            resultado.push({ ...r, alimentos });
        }

        res.json(resultado);

    } catch (err) {
        console.error('Erro ao buscar refeições:', err);
        res.status(500).json({ erro: 'Erro ao buscar refeições' });
    }
});



// Rota para buscar os alimentos de cada tipo de refeição
router.get('/refeicao/:categoria', async (req, res) => {
    const { categoria } = req.params;
    const { usuarioId } = req.query;

    if (!usuarioId) {
        return res.status(400).json({ erro: "Usuário não informado" });
    }

    try {
        const [refeicoes] = await pool.query(
            `SELECT id, nome, data_hora
             FROM refeicoes
             WHERE LOWER(nome) = LOWER(?) AND usuario_id = ?
             ORDER BY data_hora DESC`,
            [categoria, usuarioId]
        );

        if (refeicoes.length === 0) {
            return res.status(404).json({ refeicao: null, alimentos: [] });
        }

        let todosAlimentos = [];

        for (const ref of refeicoes) {
            const [alimentos] = await pool.query(
                `SELECT 
                    descricao AS nome_alimento,
                    quantidade,
                    energia AS calorias,
                    proteina,
                    lipidio,
                    carboidrato
                FROM refeicao_alimentos
                WHERE refeicao_id = ?`,
                [ref.id]
            );

            todosAlimentos = todosAlimentos.concat(alimentos);
        }

        res.json({
            refeicao: {
                nome: categoria,
                total_registros: refeicoes.length
            },
            alimentos: todosAlimentos
        });

    } catch (err) {
        console.error("Erro ao buscar dados da refeição:", err);
        res.status(500).json({ erro: "Erro interno ao buscar refeição." });
    }
});

// Rota para obter os macronutrientes totais do dia
router.get('/totais-dia', async (req, res) => {
    const { usuarioId } = req.query;

    if (!usuarioId) {
        return res.status(400).json({ erro: "Usuário não informado" });
    }

    const categorias = ["cafe", "almoco", "jantar"];
    let alimentosDia = [];

    try {
        for (const categoria of categorias) {
            const [refeicoes] = await pool.query(
                `SELECT id FROM refeicoes 
                 WHERE LOWER(nome) = LOWER(?) AND usuario_id = ?`,
                [categoria, usuarioId]
            );

            for (const ref of refeicoes) {
                const [alimentos] = await pool.query(
                    `SELECT 
                        descricao AS nome_alimento,
                        quantidade,
                        energia AS calorias,
                        proteina,
                        lipidio,
                        carboidrato
                    FROM refeicao_alimentos
                    WHERE refeicao_id = ?`,
                    [ref.id]
                );

                alimentosDia = alimentosDia.concat(alimentos);
            }
        }

        let totalProteina = 0;
        let totalCarbo = 0;
        let totalGordura = 0;
        let totalKcal = 0;

        alimentosDia.forEach(a => {
            totalProteina += Number(a.proteina || 0);
            totalCarbo += Number(a.carboidrato || 0);
            totalGordura += Number(a.lipidio || 0);
            totalKcal += Number(a.calorias || 0);
        });

        res.json({
            totalProteina,
            totalCarbo,
            totalGordura,
            totalKcal
        });

    } catch (err) {
        console.error("Erro ao calcular totais do dia:", err);
        res.status(500).json({ erro: "Erro ao calcular totais" });
    }
});


// Rota para criar os alimentos
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