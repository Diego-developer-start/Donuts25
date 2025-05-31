const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();

const app = express();

// Importar rota do chatbot
const chatRouter = require('./routes/chat');

// Conexão com MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/donut-shop', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log('✅ Conectado ao MongoDB com sucesso!');
    console.log('📦 Database:', mongoose.connection.db.databaseName);
    console.log('🔌 Host:', mongoose.connection.host);
    console.log('🔑 Porta:', mongoose.connection.port);
})
.catch(err => {
    console.error('❌ Erro na conexão com MongoDB:', err);
    process.exit(1);
});

// Adicionar eventos de conexão
mongoose.connection.on('connected', () => {
    console.log('🟢 MongoDB conectado');
});

mongoose.connection.on('error', (err) => {
    console.error('🔴 Erro na conexão MongoDB:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('🟡 MongoDB desconectado');
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname)); // Servir arquivos estáticos da raiz do projeto

// Configuração do CORS
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    next();
});

// Modelos centralizados
const User = require('./models/User');
const Product = require('./models/Product');
const Order = require('./models/Order');
// O modelo Address será criado e importado se necessário
const addressSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    cep: { type: String, required: true },
    street: { type: String, required: true },
    number: { type: String, required: true },
    complement: { type: String },
    neighborhood: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    instructions: { type: String }
});

const Address = mongoose.model('Address', addressSchema);

// Contact Model
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model('Contact', contactSchema);

// Rotas de Autenticação
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        console.log('Tentativa de registro:', email);
        // Verifica se o usuário já existe
        const existingUser = await User.findOne({ email });
        console.log('Usuário existente:', existingUser); // Log detalhado
        if (existingUser) {
            return res.status(400).json({ message: 'Usuário já existe' });
        }

        // Criptografa a senha
        const hashedPassword = await bcrypt.hash(password, 10);

        // Cria novo usuário
        const user = new User({
            name,
            email,
            password: hashedPassword
        });

        await user.save();

        // Gera o token JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'sua-chave-secreta',
            { expiresIn: '24h' }
        );

        res.status(201).json({ token });
    } catch (error) {
        console.error('Erro ao criar usuário:', error); // Log detalhado para depuração
        res.status(500).json({ message: 'Erro ao criar usuário', error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log('Tentativa de login:', email);
        
        if (!email || !password) {
            console.log('Email ou senha não fornecidos');
            return res.status(400).json({ message: 'Email e senha são obrigatórios' });
        }

        // Procura o usuário
        const user = await User.findOne({ email });
        console.log('Usuário encontrado:', user ? 'Sim' : 'Não');
        
        if (!user) {
            console.log('Usuário não encontrado para o email:', email);
            return res.status(400).json({ message: 'Usuário não encontrado' });
        }

        // Verifica a senha
        const validPassword = await bcrypt.compare(password, user.password);
        console.log('Senha válida:', validPassword ? 'Sim' : 'Não');
        
        if (!validPassword) {
            console.log('Senha inválida para o usuário:', email);
            return res.status(400).json({ message: 'Senha inválida' });
        }

        // Gera o token JWT
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET || 'sua-chave-secreta',
            { expiresIn: '24h' }
        );

        console.log('Login bem-sucedido para:', email);
        res.json({ token });
    } catch (error) {
        console.error('Erro detalhado no login:', error);
        res.status(500).json({ message: 'Erro ao fazer login', error: error.message });
    }
});

// Middleware de autenticação
const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Token não fornecido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'sua-chave-secreta');
        const user = await User.findById(decoded.userId);
        
        if (!user) {
            return res.status(401).json({ message: 'Usuário não encontrado' });
        }

        req.user = user;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

// Rota para obter informações do usuário
app.get('/api/user', authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-password');
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar informações do usuário' });
    }
});

// Rotas de Produtos
app.get('/api/products', async (req, res) => {
    try {
        console.log('Buscando produtos...');
        const products = await Product.find();
        console.log('Produtos encontrados:', products.length);
        res.json(products);
    } catch (error) {
        console.error('Erro ao buscar produtos:', error);
        res.status(500).json({ message: 'Erro ao buscar produtos', error: error.message });
    }
});

// Rotas de Pedidos
app.post('/api/orders', authMiddleware, async (req, res) => {
    try {
        console.log('📦 Recebendo novo pedido...');
        const { products, total } = req.body;
        
        // Validação dos dados
        if (!products || !Array.isArray(products) || products.length === 0) {
            console.error('❌ Lista de produtos inválida:', products);
            return res.status(400).json({ 
                message: 'Lista de produtos inválida',
                received: products 
            });
        }

        if (!total || isNaN(total) || total <= 0) {
            console.error('❌ Total inválido:', total);
            return res.status(400).json({ 
                message: 'Total inválido',
                received: total 
            });
        }

        // Verificar se todos os produtos existem e validar quantidades
        for (const item of products) {
            if (!item.product || !item.quantity) {
                console.error('❌ Item de produto inválido:', item);
                return res.status(400).json({ 
                    message: 'Item de produto inválido',
                    received: item 
                });
            }

            if (item.quantity < 1) {
                console.error('❌ Quantidade inválida:', item.quantity);
                return res.status(400).json({ 
                    message: 'Quantidade deve ser maior que zero',
                    received: item.quantity 
                });
            }

            const product = await Product.findById(item.product);
            if (!product) {
                console.error('❌ Produto não encontrado:', item.product);
                return res.status(400).json({ 
                    message: `Produto não encontrado: ${item.product}`,
                    productId: item.product 
                });
            }
        }

        console.log('✅ Dados do pedido validados com sucesso');

        const order = new Order({
            user: req.user._id,
            products,
            total,
            address: req.body.address, // Adiciona o endereço ao pedido
            status: 'pendente'
        });
        
        console.log('📦 Criando pedido com endereço:', req.body.address);

        await order.save();
        console.log('✅ Pedido salvo no banco de dados');

        // Buscar o pedido com dados populados
        const populatedOrder = await Order.findById(order._id)
            .populate('user', 'name email')
            .populate('products.product', 'name price');

        // Exibir informações detalhadas do pedido
        console.log('\n📦 Pedido Criado com Sucesso!');
        console.log('👤 Cliente:', populatedOrder.user.name, `<${populatedOrder.user.email}>`);

        if (populatedOrder.address) {
            console.log('\n📍 Endereço de Entrega:');
            console.log(`  Rua: ${populatedOrder.address.street}, Nº: ${populatedOrder.address.number}`);
            console.log(`  Bairro: ${populatedOrder.address.neighborhood}`);
            console.log(`  Cidade: ${populatedOrder.address.city} - ${populatedOrder.address.state}`);
            console.log(`  CEP: ${populatedOrder.address.cep}`);
            if (populatedOrder.address.complement) {
                console.log(`  Complemento: ${populatedOrder.address.complement}`);
            }
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
        console.log('\n' + '='.repeat(50) + '\n');

        res.status(201).json({
            message: 'Pedido criado com sucesso',
            order: populatedOrder
        });
    } catch (error) {
        console.error('❌ Erro ao criar pedido:', {
            message: error.message,
            stack: error.stack,
            name: error.name,
            errors: error.errors
        });
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                message: 'Erro de validação do pedido',
                errors: Object.keys(error.errors).map(key => ({
                    field: key,
                    message: error.errors[key].message
                }))
            });
        }
        
        res.status(500).json({ 
            message: 'Erro ao criar pedido', 
            error: error.message,
            details: error.stack,
            type: error.name
        });
    }
});

// Rotas para salvar endereço
app.post('/api/addresses', authMiddleware, async (req, res) => {
    try {
        const address = new Address({
            userId: req.user.id,
            ...req.body
        });
        await address.save();
        res.status(201).json(address);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Rota para obter endereço do usuário
app.get('/api/addresses', authMiddleware, async (req, res) => {
    try {
        const address = await Address.findOne({ userId: req.user.id });
        if (!address) {
            return res.status(404).json({ message: 'Endereço não encontrado' });
        }
        res.json(address);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Contact Form Endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, phone, subject, message } = req.body;
        
        // Validate required fields
        if (!name || !email || !phone || !subject || !message) {
            return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
        }

        // Create new contact
        const contact = new Contact({
            name,
            email,
            phone,
            subject,
            message
        });

        await contact.save();
        res.status(201).json({ message: 'Mensagem enviada com sucesso!' });
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        res.status(500).json({ message: 'Erro ao enviar mensagem', error: error.message });
    }
});

// Rotas para servir as páginas HTML
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/login.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

app.get('/produtos', (req, res) => {
    res.sendFile(path.join(__dirname, 'produtos.html'));
});

app.get('/produtos.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'produtos.html'));
});

app.get('/contato', (req, res) => {
    res.sendFile(path.join(__dirname, 'contato.html'));
});

app.get('/contato.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'contato.html'));
});

app.get('/quemSomos', (req, res) => {
    res.sendFile(path.join(__dirname, 'quemSomos.html'));
});

app.get('/quemSomos.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'quemSomos.html'));
});

app.get('/unidades', (req, res) => {
    res.sendFile(path.join(__dirname, 'unidades.html'));
});

app.get('/unidades.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'unidades.html'));
});

app.get('/finalizarCompra', (req, res) => {
    res.sendFile(path.join(__dirname, 'finalizarCompra.html'));
});

app.get('/finalizarCompra.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'finalizarCompra.html'));
});

// Rota para a página de administração de contatos
app.get('/admin/contatos', (req, res) => {
    res.sendFile(path.join(__dirname, 'admin/contatos.html'));
});

// Importar rotas
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');
const contactRoutes = require('./routes/contact');

// Usar rotas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/contact', contactRoutes);

// Usar rota do chatbot
app.use('/api', chatRouter);

const PORT = process.env.PORT || 3000;

// Iniciar o servidor apenas após conectar ao MongoDB
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Acesse: http://localhost:${PORT}`);
});
app.use('/imagens', express.static(path.join(__dirname, 'imagens')));