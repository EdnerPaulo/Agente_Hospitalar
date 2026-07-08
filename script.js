lucide.createIcons();

const promptPadrao = `Você é o MedAssist, um agente de atendimento e triagem virtual do Hospital Central. 
Sua função é acolher o paciente, entender os sintomas ou dúvidas e direcionar para o setor correto (Pronto Socorro, Agendamento ou Especialidades).
Regras estritas:
1. Seja empático, claro e profissional.
2. NUNCA dê diagnósticos médicos definitivos ou prescreva medicamentos.
3. Se o paciente relatar dor no peito crônica, falta de ar grave ou perda de consciência, oriente IMEDIATAMENTE a buscar o Pronto Socorro de emergência.`;

// Carrega configurações salvas ou define padrões nos seus elementos originais
document.getElementById('systemPrompt').value = localStorage.getItem('med_system_prompt') || promptPadrao;
document.getElementById('modelSelect').value = localStorage.getItem('med_model') || 'llama-3.3-70b-versatile';

// Mantém o campo de texto da chave preenchido visualmente se o usuário quiser ver, 
// mas o sistema vai priorizar a chave do Netlify no servidor
document.getElementById('apiKey').value = localStorage.getItem('med_key_groq') || 'Chave Protegida no Netlify';

atualizarSubtituloHeader();

let historicoChat = [
    { role: "system", content: document.getElementById('systemPrompt').value }
];

function atualizarSubtituloHeader() {
    const modelo = document.getElementById('modelSelect').value;
    document.getElementById('subtituloHeader').innerText = `Operando via GROQ Seguro | Modelo: ${modelo}`;
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
    alert("Configurações aplicadas com sucesso!");
}

function verificarEnter(event) {
    if (event.key === 'Enter') enviarMensagem();
}

async function enviarMensagem() {
    const inputElement = document.getElementById('userInput');
    const mensagemTexto = inputElement.value.trim();
    const modeloSelecionado = document.getElementById('modelSelect').value || 'llama-3.3-70b-versatile';

    if (!mensagemTexto) return;

    adicionarMensagem(mensagemTexto, 'user');
    inputElement.value = '';

    historicoChat.push({ role: "user", content: mensagemTexto });

    const chatMessages = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message agent loading';
    loadingDiv.id = 'loadingIndicator';
    loadingDiv.innerText = 'Analisando de forma segura com Groq...';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        // ALTERAÇÃO CIRÚRGICA: Aponta para a sua nova função do Netlify em vez do link direto
        const response = await fetch('/.netlify/functions/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: modeloSelecionado,
                messages: historicoChat
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
        adicionarMensagem(`Erro na comunicação segura: ${error.message}`, 'agent');
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