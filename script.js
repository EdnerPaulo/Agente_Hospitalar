// Inicializa os Ícones do Lucide
lucide.createIcons();

// Prompt de Sistema Padrão Orientado para Hospitais
const promptPadrao = `Você é o MedAssist, um agente de atendimento e triagem virtual do Hospital Central. 
Sua função é acolher o paciente, entender os sintomas ou dúvidas e direcionar para o setor correto (Pronto Socorro, Agendamento ou Especialidades).
Regras estritas:
1. Seja empático, claro e profissional.
2. NUNCA dê diagnósticos médicos definitivos ou prescreva medicamentos.
3. Se o paciente relatar dor no peito crônica, falta de ar grave ou perda de consciência, oriente IMEDIATAMENTE a buscar o Pronto Socorro de emergência.`;

// Carrega configurações salvas do navegador ou define padrões
document.getElementById('systemPrompt').value = localStorage.getItem('hospital_system_prompt') || promptPadrao;
document.getElementById('apiKey').value = localStorage.getItem('hospital_openrouter_key') || '';

let historicoChat = [
    { role: "system", content: document.getElementById('systemPrompt').value }
];

function salvarConfiguracoes() {
    const key = document.getElementById('apiKey').value.trim();
    const prompt = document.getElementById('systemPrompt').value.trim();
    
    localStorage.setItem('hospital_openrouter_key', key);
    localStorage.setItem('hospital_system_prompt', prompt);
    
    // Reinicia histórico com o novo prompt de sistema
    historicoChat = [{ role: "system", content: prompt }];
    alert("Configurações aplicadas com sucesso e o chat foi reiniciado!");
}

function checarEnter(event) {
    if (event.key === 'Enter') enviarMensagem();
}

async function enviarMensagem() {
    const inputElement = document.getElementById('userInput');
    const mensagemTexto = inputElement.value.trim();
    const apiKey = localStorage.getItem('hospital_openrouter_key');

    if (!mensagemTexto) return;

    if (!apiKey) {
        alert("Por favor, insira e aplique sua Chave de API do OpenRouter no painel lateral.");
        return;
    }

    adicionarMensagem(mensagemTexto, 'user');
    inputElement.value = '';

    historicoChat.push({ role: "user", content: mensagemTexto });

    const chatMessages = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message agent loading';
    loadingDiv.id = 'loadingIndicator';
    loadingDiv.innerText = 'A processar triagem...';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': window.location.href,
                'X-Title': 'MedAssist Hospitalar'
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3-8b-instruct:free",
                messages: historicoChat,
                temperature: 0.5,
                max_tokens: 500
            })
        });

        if (!response.ok) throw new Error("Erro na comunicação com o OpenRouter.");

        const dados = await response.json();
        const respostaBot = dados.choices[0].message.content;

        document.getElementById('loadingIndicator').remove();
        adicionarMensagem(respostaBot, 'agent');

        historicoChat.push({ role: "assistant", content: respostaBot });

    } catch (error) {
        console.error(error);
        if (document.getElementById('loadingIndicator')) {
            document.getElementById('loadingIndicator').remove();
        }
        adicionarMensagem("De momento, ocorreu um problema ao processar a sua solicitação. Por favor, verifique sua chave ou tente mais tarde.", 'agent');
    }
}

function adicionarMensagem(texto, remetente) {
    const chatMessages = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${remetente}`;
    msgDiv.innerText = texto;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}