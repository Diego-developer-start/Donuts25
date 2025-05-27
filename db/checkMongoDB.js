const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Verifica se o MongoDB está rodando e tenta iniciá-lo se não estiver
 * @returns {Promise<boolean>} true se o MongoDB estiver rodando ou for iniciado com sucesso
 */
async function checkAndStartMongoDB() {
  console.log('Verificando se o MongoDB está rodando...');
  
  try {
    // Tenta executar um comando simples para verificar se o MongoDB está acessível
    await execPromise('mongosh --eval "db.version()" --quiet');
    console.log('✅ MongoDB já está rodando!');
    return true;
  } catch (error) {
    console.log('❌ MongoDB não está rodando. Tentando iniciar...');
    
    try {
      // Tenta iniciar o MongoDB
      // No Windows, tenta iniciar o serviço do MongoDB
      await execPromise('net start MongoDB');
      console.log('✅ Serviço MongoDB iniciado com sucesso!');
      return true;
    } catch (startError) {
      console.log('❌ Não foi possível iniciar o serviço MongoDB.');
      
      try {
        // Tenta iniciar o MongoDB diretamente
        console.log('Tentando iniciar o MongoDB diretamente...');
        // Executa o mongod em background
        const child = exec('mongod --dbpath="C:/data/db"', (error) => {
          if (error) {
            console.error('Erro ao iniciar MongoDB:', error);
          }
        });
        
        // Aguarda um tempo para o MongoDB iniciar
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        // Verifica se o MongoDB está rodando agora
        try {
          await execPromise('mongosh --eval "db.version()" --quiet');
          console.log('✅ MongoDB iniciado com sucesso!');
          return true;
        } catch (verifyError) {
          console.error('❌ Falha ao verificar se o MongoDB está rodando após tentativa de inicialização.');
          console.error('Detalhes do erro:', verifyError.message);
          return false;
        }
      } catch (directStartError) {
        console.error('❌ Falha ao iniciar o MongoDB diretamente.');
        console.error('Detalhes do erro:', directStartError.message);
        console.log('\nSugestões para resolver o problema:');
        console.log('1. Verifique se o MongoDB está instalado corretamente');
        console.log('2. Verifique se o diretório C:/data/db existe e tem permissões adequadas');
        console.log('3. Tente iniciar o MongoDB manualmente usando o comando: mongod --dbpath="C:/data/db"');
        console.log('4. Verifique se o serviço do MongoDB está configurado corretamente');
        return false;
      }
    }
  }
}

module.exports = { checkAndStartMongoDB };

// Se este arquivo for executado diretamente
if (require.main === module) {
  checkAndStartMongoDB()
    .then(success => {
      if (!success) {
        console.log('Não foi possível iniciar o MongoDB. Verifique as sugestões acima.');
        process.exit(1);
      }
    })
    .catch(err => {
      console.error('Erro inesperado:', err);
      process.exit(1);
    });
}