const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const Product = require('../models/Product');
const User = require('../models/User');

// Criar um novo pedido
router.post('/', auth, async (req, res) => {
    try {
        const { products, total, address } = req.body;
        const userId = req.user._id;
        
        // Buscar o usuário no banco para garantir que temos o nome
        const user = await User.findById(userId).select('name email');

        // Validação dos dados
        if (!products || !Array.isArray(products) || products.length === 0) {
            return res.status(400).json({ message: 'Produtos inválidos' });
        }

        if (!total || isNaN(total) || total <= 0) {
            return res.status(400).json({ message: 'Total inválido' });
        }

        if (!address || typeof address !== 'object') {
            return res.status(400).json({ message: 'Endereço é obrigatório e deve ser um objeto' });
        }
        // Padroniza os campos do endereço para os nomes usados no frontend
        const street = address.street;
        const number = address.number;
        const neighborhood = address.neighborhood;
        const city = address.city;
        const state = address.state;
        const cep = address.cep;
        const complement = address.complement;
        const instructions = address.instructions;

        if (!street || !number || !neighborhood || !city || !state || !cep) {
            return res.status(400).json({ message: 'Todos os campos de endereço (street, number, neighborhood, city, state, cep) são obrigatórios' });
        }

        // Buscar os produtos para obter os nomes
        const productIds = products.map(p => p.product);
        const productDocs = await Product.find({ _id: { $in: productIds } });

        // Mapear nomes dos produtos com informações detalhadas
        const nomeProdutos = products.map(p => {
            const prod = productDocs.find(doc => doc._id.equals(p.product));
            return prod ? prod.name : 'Produto desconhecido';
        });
        
        // Verificar se nomeProdutos foi preenchido corretamente
        if (!nomeProdutos || nomeProdutos.length === 0) {
            console.error('ALERTA: nomeProdutos está vazio!');
        }
        
        // Criar o resumo do pedido com formato detalhado
        const resumoPedido = nomeProdutos.map((nome, i) => {
            const quantidade = products[i].quantity;
            return `${quantidade}x ${nome}`;
        }).join(', ');
        
        // Verificar se resumoPedido foi preenchido corretamente
        if (!resumoPedido) {
            console.error('ALERTA: resumoPedido está vazio!');
        }

        // Criar o pedido com todos os dados necessários
        const orderData = {
            user: userId,
            nomeUsuario: user.name,         // Adicionar nome do usuário obtido do banco no nível principal
            products,
            total,
            resumoPedido,                   // Resumo do pedido ao nível principal
            nomeProdutos,                   // Nomes dos produtos ao nível principal
            address: {
                street,
                number,
                neighborhood,
                city,
                state,
                cep,
                complement,
                instructions
            }
        };
        
        // Verificar se todos os campos estão preenchidos
        if (!orderData.nomeUsuario) {
            console.error('ALERTA: nomeUsuario está vazio, usando nome do usuário do banco');
            orderData.nomeUsuario = user.name || 'Cliente';
        }
        
        if (!orderData.nomeProdutos || orderData.nomeProdutos.length === 0) {
            console.error('ALERTA: nomeProdutos está vazio, preenchendo novamente');
            orderData.nomeProdutos = nomeProdutos;
        }
        
        if (!orderData.resumoPedido) {
            console.error('ALERTA: resumoPedido está vazio, preenchendo novamente');
            orderData.resumoPedido = resumoPedido;
        }
        
        const order = new Order(orderData);
        
        // Garantir que os dados estejam preenchidos corretamente
        console.log('Verificando dados do pedido antes de salvar:');
        console.log('- Nome do usuário:', order.nomeUsuario);
        console.log('- Nomes dos produtos:', order.nomeProdutos);
        console.log('- Resumo do pedido:', order.resumoPedido);

        // Verificação adicional para garantir que os dados apareçam no MongoDB Compass
        if (!order.nomeUsuario) {
            console.error('ERRO CRÍTICO: nomeUsuario ainda está vazio após todas as verificações!');
            // Forçar a inclusão do nome do usuário
            order.nomeUsuario = user.name || 'Cliente';
        }

        if (!order.nomeProdutos || order.nomeProdutos.length === 0) {
            console.error('ERRO CRÍTICO: nomeProdutos ainda está vazio após todas as verificações!');
            // Forçar a inclusão dos nomes dos produtos
            order.nomeProdutos = products.map(p => {
                const prod = productDocs.find(doc => doc._id.equals(p.product));
                return prod ? prod.name : 'Produto desconhecido';
            });
        }

        if (!order.resumoPedido) {
            console.error('ERRO CRÍTICO: resumoPedido ainda está vazio após todas as verificações!');
            // Forçar a criação do resumo do pedido
            order.resumoPedido = order.nomeProdutos.map((nome, i) => {
                const quantidade = products[i].quantity;
                return `${quantidade}x ${nome}`;
            }).join(', ');
        }

        // Salvar o pedido
        await order.save();

        // Populando as informações do pedido
        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'name email')
            .populate('products.product', 'name price');

        // Exibindo informações detalhadas no console
        console.log('\n' + '='.repeat(50));
        console.log('📦 Pedido Criado com Sucesso!');
        console.log('👤 Cliente:', populatedOrder.nomeUsuario || populatedOrder.user.name, `<${populatedOrder.user.email}>`);
        
        console.log('\n📍 Endereço de Entrega:');
        console.log(`  Rua: ${populatedOrder.address.street}, Nº: ${populatedOrder.address.number}`);
        console.log(`  Bairro: ${populatedOrder.address.neighborhood}`);
        console.log(`  Cidade: ${populatedOrder.address.city} - ${populatedOrder.address.state}`);
        console.log(`  CEP: ${populatedOrder.address.cep}`);
        if (populatedOrder.address.complement) {
            console.log(`  Complemento: ${populatedOrder.address.complement}`);
        }

        console.log('\n🛒 Itens do Pedido:');
        populatedOrder.products.forEach((item, index) => {
            const nome = item.product?.name || 'Produto desconhecido';
            const preco = item.product?.price || 0;
            const subtotal = preco * item.quantity;
            console.log(`  ${index + 1}. ${nome}`);
            console.log(`     Quantidade: ${item.quantity}`);
            console.log(`     Preço unitário: R$ ${preco.toFixed(2)}`);
            console.log(`     Subtotal: R$ ${subtotal.toFixed(2)}`);
        });

        console.log('\n💰 Total do Pedido: R$ ' + populatedOrder.total.toFixed(2));
        console.log('📦 Status: ' + populatedOrder.status);
        console.log('🕒 Criado em: ' + new Date(populatedOrder.createdAt).toLocaleString());
        console.log('📝 Resumo do Pedido: ' + populatedOrder.resumoPedido);
        console.log('='.repeat(50) + '\n');

        // Retornar a resposta com as informações detalhadas
        res.status(201).json({
            message: 'Pedido criado com sucesso',
            order: populatedOrder
        });
    } catch (error) {
        console.error('❌ Erro ao criar pedido:', error);
        res.status(500).json({ message: 'Erro ao criar pedido' });
    }
});

// Buscar pedidos do usuário
router.get('/my-orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id })
            .populate('products.product')
            .sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error('❌ Erro ao buscar pedidos:', error);
        res.status(500).json({ message: 'Erro ao buscar pedidos' });
    }
});

module.exports = router;