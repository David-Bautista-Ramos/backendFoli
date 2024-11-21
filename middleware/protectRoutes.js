import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/user.model.js';

dotenv.config();

export const protectRoutes = async (req, res, next) => {
  try {
    const token = req.headers['authorization']?.split(' ')[1];
    console.log("el token:" , token)
    if (!token) {
      return res.status(401).json({ error: "No se proporcionó el token" });
    }
    
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            console.log("Token inválido:", err.message); // Log de error para diagnosticar problemas
            return res.status(401).json({ error: "Sin Autorización: Token inválido" });
        }
        console.log("Token decodificado:", decoded); // Log para verificar el contenido del token
        // Buscar al usuario en la base de datos
        const user = await User.findById(decoded.userId).select("-contrasena");
        if (!user) {
            console.log("Usuario no encontrado");
            return res.status(404).json({ error: "Usuario no encontrado" });
        }
        // Asignar el usuario a req.user
        req.user = user;
        next(); // Continuar con la siguiente función
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error en el servidor" });
  }
};
