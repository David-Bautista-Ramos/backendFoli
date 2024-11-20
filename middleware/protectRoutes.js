import User from '../models/user.model.js';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config(); // Asegúrate de cargar las variables de entorno

export const protectRoutes = async (req, res, next)=>{
    try {
        const token = req.cookies.jwt;
        console.log('Token recibido:', token); // Log para verificar si el token se recibe

        if(!token) {
            return res.status(401).json({error: "Sin Autorización: No proporiona el Token"});
        }
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
        console.log("Error in protectRoutes middleware",error.message);
        return res.status(500).json({error:"Error server interno"})
    }
}