import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
// Fíjate que ahora añadimos "backend/" a la ruta porque el archivo está afuera
import rutasEstudiantes from './backend/routes/estudiantes.routes.js'; 

const app = express();
const PORT = process.env.PORT || 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.json());

// Al estar en la raíz, 'frontend' está al mismo nivel. Ya no hace falta el '../'
app.use(express.static(path.join(__dirname, 'frontend')));

app.use('/api/estudiantes', rutasEstudiantes);

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
