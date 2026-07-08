lucide.createIcons();

const promptPadrao = `Você é o MedAssist, um agente de atendimento e triagem virtual do Hospital Central. 
Sua função é acolher o paciente, entender os sintomas ou dúvidas e direcionar para o setor correto (Pronto Socorro, Agendamento ou Especialidades).
Regras estritas:
1. Seja empático, claro e profissional.
2. NUNCA dê diagnósticos médicos definitivos ou prescreva medicamentos.
3. Se o paciente relatar dor no peito crônica, falta de ar grave ou perda de consciência, oriente IMEDIATAMENTE a buscar o Pronto Socorro de emergência.`;

// Mapeamento de modelos 100% ATUALIZADOS e ATIVOS para 2026
const modelosPorProvedor = {
    groq: [
        { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B (Alta Precisão)" },
        { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B (Ultra Rápido)" }
    ],
    openrouter: [
        { value: "google/gemini-2.5-flash:free", label: "Gemini 2.5 Flash (Grátis e Estável)" },
        { value: "deepseek/deepseek-chat:free", label: "DeepSeek V3 (Grátis)" },
        { value: "meta-llama/llama-3.2-3b-instruct:free", label: "Llama 3.2 3B Leve (Grátis)" }
    ]
};

// Carregar estado salvo ou inicializar padrões
document.getElementById('systemPrompt').value = localStorage.getItem('med_system_prompt') || promptPadrao;
document.getElementById('providerSelect').value = localStorage.getItem('med_provider') || 'groq';

// Atualizar a lista de modelos na interface com base no provedor carregado
atualizarModelosDisponiveis();
document.getElementById('modelSelect').value = localStorage.getItem('med_model') || modelosPorProvedor[document.getElementById('providerSelect').value][0].value;
recuperarChaveSalva();
atualizarSubtituloHeader();

let historicoChat = [
    { role: "system", content: document.getElementById('systemPrompt').value }
];

function atualizarModelosDisponiveis() {
    const provedor = document.getElementById('providerSelect').value;
    const modelSelect = document.getElementById('modelSelect');
    
    modelSelect.innerHTML = '';
    modelosPorProvedor[provedor].forEach(modelo => {
        const option = document.createElement('option');
        option.value = modelo.value;
        option.innerText = modelo.label;
        modelSelect.appendChild(option);
    });
    
    recuperarChaveSalva();
}

function recuperarChaveSalva() {
    const provedor = document.getElementById('providerSelect').value;
    document.getElementById('apiKey').value = localStorage.getItem(`med_key_${provedor}`) || '';
}

function atualizarSubtituloHeader() {
    const provedor = document.getElementById('providerSelect').value;
    const modelo = document.getElementById('modelSelect').value;
    document.getElementById('subtituloHeader').innerText = `Operando via ${provedor.toUpperCase()} | Modelo: ${modelo.split('/').pop()}`;
}

function salvarConfiguracoes() {
    const provedor = document.getElementById('providerSelect').value;
    const chave = document.getElementById('apiKey').value.trim();
    const modelo = document.getElementById('modelSelect').value;
    const prompt = document.getElementById('systemPrompt').value.trim();
    
    localStorage.setItem('med_provider', provedor);
    localStorage.setItem(`med_key_${provedor}`, chave);
    localStorage.setItem('med_model', modelo);
    localStorage.setItem('med_system_prompt', prompt);
    
    historicoChat = [{ role: "system", content: prompt }];
    atualizarSubtituloHeader();
    alert("Configurações aplicadas! O histórico do chat foi reiniciado.");
}

function verificarEnter(event) {
    if (event.key === 'Enter') enviarMensagem();
}

async function enviarMensagem() {
    const inputElement = document.getElementById('userInput');
    const mensagemTexto = inputElement.value.trim();
    
    const provedor = localStorage.getItem('med_provider') || 'groq';
    const apiKey = localStorage.getItem(`med_key_${provedor}`);
    const modeloSelecionado = localStorage.getItem('med_model');

    if (!mensagemTexto) return;

    if (!apiKey) {
        alert(`Insira a chave de API para o ${provedor.toUpperCase()} no painel lateral e clique em Aplicar.`);
        return;
    }

    adicionarNaTela(mensagemTexto, 'user');
    inputElement.value = '';

    historicoChat.push({ role: "user", content: mensagemTexto });

    const chatMessages = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message agent loading';
    loadingDiv.id = 'loadingIndicator';
    loadingDiv.innerText = `Buscando resposta via ${provedor.toUpperCase()}...`;
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const urlEndpoint = provedor === 'groq' 
        ? 'https://api.groq.com/openai/v1/chat/completions' 
        : 'https://openrouter.ai/api/v1/chat/completions';

    try {
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
            throw new Error(`Código ${response.status} - ${erroTxt}`);
        }

        const dados = await response.json();
        const respostaBot = dados.choices[0].message.content;

        document.getElementById('loadingIndicator').remove();
        adicionarNaTela(respostaBot, 'agent');

        historicoChat.push({ role: "assistant", content: respostaBot });

    } catch (error) {
        if (document.getElementById('loadingIndicator')) {
            document.getElementById('loadingIndicator').remove();
        }
        // ATUALIZAÇÃO SÊNIOR: Cospe o erro real e exato do sistema na interface
        adicionarNaTela(`DIAGNÓSTICO REAL: ${error.message}`, 'agent');
    }
}

function adicionarNaTela(texto, remetente) {
    const chatMessages = document.getElementById('chatMessages');
    const msgDiv = document.createElement('div');
    msgDiv.className = `message ${remetente}`;
    msgDiv.innerText = texto;
    chatMessages.appendChild(msgDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}