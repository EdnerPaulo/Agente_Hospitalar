exports.handler = async function(event, context) {
    // O Netlify esconde a chave aqui dentro do processo seguro dele
    const apiKey = process.env.GROQ_API_KEY; 
    
    if (event.httpMethod !== "POST") {
        return { statusCode: 405, body: "Método Não Permitido" };
    }

    try {
        const body = JSON.parse(event.body);

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: body.model,
                messages: body.messages,
                temperature: 0.4,
                max_tokens: 500
            })
        });

        const dados = await response.json();
        return {
            statusCode: 200,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dados)
        };
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) };
    }
};