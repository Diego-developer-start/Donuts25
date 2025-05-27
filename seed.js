const mongoose = require('mongoose');
const Product = require('./models/Product');

// Conexão com MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/donut-shop', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Conectado ao MongoDB'))
.catch(err => console.error('Erro na conexão com MongoDB:', err));

// Dados de teste
const produtos = [
    {
        name: "Donut Chocolate",
        description: "Delicioso donut coberto com chocolate e granulado crocante.",
        price: 6.00,
        image: "./imagens/donut-chocolate.jpg",
        category: "Tradicional"
    },
    {
        name: "Donut Morango",
        description: "Donut com cobertura de morango e confeitos coloridos.",
        price: 7.00,
        image: "./imagens/donut-morango.jpg",
        category: "Frutas"
    },
    {
        name: "Donut Glaceado",
        description: "Um donut clássico glaceado e polvilhado com açúcar.",
        price: 5.50,
        image: "./imagens/donut-glaceado.jpg",
        category: "Tradicional"
    },
    {
        name: "Donut Caramelo",
        description: "Donut com cobertura de caramelo e uma pitada de sal.",
        price: 6.50,
        image: "./imagens/caramelo.jpg",
        category: "Especial"
    },
    {
        name: "Donut Nutella",
        description: "Donut recheado com Nutella e coberto com avelãs.",
        price: 8.00,
        image: "./imagens/nutella.jpg",
        category: "Especial"
    },
    {
        name: "Donut Baunilha",
        description: "Donut macio com cobertura de baunilha e confeitos.",
        price: 6.50,
        image: "./imagens/donut-baunilha.jpg",
        category: "Tradicional"
    }
];

// Inserir produtos
async function inserirProdutos() {
    try {
        await Product.deleteMany({}); // Limpa produtos existentes
        await Product.insertMany(produtos);
        console.log('Produtos inseridos com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('Erro ao inserir produtos:', error);
        process.exit(1);
    }
}

inserirProdutos();