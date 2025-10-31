// server.js
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para parsing JSON
app.use(express.json());
app.use(express.static(path.join(__dirname)));

// Rota para servir o frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota de tradução (substitui a função serverless do Vercel)
app.post('/api/translate', async (req, res) => {
    const { text, difficulty } = req.body;

    // Aqui você precisa ter a lógica de tradução que estava na sua API do Vercel
    // Como você está usando OpenAI, precisará do seu código de integração com a OpenAI

    // Exemplo básico (substitua pela sua lógica)
    try {
        // Importar a OpenAI (certifique-se de que está instalada)
        const OpenAI = require('openai');

        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY // Configure no Render
        });

        // Lógica de tradução baseada na dificuldade
        const prompt = generatePrompt(text, difficulty);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { role: "system", content: "You are a helpful translator." },
                { role: "user", content: prompt }
            ],
            max_tokens: 1000
        });

        const translatedText = completion.choices[0].message.content;

        res.json({ translatedText });
    } catch (error) {
        console.error('Erro na tradução:', error);
        res.status(500).json({ error: 'Erro interno no servidor' });
    }
});

function generatePrompt(text, difficulty) {
    // Adapte conforme sua lógica de dificuldade
    const difficultyMap = {
        easy: "Traduza para o português de forma simples e clara:",
        medium: "Traduza para o português mantendo o estilo original:",
        hard: "Traduza para o português de forma literária e elaborada:"
    };
    return `${difficultyMap[difficulty]} ${text}`;
}

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
