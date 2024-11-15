import Comunidad from "../models/comunidad.model.js";
import cloudinary from "cloudinary";
import GeneroLiterario from "../models/generoLiterario.model.js";
import Notification from '../models/notification.model.js'
import User from '../models/user.model.js'

// Crear una nueva comunidad
export const crearComunidad = async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      fotoComunidad,
      fotoBanner,
      generoLiterarios, // Asegúrate de que este nombre sea correcto
      admin,
      miembros,
      link,
    } = req.body;

    // Verificar si ya existe una comunidad con el mismo nombre
    const comunidadExistente = await Comunidad.findOne({ nombre });
    if (comunidadExistente) {
      return res.status(400).json({ error: "La comunidad ya existe." });
    }

    // Manejar la subida de las fotos, si existen
    let fotoComunidadUrl = null;
    let fotoBannerUrl = null;

    if (fotoComunidad) {
      const uploadedComunidadResponse = await cloudinary.uploader.upload(
        fotoComunidad,
        {
          folder: "comunidades", // Cambia este nombre de carpeta según tus necesidades
        }
      );
      fotoComunidadUrl = uploadedComunidadResponse.secure_url;
    }

    if (fotoBanner) {
      const uploadedBannerResponse = await cloudinary.uploader.upload(
        fotoBanner,
        {
          folder: "comunidades", // Cambia este nombre de carpeta según tus necesidades
        }
      );
      fotoBannerUrl = uploadedBannerResponse.secure_url;
    }

    // Inicializar un array para almacenar los IDs de los géneros literarios
    let generosGuardados = [];

    // Buscar los géneros literarios seleccionados
    if (generoLiterarios && generoLiterarios.length > 0) {
      const generos = await GeneroLiterario.find({
        _id: { $in: generoLiterarios },
      });
      if (generos.length !== generoLiterarios.length) {
        return res
          .status(400)
          .json({
            error: "Algunos géneros literarios seleccionados son inválidos.",
          });
      }
      // Guardar los géneros literarios de la comunidad
      generosGuardados = generos.map((genero) => genero._id);
    }

    // Crear la nueva comunidad
    const nuevaComunidad = new Comunidad({
      nombre,
      descripcion,
      fotoComunidad: fotoComunidadUrl, // Guardar la URL de la foto de la comunidad subida
      fotoBanner: fotoBannerUrl, // Guardar la URL del banner de la comunidad subida
      generoLiterarios: generosGuardados, // Asegúrate de guardar el array aquí
      admin,
      miembros,
      link,
    });

    // Notificar a los miembros seleccionados
    if (miembros && miembros.length > 0) {
      const notifications = miembros.map((miembro) => {
        return new Notification({
          de: admin, // El administrador es quien envía la notificación
          para: miembro,
          tipo: "comunidad",
          mensaje: `Te has unido a la nueva comunidad "${nuevaComunidad.nombre}".`,
        });
      });
      
      // Guardar todas las notificaciones
      await Notification.insertMany(notifications);
    }
    // Guardar la comunidad en la base de datos
    await nuevaComunidad.save();
    res.status(201).json({
      message: "Comunidad creada con éxito",
      comunidad: nuevaComunidad,
    });
  } catch (error) {
    console.error("Error al crear la comunidad:", error.message);
    res.status(500).json({ error: "Error al crear la comunidad." });
  }
};

export const obtenerComunidades = async (req, res) => {
  try {
    const comunidades = await Comunidad.find()
      .populate({ path: "miembros", select: "-contrasena" })
      .populate({ path: "admin", select: "-contrasena" });
    res.status(200).json(comunidades);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener comunidades activas o inactivas según el estado
export const obtenerComunidadesAct = async (req, res) => {
  try {
    const estado = true;
    const comunidades = await Comunidad.find({ estado: estado })
      .populate({ path: "miembros", select: "-contrasena" })
      .populate({ path: "admin", select: "-contrasena" });
    res.status(200).json(comunidades);
  } catch (error) {
    console.error("Error al obtener las comunidades:", error.message);
    res.status(500).json({ error: "Error al obtener las comunidades." });
  }
};
export const obtenerComunidadesDes = async (req, res) => {
  try {
    const estado = false;

    const comunidades = await Comunidad.find({ estado: estado })
      .populate({ path: "miembros", select: "-contrasena" })
      .populate({ path: "admin", select: "-contrasena" });
    res.status(200).json(comunidades);
  } catch (error) {
    console.error("Error al obtener las comunidades:", error.message);
    res.status(500).json({ error: "Error al obtener las comunidades." });
  }
};

// Obtener una comunidad por su ID
export const obtenerComunidadPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const comunidad = await Comunidad.findById(id)
      .populate("admin")
      .populate("miembros")
      .populate('generoLiterarios', 'nombre fotoGenero');
    if (!comunidad) {
      return res.status(404).json({ error: "Comunidad no encontrada." });
    }

    res.status(200).json(comunidad);
  } catch (error) {
    console.error("Error al obtener la comunidad:", error.message);
    res.status(500).json({ error: "Error al obtener la comunidad." });
  }
};

export const listarComunidadesMiembro = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar comunidades activas donde el usuario es miembro o creador
    const comunidadesMiembro = await Comunidad.find({
      estado: true,
      $or: [
        { miembros: userId },  // Usuario es miembro (comparación con String)
        { admin: userId }       // Usuario es creador (comparación con String)
      ]
    });

    if (comunidadesMiembro.length === 0) {
      return res.status(404).json({ message: "No eres miembro ni creador de ninguna comunidad activa." });
    }

    return res.status(200).json(comunidadesMiembro);
  } catch (error) {
    console.error("Error al listar comunidades de las que eres miembro o creador:", error.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
};

export const listarComunidadesNoMiembro = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar comunidades activas donde el usuario no es miembro ni administrador
    const comunidadesNoMiembro = await Comunidad.find({
      estado: true,
      miembros: { $nin: [userId] }, // Comunidades donde el usuario no es miembro
      admin: { $nin: [userId] } // Comunidades donde el usuario no es administrador
    });

    if (comunidadesNoMiembro.length === 0) {
      return res.status(404).json({ message: "No hay comunidades activas donde no seas miembro ni administrador." });
    }

    return res.status(200).json(comunidadesNoMiembro);
  } catch (error) {
    console.error("Error al listar comunidades de las que no eres miembro ni administrador:", error.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
};



// Controlador para que un usuario se una a una comunidad
// Controlador para que un usuario se una a una comunidad
export const unirseComunidad = async (req, res) => {
  try {
    const { comunidadId, userId } = req.body; // ID de la comunidad a la que quiere unirse

    // Validar que se reciban los datos necesarios
    if (!comunidadId || !userId) {
      return res.status(400).json({ error: "Faltan datos requeridos" });
    }

    // Buscar la comunidad
    const comunidad = await Comunidad.findById(comunidadId);
    if (!comunidad) {
      return res.status(404).json({ error: "Comunidad no encontrada" });
    }

    // Buscar la comunidad
    const miembroo = await User.findById(userId);
    if (!comunidad) {
      return res.status(404).json({ error: "Comunidad no encontrada" });
    }

    // Verificar si el usuario ya es miembro de la comunidad
    const esMiembro = comunidad.miembros.includes(userId);
    if (esMiembro) {
      return res
        .status(400)
        .json({ error: "Ya eres miembro de esta comunidad" });
    }

    // Agregar el usuario a la lista de miembros
    comunidad.miembros.push(userId);
    await comunidad.save();

    // Crear una notificación para el administrador de la comunidad
    const notification = new Notification({
      de: userId,
      para: comunidad.admin,
      tipo: "comunidad",
      mensaje: `${miembroo.nombre} se a unido a la comunidad "${comunidad.nombre}".`,
    });
    await notification.save();

    return res.status(200).json({
      message: "Te has unido a la comunidad con éxito",
      comunidad,
    });
  } catch (error) {
    console.error("Error al unirse a la comunidad:", error.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
};


export const salirComunidad = async (req, res) => {
  try {
    const { comunidadId, userId } = req.body; // ID de la comunidad y del usuario

    // Buscar la comunidad
    const comunidad = await Comunidad.findById(comunidadId);
    if (!comunidad) {
      return res.status(404).json({ error: "Comunidad no encontrada" });
    }

    // Verificar si el usuario es miembro de la comunidad
    const esMiembro = comunidad.miembros.some(
      (miembro) => miembro.toString() === userId
    );
    if (!esMiembro) {
      return res.status(400).json({ error: "No eres miembro de esta comunidad" });
    }

    // Eliminar el usuario de la lista de miembros
    comunidad.miembros = comunidad.miembros.filter(
      (miembro) => miembro.toString() !== userId
    );
    await comunidad.save();

    return res
      .status(200)
      .json({ message: "Has salido de la comunidad con éxito", comunidad });
  } catch (error) {
    console.error("Error al salir de la comunidad:", error.message);
    return res.status(500).json({ error: "Error en el servidor" });
  }
};


// Editar una comunidad
export const editarComunidad = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nombre,
      descripcion,
      link,
      fotoComunidad,
      fotoBanner,
      generoLiterarios,
      admin,
      estado,
    } = req.body;

    // Inicializar las URLs de las fotos
    let fotoComunidadUrl = null;
    let fotoBannerUrl = null;

    // Manejar la subida de la foto de la comunidad, si se proporciona
    if (fotoComunidad) {
      const uploadedComunidadResponse = await cloudinary.uploader.upload(
        fotoComunidad,
        {
          folder: "comunidades", // Cambia este nombre de carpeta según tus necesidades
        }
      );
      fotoComunidadUrl = uploadedComunidadResponse.secure_url;
    }

    // Manejar la subida del banner, si se proporciona
    if (fotoBanner) {
      const uploadedBannerResponse = await cloudinary.uploader.upload(
        fotoBanner,
        {
          folder: "comunidades", // Cambia este nombre de carpeta según tus necesidades
        }
      );
      fotoBannerUrl = uploadedBannerResponse.secure_url;
    }

    // Obtener la comunidad actual para realizar una actualización
    const comunidadActual = await Comunidad.findById(id);
    if (!comunidadActual) {
      return res.status(404).json({ error: "Comunidad no encontrada." });
    }

    // Actualizar los campos de la comunidad
    comunidadActual.nombre = nombre || comunidadActual.nombre; // Mantener el valor existente si no se proporciona uno nuevo
    comunidadActual.descripcion = descripcion || comunidadActual.descripcion;
    comunidadActual.link = link || comunidadActual.link
    comunidadActual.fotoComunidad =
      fotoComunidadUrl || comunidadActual.fotoComunidad; // Actualiza solo si hay una nueva URL
    comunidadActual.fotoBanner = fotoBannerUrl || comunidadActual.fotoBanner; // Actualiza solo si hay una nueva URL
    comunidadActual.generoLiterarios =
      generoLiterarios || comunidadActual.generoLiterarios;
      comunidadActual.admin = admin || comunidadActual.admin;
    comunidadActual.estado = estado || comunidadActual.estado;

    // Guardar los cambios en la base de datos
    await comunidadActual.save();

    res.status(200).json({
      message: "Comunidad actualizada con éxito",
      comunidad: comunidadActual,
    });
  } catch (error) {
    console.error("Error al actualizar la comunidad:", error.message);
    res.status(500).json({ error: "Error al actualizar la comunidad." });
  }
};

// Desactivar una comunidad
export const desactivarComunidad = async (req, res) => {
  try {
    const { id } = req.params;

    const comunidadActualizada = await Comunidad.findByIdAndUpdate(
      id,
      { estado: false },
      { new: true }
    );

    if (!comunidadActualizada) {
      return res.status(404).json({ error: "Comunidad no encontrada." });
    }

    res.status(200).json({
      message: "Comunidad desactivada con éxito",
      comunidad: comunidadActualizada,
    });
  } catch (error) {
    console.error("Error al desactivar la comunidad:", error.message);
    res.status(500).json({ error: "Error al desactivar la comunidad." });
  }
};

// Activar una comunidad
export const activarComunidad = async (req, res) => {
  try {
    const { id } = req.params;

    const comunidadActualizada = await Comunidad.findByIdAndUpdate(
      id,
      { estado: true },
      { new: true }
    );

    if (!comunidadActualizada) {
      return res.status(404).json({ error: "Comunidad no encontrada." });
    }

    res.status(200).json({
      message: "Comunidad activada con éxito",
      comunidad: comunidadActualizada,
    });
  } catch (error) {
    console.error("Error al activar la comunidad:", error.message);
    res.status(500).json({ error: "Error al activar la comunidad." });
  }
};

// Eliminar una comunidad
export const eliminarComunidad = async (req, res) => {
  try {
    const { id } = req.params;

    const comunidadEliminada = await Comunidad.findByIdAndDelete(id);

    if (!comunidadEliminada) {
      return res.status(404).json({ error: "Comunidad no encontrada." });
    }

    res.status(200).json({
      message: "Comunidad eliminada con éxito",
      comunidad: comunidadEliminada,
    });
  } catch (error) {
    console.error("Error al eliminar la comunidad:", error.message);
    res.status(500).json({ error: "Error al eliminar la comunidad." });
  }
};
