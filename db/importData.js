const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config(); // Carrega variáveis de ambiente do arquivo .env

// Modelos
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

// URLs de conexão com o MongoDB
const urls = [
  process.env.MONGODB_URI,
  'mongodb://localhost:27017/donut-shop',
  'mongodb://127.0.0.1:27017/donut-shop',
  'mongodb://0.0.0.0:27017/donut-shop'
].filter(Boolean); // Remove valores nulos ou undefined

console.log('URLs de conexão disponíveis:', urls);

// Importar o verificador de MongoDB
const { checkAndStartMongoDB } = require('./checkMongoDB');

// Verificar e iniciar o MongoDB antes de importar
const prepareDatabase = async () => {
  const isMongoDBRunning = await checkAndStartMongoDB();
  if (!isMongoDBRunning) {
    console.error('Não foi possível garantir que o MongoDB está rodando. A importação pode falhar.');
    console.error('Tente iniciar o MongoDB manualmente antes de executar este script.');
  } else {
    console.log('MongoDB está pronto para a importação de dados.');
  }
};

// Função para importar dados
async function importData() {
  try {
    // Conectar ao MongoDB usando mongoose
    console.log('Tentando conectar ao MongoDB...');
    
    // Opções de conexão melhoradas
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 30000, // Aumentado para 30 segundos
      connectTimeoutMS: 30000,
      socketTimeoutMS: 60000,
      family: 4, // Força IPv4
      retryWrites: true,
      w: 'majority',
      maxPoolSize: 10,
      minPoolSize: 1,
      maxIdleTimeMS: 30000,
      keepAlive: true
    };
    
    let connected = false;
    let lastError = null;
    
    // Tentar cada URL de conexão com retry
    const maxRetries = 3;
    
    for (const url of urls) {
      let retryCount = 0;
      
      while (retryCount < maxRetries && !connected) {
        try {
          console.log(`Tentando conectar usando: ${url} (tentativa ${retryCount + 1}/${maxRetries})`);
          await mongoose.connect(url, options);
          console.log(`Conectado ao MongoDB com sucesso usando: ${url}`);
          connected = true;
          break; // Sai do loop se conectar com sucesso
        } catch (err) {
          console.error(`Erro ao conectar usando ${url} (tentativa ${retryCount + 1}/${maxRetries}):`, err.message);
          lastError = err;
          retryCount++;
          
          if (retryCount < maxRetries) {
            // Espera antes de tentar novamente (backoff exponencial)
            const waitTime = 1000 * Math.pow(2, retryCount);
            console.log(`Aguardando ${waitTime}ms antes de tentar novamente...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          }
        }
      }
      
      if (connected) break; // Sai do loop de URLs se conectou com sucesso
    }
    
    if (!connected) {
      console.error('Todas as tentativas de conexão falharam');
      throw new Error('Não foi possível conectar ao MongoDB: ' + (lastError ? lastError.message : 'Erro desconhecido'));
    }
    
    // Verificar conexão
    try {
      await mongoose.connection.db.admin().ping();
      console.log('Conexão com MongoDB verificada com sucesso!');
    } catch (pingErr) {
      console.warn('Aviso: Não foi possível verificar a conexão com ping:', pingErr.message);
      // Continua mesmo sem conseguir fazer ping
    }

    // Ler o arquivo JSON
    const dataPath = path.join(__dirname, 'initialData.json');
    console.log(`Lendo arquivo de dados: ${dataPath}`);
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // Importar usuários
    if (data.users && data.users.length > 0) {
      console.log(`Importando ${data.users.length} usuários...`);
      // Verificar se já existem usuários com os mesmos emails
      for (const user of data.users) {
        const existingUser = await User.findOne({ email: user.email });
        if (!existingUser) {
          await User.create(user);
          console.log(`Usuário ${user.email} importado com sucesso`);
        } else {
          console.log(`Usuário ${user.email} já existe, pulando...`);
        }
      }
      console.log('Processo de importação de usuários concluído');
    }

    // Importar produtos
    if (data.products && data.products.length > 0) {
      console.log(`Importando ${data.products.length} produtos...`);
      // Remover campos 'id' dos produtos antes de inserir
      const productsToInsert = data.products.map(({ id, ...rest }) => rest);
      await Product.insertMany(productsToInsert);
      console.log('Produtos importados com sucesso');
    }

    // Importar lojas
    if (data.stores && data.stores.length > 0) {
      console.log(`Importando ${data.stores.length} lojas...`);
      // Criar modelo Store se não existir
      const storeSchema = new mongoose.Schema({
        name: String,
        address: String,
        hours: String,
        description: String,
        image: String
      });
      // Usar o modelo apenas se não estiver registrado
      const Store = mongoose.models.Store || mongoose.model('Store', storeSchema);
      // Remover campos 'id' das lojas antes de inserir
      const storesToInsert = data.stores.map(({ id, ...rest }) => rest);
      await Store.insertMany(storesToInsert);
      console.log('Lojas importadas com sucesso');
    }

    // Importar pedidos
    if (data.orders && data.orders.length > 0) {
      console.log(`Importando ${data.orders.length} pedidos...`);
      await Order.insertMany(data.orders);
      console.log('Pedidos importados com sucesso');
    }

    console.log('Importação concluída com sucesso!');

  } catch (err) {
    console.error('\n===== ERRO DURANTE A IMPORTAÇÃO =====');
    console.error(`Mensagem de erro: ${err.message || err}`);
    
    if (err.stack) {
      console.error('\nStack trace detalhado:');
      console.error(err.stack);
    }
    
    // Verificar erros específicos de conexão com MongoDB
    if (err.name === 'MongoNetworkError' || err.message.includes('connect')) {
      console.error('\n===== ERRO DE CONEXÃO COM MONGODB =====');
      console.error('Possíveis soluções:');
      console.error('1. Verifique se o servidor MongoDB está rodando na porta 27017');
      console.error('2. Execute o comando: mongod --dbpath="C:/data/db"');
      console.error('3. Verifique se há algum firewall bloqueando a conexão');
      console.error('4. Tente reiniciar o serviço do MongoDB');
      console.error('5. Verifique se as credenciais de acesso estão corretas (se aplicável)');
    } else if (err.name === 'ValidationError') {
      console.error('\n===== ERRO DE VALIDAÇÃO DOS DADOS =====');
      console.error('Detalhes dos erros de validação:');
      for (const field in err.errors) {
        console.error(`- Campo '${field}': ${err.errors[field].message}`);
      }
    } else if (err.name === 'MongoServerSelectionError') {
      console.error('\n===== ERRO DE SELEÇÃO DO SERVIDOR MONGODB =====');
      console.error('O servidor MongoDB não pôde ser selecionado. Possíveis causas:');
      console.error('1. O servidor MongoDB não está rodando');
      console.error('2. A porta 27017 está bloqueada ou em uso por outro processo');
      console.error('3. O endereço IP ou hostname está incorreto');
    }
    
    console.error('\n===== DIAGNÓSTICO DO SISTEMA =====');
    try {
      const os = require('os');
      console.error(`Sistema Operacional: ${os.platform()} ${os.release()}`);
      console.error(`Memória Total: ${Math.round(os.totalmem() / (1024 * 1024 * 1024))} GB`);
      console.error(`Memória Livre: ${Math.round(os.freemem() / (1024 * 1024 * 1024))} GB`);
      console.error(`Hostname: ${os.hostname()}`);
      console.error(`Versão do Node.js: ${process.version}`);
      console.error(`Versão do Mongoose: ${mongoose.version}`);
    } catch (diagErr) {
      console.error('Erro ao coletar informações de diagnóstico:', diagErr.message);
    }
  } finally {
    try {
      if (mongoose.connection.readyState !== 0) { // 0 = desconectado
        await mongoose.disconnect();
        console.log('Conexão com o MongoDB fechada com sucesso');
      } else {
        console.log('Não havia conexão ativa com o MongoDB para fechar');
      }
    } catch (closeErr) {
      console.error('Erro ao fechar conexão com MongoDB:', closeErr.message);
    }
  }
}

// Executar a verificação e depois a importação
async function main() {
  await prepareDatabase();
  await importData();
}

main().catch(err => {
  console.error('Erro na execução principal:', err.message);
  process.exit(1);
});