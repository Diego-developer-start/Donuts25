const express = require('express');
const router = express.Router();

// Base de conhecimento do chatbot
const knowledgeBase = {
    'horario': 'Nosso horário de funcionamento é de segunda a sábado, das 8h às 20h.',
    'endereço': 'Temos várias unidades! Você pode encontrar a mais próxima na página de Unidades.',
    'cardápio': 'Temos diversos sabores de donuts! Você pode ver todos os sabores na página de Produtos.',
    'preço': 'Nossos donuts variam de R$ 8,90 a R$ 15,90, dependendo do sabor e tamanho.',
    'entrega': 'Sim, fazemos entregas! O valor do frete varia de acordo com a distância.',
    'promoção': 'Temos promoções especiais todos os dias! Fique de olho em nossa página inicial.',
    'reserva': 'Sim, aceitamos reservas! Entre em contato pelo telefone ou pelo nosso WhatsApp.',
    'pagamento': 'Aceitamos cartões de crédito, débito, PIX e dinheiro.',
    'eventos': 'Fazemos donuts personalizados para eventos! Entre em contato para mais informações.',
    'ingredientes': 'Usamos ingredientes de primeira qualidade e seguimos rigorosos padrões de higiene.',
    'vegetariano': 'Sim, temos opções vegetarianas! Consulte nosso cardápio.',
    'glúten': 'Temos opções sem glúten! Consulte nosso cardápio para mais detalhes.',
    'lactose': 'Temos opções sem lactose! Consulte nosso cardápio para mais detalhes.',
    'fidelidade': 'Temos um programa de fidelidade! A cada 10 donuts, você ganha 1 grátis!',
    'festa': 'Sim, fazemos donuts personalizados para festas! Entre em contato para orçamento.',
    'empresa': 'Somos uma empresa brasileira, com mais de 5 anos de experiência em donuts artesanais.',
    'franquia': 'Sim, temos oportunidades de franquia! Entre em contato para mais informações.',
    'trabalhe': 'Estamos sempre procurando pessoas talentosas! Envie seu currículo pelo site.',
    'sabores': 'Temos mais de 20 sabores diferentes! Chocolate, morango, doce de leite, e muito mais!',
    'especial': 'Temos donuts especiais para datas comemorativas! Fique de olho em nossas redes sociais.'
};

// Função para encontrar a melhor resposta
function findBestResponse(message) {
    try {
        console.log('Mensagem recebida:', message);
        message = message.toLowerCase();
        
        // Verificar palavras-chave
        for (const [key, response] of Object.entries(knowledgeBase)) {
            if (message.includes(key)) {
                console.log('Palavra-chave encontrada:', key);
                return response;
            }
        }

        // Respostas padrão para saudações
        if (message.includes('oi') || message.includes('olá') || message.includes('bom dia') || 
            message.includes('boa tarde') || message.includes('boa noite')) {
            return 'Olá! Como posso ajudar você hoje?';
        }

        // Resposta padrão para agradecimentos
        if (message.includes('obrigado') || message.includes('obrigada') || message.includes('valeu')) {
            return 'Por nada! Estou sempre aqui para ajudar!';
        }

        // Resposta padrão para despedidas
        if (message.includes('tchau') || message.includes('adeus') || message.includes('até logo')) {
            return 'Até logo! Volte sempre!';
        }

        // Resposta padrão para perguntas não reconhecidas
        return 'Desculpe, não entendi sua pergunta. Você pode perguntar sobre nossos horários, produtos, preços, ou qualquer outra informação sobre nossa loja!';
    } catch (error) {
        console.error('Erro ao processar mensagem:', error);
        return 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.';
    }
}

router.post('/chat', async (req, res) => {
    try {
        console.log('Requisição recebida:', req.body);
        
        if (!req.body || !req.body.message) {
            console.error('Mensagem não fornecida');
            return res.status(400).json({ error: 'Mensagem não fornecida' });
        }

        const { message } = req.body;
        const response = findBestResponse(message);
        
        console.log('Resposta gerada:', response);
        res.json({ response });
    } catch (error) {
        console.error('Erro ao processar requisição:', error);
        res.status(500).json({ error: 'Erro ao processar sua mensagem' });
    }
});

module.exports = router; 