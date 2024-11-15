import express from 'express';
import { protectRoutes } from '../middleware/protectRoutes.js';
import { activarLibro, crearLibro, desactivarLibro, editarLibro, eliminarLibro, obtenerLibro, obtenerLibroPorId, obtenerLibrosAct, obtenerLibrosDes } from '../controllers/libro.controller.js';

const router =express.Router();

router.post("/libros", protectRoutes, crearLibro);
router.get("/getlibros", protectRoutes, obtenerLibro);
router.get("/getlibrosact", protectRoutes, obtenerLibrosAct);
router.get("/getlibrosdes", protectRoutes, obtenerLibrosDes);
router.get("/getlibros/:id", protectRoutes, obtenerLibroPorId);
router.put("/putlibro/:id", protectRoutes, editarLibro);
router.put("/deslibro/:id", protectRoutes, desactivarLibro);
router.put("/actlibro/:id", protectRoutes, activarLibro);
router.delete("/deletelibro/:id", protectRoutes, eliminarLibro);

export default router; 