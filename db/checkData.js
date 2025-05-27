const mongoose = require('mongoose');
require('dotenv').config();

// Modelos
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
const Contact = require('../models/Contact');

async function checkDatabase() {
    try {
        // Conectar ao MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/donut-shop', {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('✅ Conectado ao MongoDB');

        // Verificar coleções
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('\n📚 Coleções encontradas:');
        collections.forEach(collection => {
            console.log(`- ${collection.name}`);
        });

        // Contar documentos em cada coleção
        console.log('\n📊 Contagem de documentos:');
        const userCount = await User.countDocuments();
        const productCount = await Product.countDocuments();
        const orderCount = await Order.countDocuments();
        const contactCount = await Contact.countDocuments();

        console.log(`👤 Usuários: ${userCount}`);
        console.log(`🍩 Produtos: ${productCount}`);
        console.log(`📦 Pedidos: ${orderCount}`);
        console.log(`📝 Contatos: ${contactCount}`);

        // Verificar índices
        console.log('\n🔍 Índices:');
        for (const collection of collections) {
            const indexes = await mongoose.connection.db.collection(collection.name).indexes();
            console.log(`\n${collection.name}:`);
            indexes.forEach(index => {
                console.log(`- ${JSON.stringify(index.key)}`);
            });
        }

        // Verificar integridade dos dados
        console.log('\n🔎 Verificando integridade dos dados...');
        
        // Verificar usuários
        const users = await User.find();
        console.log('\n👤 Usuários:');
        users.forEach(user => {
            console.log(`- ${user.name} (${user.email})`);
        });

        // Verificar produtos
        const products = await Product.find();
        console.log('\n🍩 Produtos:');
        products.forEach(product => {
            console.log(`- ${product.name} (R$ ${product.price})`);
        });

        // Verificar pedidos
        const orders = await Order.find().populate('user', 'name email');
        console.log('\n📦 Pedidos:');
        orders.forEach(order => {
            console.log(`- Pedido #${order._id} - Cliente: ${order.user?.name || 'N/A'}`);
        });

        // Verificar contatos
        const contacts = await Contact.find();
        console.log('\n📝 Contatos:');
        contacts.forEach(contact => {
            console.log(`- ${contact.name} (${contact.email}) - ${contact.subject}`);
        });

    } catch (error) {
        console.error('❌ Erro:', error);
    } finally {
        // Fechar conexão
        await mongoose.connection.close();
        console.log('\n👋 Conexão com MongoDB fechada');
    }
}

// Executar verificação
checkDatabase(); 