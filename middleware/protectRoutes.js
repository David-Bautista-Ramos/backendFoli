import User from '../models/user.model.js';
import jwt from "jsonwebtoken";
import dotenv from 'dotenv';

dotenv.config(); // Asegúrate de cargar las variables de entorno

export const protectRoutes = async (req, res, next)=>{
    try {
        const token = req.cookies['rw.authenticated'];  // Usa el nombre correcto de la cookie
        if(!token) {
            return res.status(401).json({error: "Sin Autorización: No proporiona el Token"});
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded) {
            return res.status(401).json({error:"Sin Autorización:Token invalido"})
        }

        const user =await User.findById(decoded.userId).select("-contrasena");

        if(!user){
            return res.status(404).json({error:"Usuario no encontrado"})
        }

        req.user=user;
        next();
    } catch (error) {
        console.log("Error in protectRoutes middleware",error.message);
        return res.status(500).json({error:"Error server interno"})
    }
}