import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

export const protectRoutes = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1]; // 'Bearer <token>'
    
    if (!token) {
      return res.status(401).json({ error: "No se proporcionó el token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verificar el token con la clave secreta
    if (!decoded) {
      return res.status(401).json({ error: "Token inválido" });
    }

    const user = await User.findById(decoded.userId).select("-password"); // Obtener el usuario por el ID en el token
    if (!user) {
      return res.status(404).json({ error: "Usuario no encontrado" });
    }

    req.user = user; // Asignar usuario al objeto de la solicitud para usar en el resto de las rutas
    next(); // Continuar con la siguiente función del middleware
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error en el servidor" });
  }
};
