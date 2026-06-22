import { UI } from './services/UI.js';

document.addEventListener('DOMContentLoaded', () => {
    const ui = new UI();
    const API_URL = '/api/estudiantes';
    let estadoEstudiantes = []; // Estado local reactivo en memoria

    // Cargar datos iniciales desde el servidor
    async function cargarEstudiantes() {
        try {
            const res = await fetch(API_URL);
            if (!res.ok) throw new Error('Error al obtener datos del servidor');
            estadoEstudiantes = await res.json();
            
            ui.renderizarLista(estadoEstudiantes);
            ui.actualizarEstadisticas(estadoEstudiantes);
        } catch (error) {
            ui.mostrarError(error.message);
        }
    }

    // Guardar / Editar Registro (Envío asíncrono sin recarga de página)
    ui.form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const estudianteInstancia = ui.capturarFormulario();
        if (!estudianteInstancia) return; // Si falla la validación en la UI, rompe el flujo

        const isEdit = document.getElementById('editMode').value === 'true';
        const url = isEdit ? `${API_URL}/${document.getElementById('oldCedula').value}` : API_URL;
        const method = isEdit ? 'PUT' : 'POST';

        // ======================================================================
        // INTEGRACIÓN SEGURA DE LA FOTO (DIFERIDA O EN REGISTRO)
        // ======================================================================
        const inputFoto = document.getElementById('foto');
        
        // Buscamos si ya tiene una foto guardada previamente para no perderla en la edición
        const estudianteOriginal = isEdit ? estadoEstudiantes.find(est => est.cedula === estudianteInstancia.cedula) : null;
        
        // Si es edición y el objeto original tenía foto, la mantenemos por defecto. Si no, silueta gris.
        let fotoFinal = isEdit && estudianteOriginal ? (estudianteOriginal.foto || 'https://www.w3schools.com/howto/img_avatar.png') : 'https://www.w3schools.com/howto/img_avatar.png';

        // ¿El operador seleccionó un archivo nuevo en este preciso momento?
        if (inputFoto && inputFoto.files && inputFoto.files[0]) {
            try {
                fotoFinal = await new Promise((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result); // Transforma el archivo físico a Base64
                    reader.onerror = (err) => reject(err);
                    reader.readAsDataURL(inputFoto.files[0]);
                });
            } catch (err) {
                console.error("Error al procesar el archivo físico de la imagen:", err);
                ui.mostrarError("No se pudo leer la imagen seleccionada.");
                return;
            }
        }

        // Asignamos la propiedad de manera segura al objeto que se va a enviar
        estudianteInstancia.foto = fotoFinal;
        // ======================================================================

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(estudianteInstancia)
            });

            // Si el servidor falla (ej. tamaño excedido), capturamos el texto para evitar el error de JSON.parse
            if (!response.ok) {
                const errorTexto = await response.text();
                throw new Error(errorTexto || 'Ocurrió un error en la operación.');
            }

            const data = await response.json();

            estadoEstudiantes = data.estudiantes; // Actualizamos el estado con el retorno del backend
            
            ui.renderizarLista(estadoEstudiantes);
            ui.actualizarEstadisticas(estadoEstudiantes);
            ui.mostrarExito(data.mensaje);
            
            // Limpiamos el input file manualmente ya que el form se resetea internamente en la UI
            if (inputFoto) inputFoto.value = '';
            
            ui.desactivarModoEdicion();
            
        } catch (error) {
            ui.mostrarError(error.message);
        }
    });

    // Control dinámico de la tabla (Delegación de Eventos para Notas, Editar, Reporte y Eliminar)
    ui.tabla.addEventListener('click', async (e) => {
        const cedula = e.target.dataset.cedula;
        if (!cedula) return;

        // ACCIÓN: GESTIÓN DE NOTAS
        if (e.target.classList.contains('btn-notes')) {
            const estudiante = estadoEstudiantes.find(est => est.cedula === cedula);
            if (estudiante) { 
                ui.abrirModalNotas(estudiante);
            }
            return;
        }

        // ACCIÓN: ACTIVAR EDICIÓN
        if (e.target.classList.contains('btn-edit')) {
            const estudiante = estadoEstudiantes.find(est => est.cedula === cedula);
            if (estudiante) {
                ui.activarModoEdicion(estudiante);
                const inputFoto = document.getElementById('foto');
                if (inputFoto) inputFoto.value = '';
            }
            return;
        } 
        
        // ACCIÓN: GENERAR REPORTE ACADÉMICO (NUEVO)
        if (e.target.classList.contains('btn-report')) {
            const estudiante = estadoEstudiantes.find(est => est.cedula === cedula);
            if (estudiante) {
                generarReporteImpresion(estudiante);
            }
            return;
        }

        // ACCIÓN: ELIMINAR ESTUDIANTE
        if (e.target.classList.contains('btn-delete')) {
            if (!confirm(`¿Está seguro de eliminar al estudiante con Cédula ${cedula}?`)) return;

            try {
                const response = await fetch(`${API_URL}/${cedula}`, { method: 'DELETE' });
                const data = await response.json();

                if (!response.ok) throw new Error(data.error);

                estadoEstudiantes = data.estudiantes;
                ui.renderizarLista(estadoEstudiantes);
                ui.actualizarEstadisticas(estadoEstudiantes);
                ui.mostrarExito(data.mensaje);
                ui.desactivarModoEdicion();

            } catch (error) {
                ui.mostrarError(error.message);
            }
            return;
        }
    });

    // Cancelar Edición desde el formulario principal
    ui.btnCancelar.addEventListener('click', () => ui.desactivarModoEdicion());

    // 🔎 Filtrado Reactivo en tiempo real mediante evento 'input'
    document.getElementById('searchCedula').addEventListener('input', (e) => {
        ui.renderizarLista(estadoEstudiantes, e.target.value);
    });

    // ======================================================================
    // GESTIÓN DE CALIFICACIONES (MODAL DE NOTAS)
    // ======================================================================

    // Escuchas para cerrar el modal de notas
    document.getElementById('btnCerrarModal').addEventListener('click', () => ui.cerrarModalNotas());
    document.getElementById('btnCancelarModal').addEventListener('click', () => ui.cerrarModalNotas());

    // Capturar el envío del formulario del modal de notas
    document.getElementById('formNotas').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const cedula = document.getElementById('modalCedula').value;
        const estudianteOriginal = estadoEstudiantes.find(est => est.cedula === cedula);
        
        if (!estudianteOriginal) return;

        // Recolectamos las 4 notas desde el modal
        const nuevasNotas = [
            parseFloat(document.getElementById('nota1').value) || 0,
            parseFloat(document.getElementById('nota2').value) || 0,
            parseFloat(document.getElementById('nota3').value) || 0,
            parseFloat(document.getElementById('nota4').value) || 0
        ];

        try {
            // Reutilizamos la ruta PUT para actualizar las notas preservando la foto existente
            const respuesta = await fetch(`${API_URL}/${cedula}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: estudianteOriginal.nombre,
                    carrera: estudianteOriginal.carrera,
                    foto: estudianteOriginal.foto, // Mantenemos la foto para no perderla al actualizar notas
                    notas: nuevasNotas,
                    cedula: cedula
                })
            });

            const data = await respuesta.json();

            if (respuesta.ok) {
                estadoEstudiantes = data.estudiantes; // Actualizamos el estado global en memoria
                ui.renderizarLista(estadoEstudiantes); // Redibujamos la tabla
                ui.actualizarEstadisticas(estadoEstudiantes); // Recalculamos indicadores
                ui.cerrarModalNotas(); // Cerramos la ventana limpia
                
                if (typeof ui.mostrarExito === 'function') {
                    ui.mostrarExito('Notas actualizadas correctamente.');
                }
            } else {
                alert(data.error || 'No se pudieron guardar las notas.');
            }
        } catch (error) {
            console.error(error);
            alert('Error de red al intentar actualizar las calificaciones.');
        }
    });

    // ======================================================================
    // FUNCIÓN MODULAR PARA GENERAR REPORTE IMPRESO / PDF
    // ======================================================================
    function generarReporteImpresion(estudiante) {
        const urlFoto = estudiante.foto || 'https://www.w3schools.com/howto/img_avatar.png';
        const notas = estudiante.notas || [0, 0, 0, 0];
        const promedio = parseFloat(estudiante.indice || 0).toFixed(2);

        // Abrimos una pestaña en blanco del navegador
        const ventanaReporte = window.open('', '_blank', 'width=800,height=900');

        ventanaReporte.document.write(`
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="UTF-8">
                <title>Reporte Académico - ${estudiante.cedula}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; margin: 40px; padding: 0; }
                    .header-reporte { display: flex; align-items: center; justify-content: space-between; border-bottom: 3px solid #1e3a8a; padding-bottom: 20px; margin-bottom: 30px; }
                    .logo-placeholder { font-size: 24px; font-weight: bold; color: #1e3a8a; }
                    .titulo-reporte { text-align: right; }
                    .titulo-reporte h1 { margin: 0; font-size: 26px; text-transform: uppercase; }
                    .titulo-reporte p { margin: 5px 0 0 0; color: #666; }
                    
                    .datos-contenedor { display: flex; gap: 40px; background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 30px; }
                    .foto-estudiante { width: 130px; height: 130px; border-radius: 8px; object-fit: cover; border: 3px solid #1e3a8a; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                    .info-tabla { flex: 1; border-collapse: collapse; width: 100%; }
                    .info-tabla td { padding: 8px 12px; }
                    .info-tabla td.label { font-weight: bold; color: #475569; width: 35%; }
                    
                    .seccion-titulo { font-size: 18px; color: #1e3a8a; border-bottom: 2px solid #cbd5e1; padding-bottom: 6px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 0.5px; }
                    
                    .tabla-calificaciones { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                    .tabla-calificaciones th { background-color: #1e3a8a; color: white; text-align: left; padding: 12px; font-size: 14px; }
                    .tabla-calificaciones td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 15px; }
                    .tabla-calificaciones tr:nth-child(even) { background-color: #f8fafc; }
                    
                    .resumen-final { display: flex; justify-content: flex-end; margin-top: 20px; }
                    .cuadro-indice { background: #1e3a8a; color: white; padding: 15px 30px; border-radius: 6px; text-align: center; }
                    .cuadro-indice h2 { margin: 0; font-size: 14px; text-transform: uppercase; font-weight: 400; }
                    .cuadro-indice p { margin: 5px 0 0 0; font-size: 28px; font-weight: bold; }
                    
                    .firma-seccion { margin-top: 80px; display: flex; justify-content: center; }
                    .linea-firma { border-top: 1px solid #94a3b8; width: 250px; text-align: center; padding-top: 8px; font-size: 14px; color: #64748b; }

                    @media print {
                        body { margin: 20px; }
                        .no-print { display: none; }
                        .cuadro-indice { background: #1e3a8a !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .tabla-calificaciones th { background-color: #1e3a8a !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                    }
                </style>
            </head>
            <body>
                <div class="no-print" style="background: #f1f5f9; padding: 10px; margin-bottom: 20px; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-size: 14px; color: #475569;">Vista previa del reporte. Puede imprimir o guardar como PDF.</span>
                    <button onclick="window.print()" style="background: #10b981; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">Imprimir Reporte</button>
                </div>

                <div class="header-reporte">
                    <div class="logo-placeholder">Control de Estudio</div>
                    <div class="titulo-reporte">
                        <h1>Reporte Académico General</h1>
                        <p>Fecha de Emisión: ${new Date().toLocaleDateString()}</p>
                    </div>
                </div>

                <div class="seccion-titulo">Datos del Estudiante</div>
                <div class="datos-contenedor">
                    <img src="${urlFoto}" alt="Foto Estudiante" class="foto-estudiante">
                    <table class="info-tabla">
                        <tr>
                            <td class="label">Nombre Completo:</td>
                            <td>${estudiante.nombre}</td>
                        </tr>
                        <tr>
                            <td class="label">Cédula de Identidad:</td>
                            <td>${estudiante.cedula}</td>
                        </tr>
                        <tr>
                            <td class="label">Carrera Universitaria:</td>
                            <td>${estudiante.carrera}</td>
                        </tr>
                    </table>
                </div>

                <div class="seccion-titulo">Calificaciones Obtenidas</div>
                <table class="tabla-calificaciones">
                    <thead>
                        <tr>
                            <th>Evaluación / Corte</th>
                            <th>Calificación (Escala 1-20)</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Evaluación 01 (Corte I)</td>
                            <td style="font-weight: 600;">${notas[0]} / 20</td>
                            <td>${notas[0] >= 10 ? '<span style="color: green;">Aprobado</span>' : '<span style="color: red;">Reprobado</span>'}</td>
                        </tr>
                        <tr>
                            <td>Evaluación 02 (Corte II)</td>
                            <td style="font-weight: 600;">${notas[1]} / 20</td>
                            <td>${notas[1] >= 10 ? '<span style="color: green;">Aprobado</span>' : '<span style="color: red;">Reprobado</span>'}</td>
                        </tr>
                        <tr>
                            <td>Evaluación 03 (Corte III)</td>
                            <td style="font-weight: 600;">${notas[2]} / 20</td>
                            <td>${notas[2] >= 10 ? '<span style="color: green;">Aprobado</span>' : '<span style="color: red;">Reprobado</span>'}</td>
                        </tr>
                        <tr>
                            <td>Evaluación 04 (Corte IV)</td>
                            <td style="font-weight: 600;">${notas[3]} / 20</td>
                            <td>${notas[3] >= 10 ? '<span style="color: green;">Aprobado</span>' : '<span style="color: red;">Reprobado</span>'}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="resumen-final">
                    <div class="cuadro-indice">
                        <h2>Índice Académico Final</h2>
                        <p>${promedio}</p>
                    </div>
                </div>

                <div class="firma-seccion">
                    <div class="linea-firma">
                        Firma de Control de Estudio<br>
                        Sello de la Institución
                    </div>
                </div>

                <script>
                    window.onload = function() {
                        setTimeout(() => { window.print(); }, 300);
                    }
                <\/script>
            </body>
            </html>
        `);
        ventanaReporte.document.close();
    }

    // ======================================================================
    // CONTROL DE SESIÓN Y BIENVENIDA
    // ======================================================================

    // 1. Mostrar el nombre del usuario logueado en pantalla
    const infoUsuario = localStorage.getItem('usuario');
    if (infoUsuario) {
        const usuarioObj = JSON.parse(infoUsuario);
        const labelBienvenida = document.getElementById('bienvenidaUsuario');
        if (labelBienvenida) {
            labelBienvenida.textContent = `Operador: ${usuarioObj.nombre}`;
        }
    }

    // 2. Lógica física para borrar los tokens y expulsar al usuario
    const btnSalir = document.getElementById('btnCerrarSesion');
    if (btnSalir) {
        btnSalir.addEventListener('click', () => {
            localStorage.removeItem('token');
            localStorage.removeItem('usuario');
            window.location.href = 'login.html';
        });
    }

    // Ejecución inicial
    cargarEstudiantes();
});
