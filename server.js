// server.js
const express = require('express');
const path = require('path');
const { OpenAI } = require('openai');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Mapeamento de dificuldade para instruções de prompt
const difficultyInstructions = {
    'facil': 'Use uma linguagem muito simples, frases curtas e vocabulário básico. O objetivo é que uma criança ou um iniciante em português consiga entender.',
    'medio': 'Use uma linguagem padrão, mantendo a riqueza do texto original, mas garantindo clareza. O vocabulário deve ser acessível, mas não simplificado demais.',
    'dificil': 'Use uma linguagem formal, vocabulário avançado, e mantenha todas as nuances e complexidades gramaticais do texto original. O objetivo é uma tradução literária e sofisticada.'
};

// Inicializa o cliente OpenAI.
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota de tradução (baseada no seu código original)
app.post('/api/translate', async (req, res) => {
    // Configurar CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Método não permitido. Use POST.' });
    }

    try {
        const { text, difficulty } = req.body;

        if (!text || !difficulty) {
            return res.status(400).json({ error: 'Parâmetros "text" e "difficulty" são obrigatórios.' });
        }

        const instruction = difficultyInstructions[difficulty] || difficultyInstructions['medio'];

        // 1. Criar o prompt completo para a IA
        const systemPrompt = `Você é um tradutor literário profissional. Sua tarefa é traduzir o texto a seguir do Inglês para o Português. Mantenha o contexto e o tom da obra original. Além disso, você deve ajustar a complexidade da linguagem de acordo com a seguinte instrução: "${instruction}"`;

        const userPrompt = `Traduza o seguinte texto: \n\n"""\n${text}\n"""`;

        // 2. Chamar a API da OpenAI - CORRIGINDO O MODELO
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Modelo correto (gpt-4.1-mini não existe)
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.2, // Baixa temperatura para traduções mais consistentes
        });

        const translatedText = completion.choices[0].message.content.trim();

        // 3. Retornar o resultado para o frontend
        res.status(200).json({ translatedText });

    } catch (error) {
        console.error('Erro ao chamar a API da OpenAI:', error);
        
        // Mensagens de erro mais específicas
        if (error.code === 'invalid_api_key') {
            return res.status(500).json({ error: 'Chave da API OpenAI inválida. Configure a OPENAI_API_KEY no Render.' });
        }
        
        if (error.code === 'model_not_found') {
            return res.status(500).json({ error: 'Modelo não encontrado. Verifique o nome do modelo.' });
        }
        
        res.status(500).json({ error: `Falha na tradução: ${error.message}` });
    }
});

// Rota de saúde para testar
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        openai_configured: !!process.env.OPENAI_API_KEY,
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🔑 OpenAI Configurada: ${process.env.OPENAI_API_KEY ? 'SIM' : 'NÃO'}`);
});
