## 👥 Integrantes del Equipo
* *Giovanny Segovia - C.I: 31.588.187
* *Wilfredo Alvarez - C.I: 30.654.549
* *Carlos Colmenarez - C.I: 30.494.549

# 📊 Sistema de Control de Estudio Institucional (PNF) - Versión 2.0

¡Bienvenido al **Sistema Full-Stack de Control de Estudio**! Esta aplicación está diseñada específicamente para gestionar la matrícula estudiantil, las calificaciones por corte y el rendimiento académico de los alumnos en los diferentes **Programas Nacionales de Formación (PNF)**. 

La versión 2.0 migra el almacenamiento de imágenes base64 hacia un modelo de **persistencia binaria real** en el disco duro del servidor mediante la biblioteca `Multer`, optimizando el consumo de memoria y la velocidad de respuesta del sistema.

---

## 🚀 Características Principales y Funciones

El sistema está equipado con un panel de control tipo **Dashboard** centralizado que provee las siguientes soluciones de software:

* **Módulo CRUD Multimedia Completo:** * **Registrar:** Alta de estudiantes validando duplicados por Cédula de Identidad, asignación de PNF y carga física de fotografía de perfil.
    * **Leer:** Renderizado síncrono y dinámico de la matrícula en una tabla de datos de alta fidelidad.
    * **Editar:** Carga bidireccional de datos desde la tabla al formulario, bloqueando la clave primaria (Cédula) para proteger la consistencia de los datos en caliente.
    * **Borrar:** Eliminación lógica del JSON y física del archivo de imagen en el disco del servidor para evitar basura informática.
* **Motor de Cálculo Académico Automatizado:** El backend procesa una matriz de 4 notas por corte (escala 0-20), calculando instantáneamente:
    * **Índice Académico Acumulado (Promedio)** con precisión decimal.
    * **Estatus Semántico:** Clasificación automática en *Aprobado* ($\ge 12$), *Recuperación* ($10 \le \text{promedio} < 12$) o *Reprobado* ($< 10$).
* **Generador de Reportes Individuales (Boletín de Notas):** Genera de forma dinámica una ventana limpia y estilizada con la sábana de notas del alumno seleccionado, adaptada con CSS `media print` para su impresión física o guardado en PDF oficial.
* **Módulo de Reporte Institucional (Cuadro de Honor):** Sección independiente que consume un endpoint exclusivo con un filtro avanzado para aislar y generar "Diplomas de Excelencia Académica" únicamente para alumnos con promedio meritorio ($\ge 18$).

---

## 📂 Estructura del Proyecto

El ecosistema de archivos se organiza bajo una arquitectura limpia de desacoplamiento de responsabilidades (Frontend / Backend):

```text
control-estudio-pnf/
├── data/
│   └── estudiantes.json   # Base de datos relacional simulada en JSON
├── uploads/               # Repositorio de almacenamiento de imágenes físicas
├── public/                # Entorno estático del cliente (Frontend)
│   ├── index.html         # Interfaz y Dashboard principal del usuario
│   ├── app.js             # Controlador de eventos, render y peticiones Fetch
│   └── honor_roll.html    # Vista exclusiva del Cuadro de Honor
├── server.js              # Servidor API RESTful en Node.js y Express
└── package.json           # Manifiesto de dependencias y scripts del proyecto
