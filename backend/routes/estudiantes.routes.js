import { Router } from 'express';
import { GestorArchivo } from '../models/GestorArchivo.js';

const router = Router();
const gestor = new GestorArchivo();

// Validaciones del lado del Servidor
const validarEstudiante = (estudiante) => {
    const { nombre, cedula, carrera, indice } = estudiante;
    if (!nombre || nombre.trim().length < 4) return 'El nombre debe tener mínimo 4 letras.';
    if (!cedula || cedula.trim() === '') return 'La cédula es requerida.';
    if (!carrera || carrera === 'default') return 'Debe seleccionar una carrera válida.';
    
    const numIndice = parseFloat(indice);
    if (isNaN(numIndice) || numIndice < 1 || numIndice > 20) {
        return 'El Índice Académico debe estar estrictamente entre 1 y 20.';
    }
    return null;
};

// GET: Obtener todos los estudiantes
router.get('/', async (req, res) => {
    try {
        const estudiantes = await gestor.leer();
        res.json(estudiantes);
    } catch (error) {
        res.status(500).json({ error: 'Error al leer los datos.' });
    }
});

// POST: Crear un estudiante
router.post('/', async (req, res) => {
    try {
        const errorValidacion = validarEstudiante(req.body);
        if (errorValidacion) return res.status(400).json({ error: errorValidacion });

        const estudiantes = await gestor.leer();
        
        // Evitar cédulas duplicadas al crear
        if (estudiantes.some(e => e.cedula === req.body.cedula)) {
            return res.status(400).json({ error: 'La cédula ya se encuentra registrada.' });
        }

        estudiantes.push(req.body);
        await gestor.guardar(estudiantes);
        res.status(201).json({ mensaje: 'Estudiante registrado con éxito.', estudiantes });
    } catch (error) {
    console.error("ERROR REAL EN EL SERVIDOR:", error);
        res.status(500).json({ error: 'Error al guardar el estudiante.' });
    }
});

// PUT: Editar un estudiante por Cédula
router.put('/:cedula', async (req, res) => {
    try {
        const { cedula } = req.params;
        const errorValidacion = validarEstudiante(req.body);
        if (errorValidacion) return res.status(400).json({ error: errorValidacion });

        let estudiantes = await gestor.leer();
        const index = estudiantes.findIndex(e => e.cedula === cedula);

        if (index === -1) return res.status(404).json({ error: 'Estudiante no encontrado.' });

        // Actualizamos los datos
        estudiantes[index] = req.body;
        await gestor.guardar(estudiantes);
        res.json({ mensaje: 'Estudiante actualizado con éxito.', estudiantes });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar el estudiante.' });
    }
});

// DELETE: Eliminar un estudiante
router.delete('/:cedula', async (req, res) => {
    try {
        const { cedula } = req.params;
        let estudiantes = await gestor.leer();
        
        const existe = estudiantes.some(e => e.cedula === cedula);
        if (!existe) return res.status(404).json({ error: 'Estudiante no encontrado.' });

        estudiantes = estudiantes.filter(e => e.cedula !== cedula);
        await gestor.guardar(estudiantes);
        res.json({ mensaje: 'Estudiante eliminado con éxito.', estudiantes });
    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar el estudiante.' });
    }
});

export default router;
