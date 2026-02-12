// middleware/auth.js
import jwt from 'jsonwebtoken';

export const authorize = (allowedRoles = []) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: "Não autorizado: Token em falta" });
    }

    try {
      // 2. Verifica o token 
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded; // Aqui o req.user passa a ter o id e o role

      // 3. Verifica se o cargo do utilizador está na lista de permitidos
      if (allowedRoles.length > 0 && !allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: "Acesso negado: cargo insuficiente" });
      }

      next(); // Tudo ok, avança para a rota
    } catch (err) {
      return res.status(401).json({ message: "Token inválido" });
    }
  };
};