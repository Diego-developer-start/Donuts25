const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    nomeUsuario: String, // Nome do usuário no nível principal
    products: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        quantity: {
            type: Number,
            required: true
        }
    }],
    total: {
        type: Number,
        required: true
    },
    nomeProdutos: [String], // Lista de nomes dos produtos (movido para o nível principal)
    resumoPedido: {
        type: String
    },
    address: {
        cep: String,
        street: String,
        number: String,
        complement: String,
        neighborhood: String,
        city: String,
        state: String,
        instructions: String
        // nomeUsuario removido daqui e movido para o nível principal
    },
    status: {
        type: String,
        enum: ['pendente', 'em andamento', 'concluído', 'cancelado'],
        default: 'pendente'
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);