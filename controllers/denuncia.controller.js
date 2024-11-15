import Comunidad from "../models/comunidad.model.js";
import Denuncia from "../models/denuncias.model.js";
import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import Resena from "../models/resena.model.js";
import { crearNotificacion } from "./notification.controller.js";

// Crear una nueva denuncia
// Crear una nueva denuncia
export const crearDenuncia = async (req, res) => {
  try {
    const {
      motivo,
      solucion,
      tipoDenuncia,
      idPublicacion,
      idComunidad,
      idResena,
      userId: denuncianteId,
    } = req.body;

    console.log("Tipo de denuncia recibido:", tipoDenuncia);

    const tiposValidos = ["publicacion", "comunidad", "resena"];
    if (!tiposValidos.includes(tipoDenuncia)) {
      return res.status(400).json({ error: "Tipo de denuncia no válido" });
    }

    // Identificar al usuario denunciado según el tipo de denuncia
    let denunciadoId = null;

    if (tipoDenuncia === "publicacion" && idPublicacion) {
      const publicacion = await Post.findById(idPublicacion);
      if (publicacion) {
        denunciadoId = publicacion.user; // ID del autor de la publicación
      }
    } else if (tipoDenuncia === "comunidad" && idComunidad) {
      const comunidad = await Comunidad.findById(idComunidad);
      if (comunidad) {
        denunciadoId = comunidad.admin; // ID del admin de la comunidad
      }
    } else if (tipoDenuncia === "resena" && idResena) {
      const resena = await Resena.findById(idResena);
      if (resena) {
        denunciadoId = resena.user; // ID del autor de la reseña
      }
    }

    if (!denunciadoId) {
      return res
        .status(404)
        .json({ error: "No se encontró el usuario denunciado." });
    }

    // Crear la nueva denuncia con el ID del denunciado
    const nuevaDenuncia = new Denuncia({
      motivo,
      solucion,
      idUsuario: denunciadoId, // El denunciado se guarda aquí
      idPublicacion: tipoDenuncia === "publicacion" ? idPublicacion : null,
      idComunidad: tipoDenuncia === "comunidad" ? idComunidad : null,
      idResena: tipoDenuncia === "resena" ? idResena : null,
    });

    // Crear una notificación para el usuario denunciado
    const notification = new Notification({
      de: denuncianteId, // Quien hace la denuncia
      para: denunciadoId, // El denunciado
      tipo: "denuncia",
      mensaje: `te a denunciado por ${motivo}`
    });

    // Guardar la denuncia y la notificación en la base de datos
    await nuevaDenuncia.save();
    await notification.save();

    res
      .status(201)
      .json({ message: "Denuncia creada con éxito", denuncia: nuevaDenuncia });
  } catch (error) {
    console.error("Error al crear la denuncia:", error.message);
    res.status(500).json({ error: "Error al crear la denuncia." });
  }
};

export const obtenerDenuncias = async (req, res) => {
  try {
    const denuncias = await Denuncia.find()
      .populate("idUsuario")
      .populate({
        path: "idPublicacion", // Aquí asegúrate que el modelo "Post" esté siendo utilizado.
        model: "Post", // Nombre registrado en Mongoose para las publicaciones.
      })
      .populate("idComunidad")
      .populate({ path: "idResena", model: "Resenas" });
    res.status(200).json(denuncias);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener todas las denuncias (activos o inactivos)
export const obtenerDenunciasAct = async (req, res) => {
  try {
    const estado = true;

    const denuncias = await Denuncia.find({ estado: estado })
      .populate("idUsuario")
      .populate({ path: "idPublicacion", model: "Post", select: "contenido" })
      .populate("idComunidad", "nombre")
      .populate({ path: "idResena", model: "Resenas", select: "contenido" });

    res.status(200).json({ denuncias });
  } catch (error) {
    console.error("Error al obtener las denuncias:", error.message);
    res.status(500).json({ error: "Error al obtener las denuncias." });
  }
};
export const obtenerDenunciasDes = async (req, res) => {
  try {
    const estado = false;

    const denuncias = await Denuncia.find({ estado: estado })
      .populate("idUsuario")
      .populate({
        path: "idPublicacion", // Aquí asegúrate que el modelo "Post" esté siendo utilizado.
        model: "Post", // Nombre registrado en Mongoose para las publicaciones.
      })
      .populate("idComunidad")
      .populate({ path: "idResena", model: "Resenas" });

    res.status(200).json({ denuncias });
  } catch (error) {
    console.error("Error al obtener las denuncias:", error.message);
    res.status(500).json({ error: "Error al obtener las denuncias." });
  }
};

// Obtener una denuncia por su ID, incluyendo comentarios de la publicación   pregunatr como funciona
export const obtenerDenunciaPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const denuncia = await Denuncia.findById(id)
      .populate("idUsuario", "nombre fotoPerfil")
      .populate({
        path: "idPublicacion",
        model: "Post",
        populate: {
          path: "comentarios",
          select: "text", // Suponiendo que "contenido" es el campo del comentario
        },
      })
      .populate("idComunidad", "nombre")
      .populate({ path: "idResena", model: "Resenas", select: "contenido" });

    if (!denuncia) {
      return res.status(404).json({ error: "Denuncia no encontrada." });
    }

    res.status(200).json({ denuncia });
  } catch (error) {
    console.error("Error al obtener la denuncia:", error.message);
    res.status(500).json({ error: "Error al obtener la denuncia." });
  }
};

// Editar una denuncia
export const editarDenuncia = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      motivo,
      solucion,
      idPublicacion,
      idComunidad,
      idResena,
      estado,
      idUsuario,
    } = req.body;

    const denunciaActualizada = await Denuncia.findByIdAndUpdate(
      id,
      {
        motivo,
        solucion,
        idPublicacion,
        idComunidad,
        idResena,
        idUsuario,
        estado,
      },
      { new: true, runValidators: true }
    );

    if (!denunciaActualizada) {
      return res.status(404).json({ error: "Denuncia no encontrada." });
    }

    res
      .status(200)
      .json({
        message: "Denuncia actualizada con éxito",
        denuncia: denunciaActualizada,
      });
  } catch (error) {
    console.error("Error al actualizar la denuncia:", error.message);
    res.status(500).json({ error: "Error al actualizar la denuncia." });
  }
};

// Desactivar una denuncia
export const desactivarDenuncia = async (req, res) => {
    try {
        const { id } = req.params;

        const denunciaActualizada = await Denuncia.findByIdAndUpdate(id, { estado: false }, { new: true });

        if (!denunciaActualizada) {
            return res.status(404).json({ error: "Denuncia no encontrada." });
        }

        // Crear notificación para el usuario
        const usuarioId = denunciaActualizada.idUsuario; // Asegúrate de que este campo contiene el ID del usuario que realizó la denuncia
        const notificacionData = {
            de: req.user._id,
            para: usuarioId,
            tipo: 'denuncia',
            mensaje: 'Tu denuncia ha sido desactivada.'
        };
        
        await crearNotificacion({ body: notificacionData }); // Cambiado para no pasar 'res'

        res.status(200).json({ message: "Denuncia desactivada con éxito", denuncia: denunciaActualizada });
    } catch (error) {
        console.error("Error al desactivar la denuncia:", error.message);
        res.status(500).json({ error: "Error al desactivar la denuncia." });
    }
};

// Activar una denuncia
export const activarDenuncia = async (req, res) => {
    try {
        const { id } = req.params;

        const denunciaActualizada = await Denuncia.findByIdAndUpdate(id, { estado: true }, { new: true });

        if (!denunciaActualizada) {
            return res.status(404).json({ error: "Denuncia no encontrada." });
        }

        // Crear notificación para el usuario
        const usuarioId = denunciaActualizada.idUsuario; // Asegúrate de que este campo contiene el ID del usuario que realizó la denuncia
        const notificacionData = {
            de: req.user._id,
            para: usuarioId,
            tipo: 'denuncia',
            mensaje: 'Tu denuncia ha sido activada.'
        };

        await crearNotificacion({ body: notificacionData }); // Cambiado para no pasar 'res'

        res.status(200).json({ message: "Denuncia activada con éxito", denuncia: denunciaActualizada });
    } catch (error) {
        console.error("Error al activar la denuncia:", error.message);
        res.status(500).json({ error: "Error al activar la denuncia." });
    }
};


// Eliminar una denuncia
export const eliminarDenuncia = async (req, res) => {
  try {
    const { id } = req.params;

    const denunciaEliminada = await Denuncia.findByIdAndDelete(id);

    if (!denunciaEliminada) {
      return res.status(404).json({ error: "Denuncia no encontrada." });
    }

    res
      .status(200)
      .json({
        message: "Denuncia eliminada con éxito",
        denuncia: denunciaEliminada,
      });
  } catch (error) {
    console.error("Error al eliminar la denuncia:", error.message);
    res.status(500).json({ error: "Error al eliminar la denuncia." });
  }
};
