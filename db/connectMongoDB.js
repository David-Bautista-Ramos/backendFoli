import mongoose from "mongoose";

const connectMongoDB = async () => {
    try {
        const mongoURI = "mongodb+srv://DavidB:1031829993@cluster0.vbavo.mongodb.net/Folira?retryWrites=true&w=majority&appName=Cluster0"; // Coloca tu URL aquí
        const conn = await mongoose.connect(mongoURI);
        console.log(`MongoDB conectado: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error en la conexion a mongoDB: ${error.message}`);
        process.exit(1);
    }
};

export default connectMongoDB;
