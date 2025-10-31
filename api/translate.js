// api/translate.js - Serverless Function para o Vercel
const { OpenAI } = require('openai');

// Inicializa o cliente OpenAI.
// A chave de API será lida automaticamente da variável de ambiente OPENAI_API_KEY no Vercel.
const openai = new OpenAI();

// Mapeamento de dificuldade para instruções de prompt
const difficultyInstructions = {
    'facil': 'Use uma linguagem muito simples, frases curtas e vocabulário básico. O objetivo é que uma criança ou um iniciante em português consiga entender.',
    'medio': 'Use uma linguagem padrão, mantendo a riqueza do texto original, mas garantindo clareza. O vocabulário deve ser acessível, mas não simplificado demais.',
    'dificil': 'Use uma linguagem formal, vocabulário avançado, e mantenha todas as nuances e complexidades gramaticais do texto original. O objetivo é uma tradução literária e sofisticada.'
};

module.exports = async (req, res) => {
    // Definir o Content-Type como JSON
    res.setHeader('Content-Type', 'application/json');

    // Permitir CORS (necessário para testes locais ou se o frontend estiver em outro domínio)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Lidar com requisições OPTIONS (pré-voo CORS)
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

        // 2. Chamar a API da OpenAI
        const completion = await openai.chat.completions.create({
            model: "gpt-4.1-mini", // Modelo rápido e eficiente para tradução
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
        res.status(500).json({ error: 'Falha na tradução devido a um erro interno do servidor.' });
    }
};
