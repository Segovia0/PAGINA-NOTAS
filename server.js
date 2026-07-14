const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = 3000;
const JSON_PATH = path.join(__dirname, 'data', 'estudiantes.json');

// Middlewares obligatorios
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuración de Multer para almacenar archivos físicos con nombres únicos
const storage = multer.diskStorage({
    destination: 'uploads/',
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Lectura y Escritura Segura del JSON
async function leerEstudiantes() {
    try {
        const data = await fs.readFile(JSON_PATH, 'utf-8');
        return JSON.parse(data);
    } catch (error) {
        return []; // Retorna vacío si el archivo no existe aún
    }
}
async function guardarEstudiantes(data) {
    await fs.writeFile(JSON_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Lógica matemática centralizada para el cálculo de notas
function calcularRendimiento(n1, n2, n3, n4) {
    const notas = [parseFloat(n1), parseFloat(n2), parseFloat(n3), parseFloat(n4)];
    const promedio = parseFloat((notas.reduce((a, b) => a + b, 0) / 4).toFixed(2));
    
    let estatus = 'Reprobado';
    if (promedio >= 12) estatus = 'Aprobado';
    else if (promedio >= 10) estatus = 'Recuperación';
    
    return { notas, promedio, estatus };
}

// --- ENDPOINTS DE LA API REST ---

// GET: Listar todos los estudiantes
app.get('/api/estudiantes', async (req, res) => {
    res.json(await leerEstudiantes());
});

// GET: Cuadro de Honor (Filtro exclusivo para promedios >= 18)
app.get('/api/estudiantes/honor', async (req, res) => {
    const estudiantes = await leerEstudiantes();
    res.json(estudiantes.filter(e => e.promedio >= 18));
});

// POST: Registrar nuevo estudiante (Con interceptor de imagen)
app.post('/api/estudiantes', upload.single('foto'), async (req, res) => {
    try {
        const { cedula, nombre, pnf, nota1, nota2, nota3, nota4 } = req.body;
        const estudiantes = await leerEstudiantes();

        if (estudiantes.some(e => e.cedula === cedula)) {
            return res.status(400).json({ error: 'La cédula introducida ya está registrada.' });
        }

        const rendimiento = calcularRendimiento(nota1, nota2, nota3, nota4);
        const fotoNombre = req.file ? req.file.filename : 'default-avatar.png';

        const nuevoEstudiante = {
            cedula,
            nombre,
            pnf,
            notas: rendimiento.notas,
            promedio: rendimiento.promedio,
            estatus: rendimiento.estatus,
            foto: fotoNombre
        };

        estudiantes.push(nuevoEstudiante);
        await guardarEstudiantes(estudiantes);
        res.status(201).json(nuevoEstudiante);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT: Actualizar/Editar datos de un estudiante existente
app.put('/api/estudiantes/:cedula', upload.single('foto'), async (req, res) => {
    try {
        const { cedula } = req.params;
        const { nombre, pnf, nota1, nota2, nota3, nota4 } = req.body;
        let estudiantes = await leerEstudiantes();
        
        const index = estudiantes.findIndex(e => e.cedula === cedula);
        if (index === -1) return res.status(404).json({ error: 'Estudiante no encontrado.' });

        const rendimiento = calcularRendimiento(nota1, nota2, nota3, nota4);
        let fotoNombre = estudiantes[index].foto;

        // Si se subió una nueva foto, reemplaza la anterior y borra la vieja del disco físico
        if (req.file) {
            if (fotoNombre !== 'default-avatar.png') {
                try { await fs.unlink(path.join(__dirname, 'uploads', fotoNombre)); } catch(e){}
            }
            fotoNombre = req.file.filename;
        }

        estudiantes[index] = {
            ...estudiantes[index],
            nombre,
            pnf,
            notas: rendimiento.notas,
            promedio: rendimiento.promedio,
            estatus: rendimiento.estatus,
            foto: fotoNombre
        };

        await guardarEstudiantes(estudiantes);
        res.json(estudiantes[index]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE: Eliminar estudiante y su foto asociada
app.delete('/api/estudiantes/:cedula', async (req, res) => {
    const { cedula } = req.params;
    let estudiantes = await leerEstudiantes();
    const estudiante = estudiantes.find(e => e.cedula === cedula);

    if (!estudiante) return res.status(404).json({ error: 'Registro no encontrado.' });

    if (estudiante.foto && estudiante.foto !== 'default-avatar.png') {
        try { await fs.unlink(path.join(__dirname, 'uploads', estudiante.foto)); } catch (e) {}
    }

    estudiantes = estudiantes.filter(e => e.cedula !== cedula);
    await guardarEstudiantes(estudiantes);
    res.json({ success: true });
});

// Levantar el servidor asegurando la existencia de directorios
app.listen(PORT, async () => {
    await fs.mkdir(path.join(__dirname, 'data'), { recursive: true });
    await fs.mkdir(path.join(__dirname, 'uploads'), { recursive: true });
    console.log(`Servidor de Control de Estudio corriendo en http://localhost:${PORT}`);
});
