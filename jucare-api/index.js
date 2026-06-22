import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// 🔌 Configuração Inteligente: Lê a Nuvem (Render/Aiven) ou o seu Computador Local
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '34323720',
    database: process.env.DB_NAME || 'jucare_db',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 3306,
    // Ativa o SSL apenas se estiver rodando na nuvem (Aiven exige SSL)
    ssl: process.env.DB_HOST ? { rejectUnauthorized: false } : null
};

// Testar a conexão com o banco de dados assim que o servidor subir
async function testarConexaoBanco() {
    try {
        const conexao = await mysql.createConnection(dbConfig);
        console.log("🔋 Conexão com o banco de dados realizada com sucesso!");
        await conexao.end();
    } catch (error) {
        console.error("❌ Erro ao conectar no Banco de Dados!");
        console.error(error.message);
    }
}
testarConexaoBanco();

// 🔑 ROTA DE ACESSO: Validação da Chave Oculta
app.post('/login', (req, res) => {
    const { nome, chave } = req.body;
    const CHAVE_SECRETA = "Jucare2@26"; 

    if (!nome) {
        return res.status(400).json({ erro: "O nome é obrigatório!" });
    }

    if (chave === CHAVE_SECRETA) {
        return res.json({ status: "autorizado", message: `Bem-vindo, ${nome}!` });
    } else {
        return res.status(401).json({ erro: "Chave de acesso incorreta!" });
    }
});

// ROTA 2: SALVAR PARTIDAS
app.post('/partidas', async (req, res) => {
    const { casa, fora, golsCasa, golsFora, quemFezGols, quemDeuAssistencia, quemLevouCartao } = req.body;

    if (!casa || !fora) {
        return res.status(400).json({ erro: "Os nomes dos times são obrigatórios!" });
    }

    try {
        const conexao = await mysql.createConnection(dbConfig);
        
        const querySQL = `
            INSERT INTO partidas (time_casa, time_fora, gols_casa, gols_fora, quem_fez_gols, quem_deu_assistência, quem_levou_cartao) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        await conexao.execute(querySQL, [casa, fora, golsCasa, golsFora, quemFezGols, quemDeuAssistencia, quemLevouCartao]);
        await conexao.end();

        return res.status(201).json({ mensagem: "Partida gravada no banco do Jucaré com sucesso!" });
    } catch (error) {
        console.error("Erro ao inserir partida:", error);
        return res.status(500).json({ erro: "Erro interno ao salvar no banco de dados." });
    }
});

// ROTA 3: BUSCAR PARTIDAS
app.get('/partidas', async (req, res) => {
    let conexao;
    try {
        conexao = await mysql.createConnection(dbConfig);
        const resultado = await conexao.execute("SELECT * FROM partidas ORDER BY id DESC");
        await conexao.end();

        const linhas = resultado[0] || resultado;
        return res.json(linhas);
    } catch (error) {
        console.error("Erro ao buscar partidas:", error);
        if (conexao && conexao.end) {
            await conexao.end().catch(() => {});
        }
        return res.status(500).json({ erro: "Erro interno ao buscar dados no banco." });
    }
});

// Inicialização do Servidor (Apenas uma vez no final)
app.listen(PORT, () => {
    console.log(`🚀 Servidor do Jucaré F.C. rodando na porta ${PORT}`);
});