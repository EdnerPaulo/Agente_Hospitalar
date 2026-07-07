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
    
    // Reinicia o histórico com as novas instruções
    historicoChat = [{ role: "system", content: prompt }];
    alert("Configurações aplicadas com sucesso e chat reiniciado!");
}

function verificarEnter(event) {
    if (event.key === 'Enter') enviarMensagem();
}

async function enviarMensagem() {
    const inputElement = document.getElementById('userInput');
    const mensagemTexto = inputElement.value.trim();
    const apiKey = localStorage.getItem('hospital_openrouter_key');

    // Se o input estiver vazio, não faz nada
    if (!mensagemTexto) return;

    // Se não tiver chave salva, avisa o usuário
    if (!apiKey) {
        alert("Por favor, insira e aplique sua Chave de API do OpenRouter no painel lateral.");
        return;
    }

    // Adiciona a mensagem do usuário na tela
    adicionarNaTela(mensagemTexto, 'user');
    inputElement.value = '';

    // Adiciona ao histórico do chat (CORRIGIDO: mensagemTexto)
    historicoChat.push({ role: "user", content: mensagemTexto });

    // Cria o indicador visual de carregamento
    const chatMessages = document.getElementById('chatMessages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message agent loading';
    loadingDiv.id = 'loadingIndicator';
    loadingDiv.innerText = 'Analisando triagem...';
    chatMessages.appendChild(loadingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: "meta-llama/llama-3-8b-instruct:free",
                messages: historicoChat,
                temperature: 0.4,
                max_tokens: 500
            })
        });

        if (!response.ok) {
            const erroTxt = await response.text();
            throw new Error(`Erro na API: ${response.status} - ${erroTxt}`);
        }

        const dados = await response.json();
        const respostaBot = dados.choices[0].message.content;

        // Remove o loading e insere a resposta do bot
        document.getElementById('loadingIndicator').remove();
        adicionarNaTela(respostaBot, 'agent');

        // Guarda a resposta do bot no histórico para manter o contexto
        historicoChat.push({ role: "assistant", content: respostaBot });

    } catch (error) {
        console.error("Detalhes do erro:", error);
        if (document.getElementById('loadingIndicator')) {
            document.getElementById('loadingIndicator').remove();
        }
        adicionarNaTela("Houve um erro de conexão. Verifique se sua chave está correta ou se tem saldo no OpenRouter.", 'agent');
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