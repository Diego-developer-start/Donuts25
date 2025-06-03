const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const auth = require('../middleware/auth');

// Obter carrinho do usuário
router.get('/', auth, async (req, res) => {
    try {
        let cart = await Cart.findOne({ user: req.user._id })
            .populate('items.product', 'name price image');

        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
            await cart.save();
        }

        res.json({
            success: true,
            data: cart
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar carrinho',
            error: error.message
        });
    }
});

// Adicionar item ao carrinho
router.post('/items', auth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Validar produto
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Produto não encontrado'
            });
        }

        // Buscar ou criar carrinho
        let cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            cart = new Cart({ user: req.user._id, items: [] });
        }

        // Adicionar item
        await cart.addItem(productId, quantity, product.price);

        // Retornar carrinho atualizado
        const updatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'name price image');

        res.json({
            success: true,
            message: 'Item adicionado ao carrinho',
            data: updatedCart
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao adicionar item ao carrinho',
            error: error.message
        });
    }
});

// Atualizar quantidade de item
router.patch('/items/:productId', auth, async (req, res) => {
    try {
        const { quantity } = req.body;
        const { productId } = req.params;

        // Validar quantidade
        if (quantity < 1) {
            return res.status(400).json({
                success: false,
                message: 'Quantidade deve ser maior que zero'
            });
        }

        // Buscar carrinho
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Carrinho não encontrado'
            });
        }

        // Atualizar quantidade
        await cart.updateQuantity(productId, quantity);

        // Retornar carrinho atualizado
        const updatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'name price image');

        res.json({
            success: true,
            message: 'Quantidade atualizada',
            data: updatedCart
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao atualizar quantidade',
            error: error.message
        });
    }
});

// Remover item do carrinho
router.delete('/items/:productId', auth, async (req, res) => {
    try {
        const { productId } = req.params;

        // Buscar carrinho
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Carrinho não encontrado'
            });
        }

        // Remover item
        await cart.removeItem(productId);

        // Retornar carrinho atualizado
        const updatedCart = await Cart.findById(cart._id)
            .populate('items.product', 'name price image');

        res.json({
            success: true,
            message: 'Item removido do carrinho',
            data: updatedCart
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao remover item do carrinho',
            error: error.message
        });
    }
});

// Limpar carrinho
router.delete('/', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id });
        if (!cart) {
            return res.status(404).json({
                success: false,
                message: 'Carrinho não encontrado'
            });
        }

        await cart.clear();

        res.json({
            success: true,
            message: 'Carrinho limpo com sucesso'
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Erro ao limpar carrinho',
            error: error.message
        });
    }
});

// Obter carrinho formatado com nomes legíveis
router.get('/formatted', auth, async (req, res) => {
    try {
        const cart = await Cart.findOne({ user: req.user._id })
            .populate('user', 'name email')
            .populate('items.product', 'name price image description');

        if (!cart) {
            return res.json({
                success: true,
                message: 'Carrinho vazio',
                data: {
                    usuario: req.user.name,
                    email: req.user.email,
                    itens: [],
                    total: 0,
                    dataCriacao: new Date(),
                    dataAtualizacao: new Date()
                }
            });
        }

        const carrinhoFormatado = {
            id: cart._id,
            usuario: cart.user.name,
            email: cart.user.email,
            itens: cart.items.map(item => ({
                produto: item.product.name,
                descricao: item.product.description,
                quantidade: item.quantity,
                precoUnitario: `R$ ${item.price.toFixed(2)}`,
                subtotal: `R$ ${(item.price * item.quantity).toFixed(2)}`,
                imagem: item.product.image
            })),
            totalItens: cart.items.reduce((sum, item) => sum + item.quantity, 0),
            valorTotal: `R$ ${cart.total.toFixed(2)}`,
            dataCriacao: cart.createdAt.toLocaleString('pt-BR'),
            dataUltimaAtualizacao: cart.updatedAt.toLocaleString('pt-BR')
        };

        // Log formatado no console do servidor
        console.log('\n=== CARRINHO FORMATADO ===');
        console.log(`Usuário: ${carrinhoFormatado.usuario}`);
        console.log(`Email: ${carrinhoFormatado.email}`);
        console.log(`Total de Itens: ${carrinhoFormatado.totalItens}`);
        console.log(`Valor Total: ${carrinhoFormatado.valorTotal}`);
        console.log('\nItens do Carrinho:');
        carrinhoFormatado.itens.forEach((item, index) => {
            console.log(`${index + 1}. ${item.produto}`);
            console.log(`   Quantidade: ${item.quantidade}`);
            console.log(`   Preço Unitário: ${item.precoUnitario}`);
            console.log(`   Subtotal: ${item.subtotal}`);
            console.log('   ---');
        });
        console.log(`Data de Criação: ${carrinhoFormatado.dataCriacao}`);
        console.log(`Última Atualização: ${carrinhoFormatado.dataUltimaAtualizacao}`);
        console.log('========================\n');

        res.json({
            success: true,
            data: carrinhoFormatado
        });
    } catch (error) {
        console.error('❌ Erro ao buscar carrinho formatado:', error);
        res.status(500).json({
            success: false,
            message: 'Erro ao buscar carrinho formatado',
            error: error.message
        });
    }
});

module.exports = router;