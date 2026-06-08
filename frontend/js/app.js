import { UI } from './services/UI.js';

document.addEventListener('DOMContentLoaded', () => {
    const ui = new UI();
    const API_URL = '/api/estudiantes';
    let estadoEstudiantes = []; // Estado local reactivo en memoria

    // Cargar datos iniciales
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
        if (!estudianteInstancia) return; // Si falla la validación UI rompe el flujo

        const isEdit = document.getElementById('editMode').value === 'true';
        const url = isEdit ? `${API_URL}/${document.getElementById('oldCedula').value}` : API_URL;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(estudianteInstancia)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Ocurrió un error en la operación.');
            }

            estadoEstudiantes = data.estudiantes; // Actualizamos el estado con el retorno del backend
            
            ui.renderizarLista(estadoEstudiantes);
            ui.actualizarEstadisticas(estadoEstudiantes);
            ui.mostrarExito(data.mensaje);
            ui.desactivarModoEdicion();
            
        } catch (error) {
            ui.mostrarError(error.message);
        }
    });

    // Control dinámico de la tabla (Delegación de Eventos para Editar y Eliminar)
    ui.tabla.addEventListener('click', async (e) => {
        const cedula = e.target.dataset.cedula;
        if (!cedula) return;

        if (e.target.classList.contains('btn-edit')) {
            const estudiante = estadoEstudiantes.find(est => est.cedula === cedula);
            if (estudiante) ui.activarModoEdicion(estudiante);
        } 
        
        else if (e.target.classList.contains('btn-delete')) {
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
        }
    });

    // Cancelar Edición
    ui.btnCancelar.addEventListener('click', () => ui.desactivarModoEdicion());

    // 🔎 Filtrado Reactivo / En tiempo real mediante evento 'input'
    document.getElementById('searchCedula').addEventListener('input', (e) => {
        ui.renderizarLista(estadoEstudiantes, e.target.value);
    });

    // Ejecución inicial
    cargarEstudiantes();
});
