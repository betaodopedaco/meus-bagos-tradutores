document.addEventListener('DOMContentLoaded', () => {
    const translateButton = document.getElementById('translateButton');
    const inputText = document.getElementById('inputText');
    const outputText = document.getElementById('outputText');
    const difficultySelect = document.getElementById('difficulty');
    const statusMessage = document.getElementById('statusMessage');

    translateButton.addEventListener('click', async () => {
        const text = inputText.value.trim();
        const difficulty = difficultySelect.value;

        if (!text) {
            alert('Por favor, insira o texto a ser traduzido.');
            return;
        }

        // 1. Mostrar status de carregamento
        statusMessage.textContent = 'Traduzindo... Aguarde.';
        statusMessage.classList.remove('hidden');
        outputText.value = '';
        translateButton.disabled = true;

        try {
            // 2. Chamar o endpoint do nosso backend (que será uma Serverless Function no Vercel)
            const response = await fetch('/api/translate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ text, difficulty }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Erro HTTP: ${response.status}`);
            }

            const data = await response.json();

            // 3. Exibir o resultado
            outputText.value = data.translatedText;
            statusMessage.textContent = 'Tradução concluída com sucesso!';
            statusMessage.style.backgroundColor = '#d4edda';
            statusMessage.style.color = '#155724';

        } catch (error) {
            // 4. Tratar erros
            console.error('Erro na tradução:', error);
            outputText.value = 'Erro ao processar a tradução. Por favor, tente novamente.';
            statusMessage.textContent = `Erro: ${error.message}`;
            statusMessage.style.backgroundColor = '#f8d7da';
            statusMessage.style.color = '#721c24';
        } finally {
            // 5. Finalizar
            translateButton.disabled = false;
            setTimeout(() => {
                statusMessage.classList.add('hidden');
            }, 5000);
        }
    });
});
