import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { GestorArchivo } from '../models/GestorArchivo.js';
import path from 'path';
import { fileURLToPath } from 'url';

const router = Router();

// Reconstruimos __dirname para saber exactamente dónde buscar el usuarios.json
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Instanciamos el GestorArchivo apuntando específicamente a usuarios.json
const rutaUsuarios = path.join(__dirname, '../data/usuarios.json');
const gestorUsuarios = new GestorArchivo();
// Le sobreescribimos la propiedad de ruta al gestor para este caso
gestorUsuarios.rutaArchivo = rutaUsuarios;

// Clave secreta para firmar los Tokens (En producción iría en un .env)
const JWT_SECRET = 'clave_secreta_super_segura_control_notas_2026';

// POST: /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { usuario, contrasena } = req.body;

        // Validaciones básicas de campos vacíos
        if (!usuario || !contrasena) {
            return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
        }

        // Leemos los usuarios registrados en el JSON
        const usuarios = await gestorUsuarios.leer();

        // Buscamos si existe el usuario y coincide la contraseña
        const usuarioEncontrado = usuarios.find(
            u => u.usuario.toLowerCase() === usuario.toLowerCase() && u.contrasena === contrasena
        );

        if (!usuarioEncontrado) {
            return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
        }

        // Si las credenciales son válidas, generamos el Token JWT (Expira en 2 horas)
        const token = jwt.sign(
            { 
                id: usuarioEncontrado.id, 
                usuario: usuarioEncontrado.usuario,
                nombre: usuarioEncontrado.nombre 
            }, 
            JWT_SECRET, 
            { expiresIn: '2h' }
        );

        // Respondemos con éxito enviando el token y los datos públicos del usuario
        res.json({
            mensaje: 'Inicio de sesión exitoso.',
            token,
            usuario: {
                nombre: usuarioEncontrado.nombre,
                usuario: usuarioEncontrado.usuario
            }
        });

    } catch (error) {
        console.error('ERROR EN AUTH ROUTE:', error);
        res.status(500).json({ error: 'Error interno en el servidor de autenticación.' });
    }
});

export default router;
