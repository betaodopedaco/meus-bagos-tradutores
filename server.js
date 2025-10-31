// server.js - ATUALIZADO PARA GROQ
const express = require('express');
const path = require('path');
const Groq = require('groq-sdk');

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

// Inicializa o cliente Groq
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY // MUDEI PARA GROQ_API_KEY
});

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota de tradução ATUALIZADA PARA GROQ
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

        // Prompt para a Groq
        const systemPrompt = `Você é um tradutor literário profissional. Sua tarefa é traduzir o texto a seguir do Inglês para o Português. Mantenha o contexto e o tom da obra original. Além disso, você deve ajustar a complexidade da linguagem de acordo com a seguinte instrução: "${instruction}"`;

        const userPrompt = `Traduza o seguinte texto: \n\n"""\n${text}\n"""`;

        // Chamar a API da Groq
        const completion = await groq.chat.completions.create({
            model: "llama-3.1-8b-instant", // Modelo rápido da Groq
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.2,
            max_tokens: 2048
        });

        const translatedText = completion.choices[0].message.content.trim();

        // Retornar o resultado
        res.status(200).json({ translatedText });

    } catch (error) {
        console.error('Erro ao chamar a API da Groq:', error);
        
        if (error.code === 'invalid_api_key') {
            return res.status(500).json({ error: 'Chave da API Groq inválida. Configure a GROQ_API_KEY no Render.' });
        }
        
        res.status(500).json({ error: `Falha na tradução: ${error.message}` });
    }
});

// Rota de saúde atualizada
app.get('/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        groq_configured: !!process.env.GROQ_API_KEY, // MUDEI PARA GROQ
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🔑 Groq Configurada: ${process.env.GROQ_API_KEY ? 'SIM' : 'NÃO'}`);
});
