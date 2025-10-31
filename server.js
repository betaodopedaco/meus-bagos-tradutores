// server.js
const express = require('express');
const path = require('path');
const OpenAI = require('openai');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// Configuração OpenAI com verificação
const getOpenAIClient = () => {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
        console.error('❌ OPENAI_API_KEY não encontrada! Configure no Render.');
        return null;
    }
    return new OpenAI({ apiKey });
};

// Rota principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Rota de tradução com melhor tratamento de erro
app.post('/api/translate', async (req, res) => {
    console.log('📨 Recebendo requisição de tradução...');
    
    const { text, difficulty } = req.body;
    
    // Validações
    if (!text) {
        return res.status(400).json({ error: 'Texto é obrigatório' });
    }

    if (!difficulty) {
        return res.status(400).json({ error: 'Dificuldade é obrigatória' });
    }

    try {
        const openai = getOpenAIClient();
        if (!openai) {
            return res.status(500).json({ 
                error: 'Serviço de tradução não configurado. Contate o administrador.' 
            });
        }

        console.log(`🔧 Traduzindo com dificuldade: ${difficulty}`);
        
        const prompt = generatePrompt(text, difficulty);
        
        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                { 
                    role: "system", 
                    content: "Você é um tradutor especializado em livros e textos literários. Traduza mantendo o contexto e estilo." 
                },
                { role: "user", content: prompt }
            ],
            max_tokens: 2000,
            temperature: 0.7
        });

        const translatedText = completion.choices[0].message.content;
        
        console.log('✅ Tradução concluída com sucesso!');
        res.json({ translatedText });
        
    } catch (error) {
        console.error('❌ Erro na tradução:', error);
        
        // Erros específicos da OpenAI
        if (error.code === 'invalid_api_key') {
            return res.status(500).json({ 
                error: 'Chave da API inválida. Verifique a OPENAI_API_KEY.' 
            });
        }
        
        if (error.code === 'insufficient_quota') {
            return res.status(500).json({ 
                error: 'Cota da API excedida. Verifique seu plano OpenAI.' 
            });
        }
        
        res.status(500).json({ 
            error: `Erro na tradução: ${error.message}` 
        });
    }
});

function generatePrompt(text, difficulty) {
    const difficultyMap = {
        easy: "Traduza para o português brasileiro de forma SIMPLES e FÁCIL de entender, usando vocabulário básico:",
        medium: "Traduza para o português brasileiro mantendo o estilo e vocabulário ORIGINAL do texto:",
        hard: "Traduza para o português brasileiro de forma LITERÁRIA e SOFISTICADA, usando linguagem elaborada:"
    };
    
    const instruction = difficultyMap[difficulty] || difficultyMap.medium;
    return `${instruction}\n\nTexto para traduzir: "${text}"\n\nTradução:`;
}

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
