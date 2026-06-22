import { Router } from 'express';
import { GestorArchivo } from '../models/GestorArchivo.js';

const router = Router();
const gestor = new GestorArchivo();

// Validaciones del lado del Servidor
const validarEstudiante = (estudiante) => {
    const { nombre, cedula, carrera, indice, notas } = estudiante;
    
    if (!nombre || nombre.trim().length < 4) return 'El nombre debe tener mínimo 4 letras.';
    if (!cedula || cedula.trim() === '') return 'La cédula es requerida.';
    if (!carrera || carrera === 'default' || carrera === 'Seleccione una Carrera') return 'Debe seleccionar una carrera válida.';
    
    let indiceParaValidar = parseFloat(indice);

    if (isNaN(indiceParaValidar) && Array.isArray(notas)) {
        const notasValidas = notas.map(n => parseFloat(n) || 0).filter(n => n > 0);
        if (notasValidas.length === 0) {
            indiceParaValidar = 0;
        } else {
            const suma = notasValidas.reduce((a, b) => a + b, 0);
            indiceParaValidar = parseFloat((suma / notasValidas.length).toFixed(2));
        }
    }

    if (isNaN(indiceParaValidar) || indiceParaValidar < 0 || indiceParaValidar > 20) {
        return 'El Índice Académico debe estar estrictamente entre 0 y 20.';
    }

    return null;
}

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
        
        if (estudiantes.some(e => e.cedula === req.body.cedula)) {
            return res.status(400).json({ error: 'La cédula ya se encuentra registrada.' });
        }

        // Estructuramos el nuevo registro asegurando que incluya 'foto' o silueta por defecto
        const nuevoEstudiante = {
            cedula: req.body.cedula.trim(),
            nombre: req.body.nombre.trim(),
            carrera: req.body.carrera,
            indice: parseFloat(req.body.indice) || 0,
            notas: req.body.notas || [0, 0, 0, 0],
            foto: req.body.foto || 'https://www.w3schools.com/howto/img_avatar.png' // ← Foto agregada
        };

        estudiantes.push(nuevoEstudiante);
        await gestor.guardar(estudiantes);
        res.status(201).json({ mensaje: 'Estudiante registrado con éxito.', estudiantes });
    } catch (error) {
        console.error("ERROR REAL EN EL SERVIDOR:", error);
        res.status(500).json({ error: 'Error al guardar el estudiante.' });
    }
});

// PUT: Editar un estudiante por Cédula (Y actualizar sus notas)
router.put('/:cedula', async (req, res) => {
    try {
        const { cedula } = req.params;
        const errorValidacion = validarEstudiante(req.body);
        if (errorValidacion) return res.status(400).json({ error: errorValidacion });

        let estudiantes = await gestor.leer();
        const index = estudiantes.findIndex(e => e.cedula === cedula);

        if (index === -1) return res.status(404).json({ error: 'Estudiante no encontrado.' });

        // Procesamos las notas y el promedio real antes de guardar
        const notasNumericas = (req.body.notas || estudiantes[index].notas || [0, 0, 0, 0]).map(n => parseFloat(n) || 0);
        const notasValidas = notasNumericas.filter(n => n > 0);
        const nuevoIndice = notasValidas.length > 0 
            ? parseFloat((notasValidas.reduce((a, b) => a + b, 0) / notasValidas.length).toFixed(2)) 
            : 0;

        // ======================================================================
        // PERSISTENCIA DE LA FOTO: Conserva la que viene en la petición,
        // la que ya tenía almacenada en el JSON, o el avatar por defecto.
        // ======================================================================
        const fotoPersistida = req.body.foto || estudiantes[index].foto || 'https://www.w3schools.com/howto/img_avatar.png';

        // Armamos el objeto definitivo incluyendo la propiedad 'foto'
        estudiantes[index] = {
            cedula: estudiantes[index].cedula,
            nombre: req.body.nombre ? req.body.nombre.trim() : estudiantes[index].nombre,
            carrera: req.body.carrera || estudiantes[index].carrera,
            notas: notasNumericas,
            indice: nuevoIndice,
            foto: fotoPersistida // ← ¡SOLUCIONADO! Ahora sí se almacena en el JSON
        };

        await gestor.guardar(estudiantes);
        res.json({ mensaje: 'Estudiante actualizado con éxito.', estudiantes });
    } catch (error) {
        console.error(error);
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
