lucide.createIcons();

const promptPadrao = `Você é o MedAssist, um agente de atendimento e triagem virtual do Hospital Central. 
Sua função é acolher o paciente, entender os sintomas ou dúvidas e direcionar para o setor correto (Pronto Socorro, Agendamento ou Especialidades).
Regras estritas:
1. Seja empático, claro e profissional.
2. NUNCA dê diagnósticos médicos definitivos ou prescreva medicamentos.
3. Se o paciente relatar dor no peito crônica, falta de ar grave ou perda de consciência, oriente IMEDIATAMENTE a buscar o Pronto Socorro de emergência.`;

// Carrega configurações salvas ou define padrões
document.getElementById('systemPrompt').value = localStorage.getItem('med_system_prompt') || promptPadrao;
document.getElementById('apiKey').value = localStorage.getItem('med_key_groq') || '';
document.getElementById('modelSelect').value = localStorage.getItem('med_model') || 'llama-3.3-70b-versatile';

atualizarSubtituloHeader();

let historicoChat = [
    { role: "system", content: document.getElementById('systemPrompt').value }
];

function atualizarSubtituloHeader() {
    const modelo = document.getElementById('modelSelect').value;
    document.getElementById('subtituloHeader').innerText = `Operando via GROQ | Modelo: ${modelo}`;
}

function salvarConfiguracoes() {
    const chave = document.getElementById('apiKey').value.trim();
    const modelo = document.getElementById('modelSelect').value;
    const prompt = document.getElementById('systemPrompt').value.trim();
    
    localStorage.setItem('med_key_groq', chave);
    localStorage.setItem('med_model', modelo);
    localStorage.setItem('med_system_prompt', prompt);
    
    historicoChat = [{ role: "system", content: prompt }];
    atualizarSubtituloHeader();
    alert("Configurações aplicadas com sucesso e histórico reiniciado!");
}

function verificarEnter(event) {
    if (event.key === 'Enter') enviarMensagem();
}

async function enviarMensagem() {
    const inputElement = document.getElementById('userInput');
    const mensagemTexto = inputElement.value.trim();
    const apiKey = localStorage.getItem('med_key_groq');
    const modeloSelecionado = localStorage.getItem('med_model') || 'llama-3.3-70b-versatile';

    if (!mensagemTexto) return;

    if (!apiKey) {
        alert("Por favor, insira e aplique sua Chave de API do Groq no painel lateral.");
        return;
    }

    adicionarMensagem(mensagemTexto, 'user');
    inputElement.value = '';

    historicoChat.push({ role: "user", content: mensagemTexto });

    const chatMessages = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message agent loading';
    loadingDiv.id = 'loadingIndicator';
    loadingDiv.innerText = 'Analisando com Groq...';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modeloSelecionado,
                messages: historicoChat,
                temperature: 0.4,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const erroTxt = await response.text();
            throw new Error(`Erro ${response.status}: ${erroTxt}`);
        }

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
        adicionarMensagem(`Erro na comunicação: ${error.message}`, 'agent');
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