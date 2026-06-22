import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());


// Configuração da conexão com o Banco de Dados
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '34323720',
    database: 'jucare_db'
};

//testar a conexão com o banco de dados assim que o servidor subir
async function testarConexaoBanco() {
    try {
        const conexao = await mysql.createConnection(dbConfig);
        console.log("🔋 Conexão com o banco de dados MySQL realizada com sucesso!");
        await conexao.end();
    } catch (error) {
        console.error("❌ Erro ao conectar no MySQL! Verifique a senha.");
        console.error(error.message);
    }
}
testarConexaoBanco();



// 🔑 ROTA DE ACESSO: Validação da Chave Oculta
app.post('/login', (req, res) => {
    const { nome, chave } = req.body;
    const CHAVE_SECRETA = "Jucare2@26"; // Protegida no servidor!

    if (!nome) {
        return res.status(400).json({ erro: "O nome é obrigatório!" });
    }

    if (chave === CHAVE_SECRETA) {
        return res.json({ status: "autorizado", message: `Bem-vindo, ${nome}!` });
    } else {
        return res.status(401).json({ erro: "Chave de acesso incorreta!" });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor do Jucaré F.C. rodando na porta ${PORT}`);
});

//ROTA 2: SALVAR PARTIDAS
app.post('/partidas', async (req, res) => {
    const { casa, fora, golsCasa, golsFora, quemFezGols, quemDeuAssistencia, quemLevouCartao } = req.body;

    // Validação básica de segurança para não salvar campos vazios
    if (!casa || !fora) {
        return res.status(400).json({ erro: "Os nomes dos times são obrigatórios!" });
    }

    try {
        // Abre a conexão com o banco
        const conexao = await mysql.createConnection(dbConfig);
        
        // Comando SQL para inserir os dados exatamente nas colunas que criamos no Workbench
        const querySQL = `
            INSERT INTO partidas (time_casa, time_fora, gols_casa, gols_fora, quem_fez_gols, quem_deu_assistência, quem_levou_cartao) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;
        
        // Executa o comando passando os valores com segurança contra SQL Injection
        await conexao.execute(querySQL, [casa, fora, golsCasa, golsFora, quemFezGols, quemDeuAssistencia, quemLevouCartao]);
        
        // Fecha a conexão após terminar o trabalho
        await conexao.end();

        return res.status(201).json({ mensagem: "Partida gravada no banco do Jucaré com sucesso!" });

    } catch (error) {
        console.error("Erro ao inserir partida:", error);
        return res.status(500).json({ erro: "Erro interno ao salvar no banco de dados." });
    }
});

app.get('/partidas', async (req, res) => {
    let conexao;
    try {
        conexao = await mysql.createConnection(dbConfig);
        
        // Buscamos o resultado bruto do banco
        const resultado = await conexao.execute("SELECT * FROM partidas ORDER BY id DESC");
        
        // Garante o fechamento da conexão assim que pega os dados
        await conexao.end();

        // O mysql2 com 'execute' e promises devolve um array onde a primeira posição [0] são as linhas reais
        const linhas = resultado[0] || resultado;

        // Envia de volta para o Front-end
        return res.json(linhas);

    } catch (error) {
        console.error("Erro ao buscar partidas:", error);
        
        // Garante que não vai deixar conexões abertas se der erro
        if (conexao && conexao.end) {
            await conexao.end().catch(() => {});
        }
        
        return res.status(500).json({ erro: "Erro interno ao buscar dados no banco." });
    }
});


app.listen(PORT, () => {
    console.log(`🚀 Servidor do Jucaré F.C. rodando na porta ${PORT}`)
})