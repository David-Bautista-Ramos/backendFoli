export const protectRoutes = async (req, res, next) => {
    try {
        // Leer el token de las cookies
        const token = req.cookies.jwt;

        console.log("Token recibido:", token); // Verifica si el token se recibe correctamente

        if (!token) {
            console.log("Sin autorización: No se proporcionó el token");
            return res.status(401).json({ error: "Sin Autorización: No proporciona el Token" });
        }

        // Verificar el token
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
        console.log("Error en el middleware protectRoutes:", error.message);
        return res.status(500).json({ error: "Error server interno" });
    }
};
