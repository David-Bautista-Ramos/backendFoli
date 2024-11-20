import User from '../models/user.model.js';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config(); // Asegúrate de cargar las variables de entorno

export const protectRoutes = async (req, res, next) => {
    try {
        // Obtener el token de las cookies
        const token = req.cookies.jwt;
        console.log('Token recibido:', token); // Log para verificar si el token se recibe

        if (!token) {
            console.log('Sin autorización: No se proporcionó el token');
            return res.status(401).json({ error: "Sin Autorización: No proporciona el Token" });
        }

        // Verificar el token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Token decodificado:', decoded); // Log para verificar el contenido del token

        if (!decoded) {
            console.log('Sin autorización: Token inválido');
            return res.status(401).json({ error: "Sin Autorización: Token inválido" });
        }

        // Buscar al usuario en la base de datos
        const user = await User.findById(decoded.userId).select("-contrasena");
        console.log('Usuario encontrado:', user); // Log para confirmar que el usuario existe

        if (!user) {
            console.log('Usuario no encontrado');
            return res.status(404).json({ error: "Usuario no encontrado" });
        }

        // Asignar el usuario a req.user para las siguientes rutas
        req.user = user;
        next();
    } catch (error) {
        console.log("Error en el middleware protectRoutes:", error.message); // Log para cualquier error interno
        return res.status(500).json({ error: "Error server interno" });
    }
};
