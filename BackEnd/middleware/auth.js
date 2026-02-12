// middleware/auth.js
import jwt from 'jsonwebtoken';

export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "Não autorizado: Token em falta" });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Armazenamos o utilizador no request para usar nas rotas seguintes
      req.user = decoded; 

      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ 
            message: `Acesso negado: cargo '${req.user.role}' não tem permissão.` 
        });
      }

      next();
    } catch (err) {
      return res.status(401).json({ message: "Token inválido ou expirado" });
    }
  };
};