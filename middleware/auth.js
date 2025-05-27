const jwt = require('jsonwebtoken');
const User = require('../models/User');

module.exports = async (req, res, next) => {
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
        console.error('❌ Erro de autenticação:', error);
        res.status(401).json({ message: 'Token inválido' });
    }
};