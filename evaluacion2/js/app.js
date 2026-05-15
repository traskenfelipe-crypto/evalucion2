/**
 * PetCare Manager - Lógica Principal
 * Construido con Vanilla JavaScript (ES6+)
 * Sigue el patrón Módulo y Funciones Reutilizables (IIFE)
 */

document.addEventListener('DOMContentLoaded', () => {

    // ==========================================
    // 0. MÓDULO DE TEMA (Dark Mode)
    // ==========================================
    const ThemeModule = (() => {
        const btnTheme = document.getElementById('theme-toggle');
        const iconTheme = btnTheme.querySelector('i');
        
        // Comprobar preferencia guardada
        const currentTheme = localStorage.getItem('petcare_theme') || 'light';
        
        const applyTheme = (theme) => {
            if(theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                iconTheme.classList.replace('fa-moon', 'fa-sun');
            } else {
                document.documentElement.removeAttribute('data-theme');
                iconTheme.classList.replace('fa-sun', 'fa-moon');
            }
        };

        // Aplicar inmediatamente
        applyTheme(currentTheme);

        // Listener del botón
        btnTheme.addEventListener('click', () => {
            const newTheme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
            applyTheme(newTheme);
            localStorage.setItem('petcare_theme', newTheme);
        });
    })();

    // ==========================================
    // 1. MÓDULO DE DATOS Y ESTADO (Modelo)
    // ==========================================
    const StateModule = (() => {
        let pets = [];
        let editingId = null;

        // Cargar desde LocalStorage
        const loadPets = () => {
            const data = localStorage.getItem('petcare_data');
            if (data) {
                try {
                    pets = JSON.parse(data);
                } catch (e) {
                    console.error("Error parseando datos de LocalStorage", e);
                    pets = [];
                }
            }
        };

        // Guardar en LocalStorage
        const savePets = () => {
            localStorage.setItem('petcare_data', JSON.stringify(pets));
        };

        return {
            getPets: () => pets,
            getEditingId: () => editingId,
            setEditingId: (id) => editingId = id,
            addPet: (pet) => {
                pets.push(pet);
                savePets();
            },
            updatePet: (updatedPet) => {
                pets = pets.map(p => p.id === updatedPet.id ? updatedPet : p);
                savePets();
            },
            deletePet: (id) => {
                pets = pets.filter(p => p.id !== id);
                savePets();
            },
            init: () => loadPets()
        };
    })();

    // ==========================================
    // 2. MÓDULO DE INTERFAZ DE USUARIO (Vista)
    // ==========================================
    const UIModule = (() => {
        // Elementos del DOM - Formulario
        const form = document.getElementById('pet-form');
        const inputId = document.getElementById('pet-id');
        const inputNombre = document.getElementById('nombre');
        const selectTipo = document.getElementById('tipo');
        const inputEdad = document.getElementById('edad');
        const inputPeso = document.getElementById('peso');
        const checkVacunado = document.getElementById('vacunado');
        const inputDueno = document.getElementById('dueno');
        const inputTelefono = document.getElementById('telefono');
        const inputObservaciones = document.getElementById('observaciones');
        
        const btnSubmit = document.getElementById('btn-submit');
        const btnCancelar = document.getElementById('btn-cancelar');
        
        // Elementos del DOM - Tabla y Filtros
        const tbody = document.getElementById('pets-tbody');
        const emptyState = document.getElementById('empty-state');
        const table = document.getElementById('pets-table');
        const inputBuscar = document.getElementById('buscar');
        const selectFiltroTipo = document.getElementById('filtro-tipo');
        
        // Elementos del DOM - Estadísticas y Toasts
        const statsContainer = document.getElementById('stats-container');
        const toastContainer = document.getElementById('toast-container');
        
        // Contenedor de Galería
        const galeriaContainer = document.getElementById('galeria-container');

        // Mostrar Notificación (Toast Personalizado)
        const showToast = (message, type = 'success') => {
            const toast = document.createElement('div');
            toast.className = `toast ${type}`;
            
            const iconClass = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
            const title = type === 'success' ? '¡Éxito!' : 'Aviso';
            
            toast.innerHTML = `
                <i class="fa-solid ${iconClass}"></i>
                <div class="toast-content">
                    <div class="toast-title">${title}</div>
                    <div class="toast-msg">${message}</div>
                </div>
            `;
            
            toastContainer.appendChild(toast);
            
            // Eliminar después de unos segundos con animación
            setTimeout(() => {
                toast.classList.add('fade-out');
                setTimeout(() => {
                    if (toastContainer.contains(toast)) {
                        toastContainer.removeChild(toast);
                    }
                }, 300); // Tiempo de la transición CSS
            }, 4000);
        };

        // Renderizar Tabla Dinámicamente
        const renderTable = (data) => {
            tbody.innerHTML = '';
            
            if (data.length === 0) {
                emptyState.classList.remove('hidden');
                table.parentElement.classList.add('hidden'); // Ocultar div .table-responsive
                return;
            }
            
            emptyState.classList.add('hidden');
            table.parentElement.classList.remove('hidden');
            
            data.forEach(pet => {
                const tr = document.createElement('tr');
                
                const vacBadgeCls = pet.vacunado ? 'badge-success' : 'badge-warning';
                const vacIcon = pet.vacunado ? 'fa-check' : 'fa-times';
                const vacText = pet.vacunado ? 'Sí' : 'No';
                
                tr.innerHTML = `
                    <td><strong>#${pet.id.toString().slice(-4)}</strong></td>
                    <td>${pet.nombre}</td>
                    <td>${pet.tipo}</td>
                    <td>${pet.edad}</td>
                    <td>${pet.peso}</td>
                    <td><span class="badge ${vacBadgeCls}"><i class="fa-solid ${vacIcon}"></i> ${vacText}</span></td>
                    <td>${pet.dueno}</td>
                    <td>${pet.telefono}</td>
                    <td class="action-buttons">
                        <button type="button" class="btn btn-primary btn-sm btn-edit" data-id="${pet.id}" title="Editar">
                            <i class="fa-solid fa-pen"></i>
                        </button>
                        <button type="button" class="btn btn-danger btn-sm btn-delete" data-id="${pet.id}" title="Eliminar">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        };

        // Renderizar Galería Visual (Tarjetas)
        const renderGallery = (data) => {
            if (!galeriaContainer) return;
            galeriaContainer.innerHTML = '';
            
            if (data.length === 0) {
                galeriaContainer.innerHTML = '<p style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 2rem;">No hay pacientes para mostrar en la galería.</p>';
                return;
            }
            
            data.forEach(pet => {
                const card = document.createElement('div');
                card.className = 'galeria-card fade-in';
                
                let icon = 'fa-paw';
                if (pet.tipo === 'Perro') icon = 'fa-dog';
                if (pet.tipo === 'Gato') icon = 'fa-cat';
                if (pet.tipo === 'Ave') icon = 'fa-dove';
                if (pet.tipo === 'Reptil') icon = 'fa-staff-snake';
                
                card.innerHTML = `
                    <div class="galeria-icon"><i class="fa-solid ${icon}"></i></div>
                    <h3>${pet.nombre}</h3>
                    <p class="pet-type">${pet.tipo} • ${pet.edad} años</p>
                    <div class="pet-owner">
                        <i class="fa-solid fa-user"></i> ${pet.dueno}
                    </div>
                `;
                galeriaContainer.appendChild(card);
            });
        };

        // Llenar Formulario para Edición (Update)
        const fillForm = (pet) => {
            inputId.value = pet.id;
            inputNombre.value = pet.nombre;
            selectTipo.value = pet.tipo;
            inputEdad.value = pet.edad;
            inputPeso.value = pet.peso;
            checkVacunado.checked = pet.vacunado;
            inputDueno.value = pet.dueno;
            inputTelefono.value = pet.telefono;
            inputObservaciones.value = pet.observaciones || '';
            
            // Cambiar aspecto del botón para indicar actualización
            btnSubmit.innerHTML = '<i class="fa-solid fa-save"></i> <span>Actualizar Registro</span>';
            btnCancelar.classList.remove('hidden');
            
            // Hacer scroll suave hacia el formulario
            document.getElementById('registro').scrollIntoView({ behavior: 'smooth' });
        };

        // Limpiar Formulario y restaurar botones
        const resetForm = () => {
            form.reset();
            inputId.value = '';
            btnSubmit.innerHTML = '<i class="fa-solid fa-save"></i> <span>Guardar Registro</span>';
            btnCancelar.classList.add('hidden');
            StateModule.setEditingId(null);
        };

        // Extraer especies únicas y actualizar el <select> del filtro
        const updateFilterOptions = (pets) => {
            const currentFilter = selectFiltroTipo.value;
            const uniqueTypes = [...new Set(pets.map(p => p.tipo))].sort();
            
            selectFiltroTipo.innerHTML = '<option value="Todos">Todos los tipos</option>';
            
            uniqueTypes.forEach(tipo => {
                if(tipo) {
                    const opt = document.createElement('option');
                    opt.value = tipo;
                    opt.textContent = tipo;
                    selectFiltroTipo.appendChild(opt);
                }
            });
            
            // Restaurar el valor filtrado si aún existe en la lista
            if (Array.from(selectFiltroTipo.options).some(o => o.value === currentFilter)) {
                selectFiltroTipo.value = currentFilter;
            }
        };

        // Renderizar Tarjetas de Estadísticas (Uso de reduce)
        const renderStats = (pets) => {
            statsContainer.innerHTML = '';
            
            // 1. Tarjeta: Total de Mascotas
            statsContainer.innerHTML += `
                <div class="stat-card fade-in">
                    <i class="fa-solid fa-users"></i>
                    <h3>Total Mascotas</h3>
                    <p>${pets.length}</p>
                </div>
            `;
            
            if (pets.length === 0) return;
            
            // 2. Tarjeta: Vacunados
            const vacunados = pets.filter(p => p.vacunado).length;
            statsContainer.innerHTML += `
                <div class="stat-card fade-in">
                    <i class="fa-solid fa-syringe" style="color: var(--success-color);"></i>
                    <h3>Vacunados al Día</h3>
                    <p>${vacunados}</p>
                </div>
            `;
            
            // 3. Tarjetas: Conteo por Tipo usando Reduce
            const typeCounts = pets.reduce((acc, pet) => {
                acc[pet.tipo] = (acc[pet.tipo] || 0) + 1;
                return acc;
            }, {});
            
            // Ordenar para mostrar los 2 tipos más comunes
            const sortedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]).slice(0, 2);
            
            sortedTypes.forEach(([tipo, cant]) => {
                let icon = 'fa-paw';
                if (tipo === 'Perro') icon = 'fa-dog';
                if (tipo === 'Gato') icon = 'fa-cat';
                if (tipo === 'Ave') icon = 'fa-dove';
                if (tipo === 'Reptil') icon = 'fa-staff-snake';
                
                statsContainer.innerHTML += `
                    <div class="stat-card fade-in">
                        <i class="fa-solid ${icon}"></i>
                        <h3>Total ${tipo}s</h3>
                        <p>${cant}</p>
                    </div>
                `;
            });
        };

        return {
            form, inputId, inputNombre, selectTipo, inputEdad, inputPeso, 
            checkVacunado, inputDueno, inputTelefono, inputObservaciones, btnCancelar,
            inputBuscar, selectFiltroTipo, tbody,
            showToast, renderTable, fillForm, resetForm, updateFilterOptions, renderStats, renderGallery
        };
    })();

    // ==========================================
    // 3. MÓDULO DE VALIDACIÓN
    // ==========================================
    const ValidationModule = (() => {
        const validatePetData = (data) => {
            const { nombre, tipo, edad, peso, dueno, telefono } = data;
            
            // Validar campos vacíos (aunque HTML5 required ya hace parte del trabajo)
            if (!nombre || !tipo || !dueno || !telefono) {
                UIModule.showToast('Existen campos de texto obligatorios sin rellenar.', 'error');
                return false;
            }
            
            // Validar edad
            if (isNaN(edad) || parseFloat(edad) < 0) {
                UIModule.showToast('La edad debe ser un número positivo.', 'error');
                return false;
            }
            
            // Validar peso
            if (isNaN(peso) || parseFloat(peso) <= 0) {
                UIModule.showToast('El peso debe ser mayor a 0.', 'error');
                return false;
            }
            
            // Regex para teléfono: permite números, espacios, guiones y el signo +
            const phoneRegex = /^[0-9+\-\s]+$/;
            if (!phoneRegex.test(telefono) || telefono.length < 5) {
                UIModule.showToast('El número de teléfono no tiene un formato válido.', 'error');
                return false;
            }
            
            return true;
        };

        return { validatePetData };
    })();

    // ==========================================
    // 4. MÓDULO CONTROLADOR PRINCIPAL
    // ==========================================
    const AppController = (() => {
        
        // Inicializar aplicación
        const init = () => {
            StateModule.init();
            setupEventListeners();
            refreshUI();
        };

        // Refrescar Elementos que dependen del Estado Global
        const refreshUI = () => {
            const allPets = StateModule.getPets();
            UIModule.updateFilterOptions(allPets);
            UIModule.renderStats(allPets);
            applyFilters(); // Renderiza la tabla basándose en datos + filtros actuales
        };

        // Aplicar Filtros (Búsqueda por texto y Select por Tipo)
        const applyFilters = () => {
            const pets = StateModule.getPets();
            const searchTerm = UIModule.inputBuscar.value.toLowerCase().trim();
            const filterType = UIModule.selectFiltroTipo.value;

            const filteredPets = pets.filter(pet => {
                // Búsqueda en múltiples campos
                const matchesSearch = 
                    pet.nombre.toLowerCase().includes(searchTerm) ||
                    pet.dueno.toLowerCase().includes(searchTerm) ||
                    pet.telefono.includes(searchTerm) ||
                    pet.id.toString().includes(searchTerm);
                    
                // Filtro estricto por tipo
                const matchesType = filterType === 'Todos' || pet.tipo === filterType;
                
                return matchesSearch && matchesType;
            });

            UIModule.renderTable(filteredPets);
            UIModule.renderGallery(filteredPets);
        };

        // Manejar envío del formulario (Crear o Actualizar)
        const handleFormSubmit = (e) => {
            e.preventDefault();
            
            // 1. Extraer datos del DOM
            const petData = {
                id: UIModule.inputId.value ? parseInt(UIModule.inputId.value) : Date.now(),
                nombre: UIModule.inputNombre.value.trim(),
                tipo: UIModule.selectTipo.value,
                edad: parseFloat(UIModule.inputEdad.value),
                peso: parseFloat(UIModule.inputPeso.value),
                vacunado: UIModule.checkVacunado.checked,
                dueno: UIModule.inputDueno.value.trim(),
                telefono: UIModule.inputTelefono.value.trim(),
                observaciones: UIModule.inputObservaciones.value.trim()
            };

            // 2. Validar Datos
            if (!ValidationModule.validatePetData(petData)) return;

            // 3. Determinar Acción (Update vs Create)
            const editingId = StateModule.getEditingId();
            
            if (editingId) {
                // Confirmación nativa extra
                if(confirm(`¿Confirmas la actualización de los datos de ${petData.nombre}?`)) {
                    StateModule.updatePet(petData);
                    UIModule.showToast('Registro actualizado exitosamente.');
                } else {
                    return; // Si el usuario cancela
                }
            } else {
                StateModule.addPet(petData);
                UIModule.showToast('Nueva mascota registrada exitosamente.');
            }

            // 4. Limpiar y Refrescar
            UIModule.resetForm();
            refreshUI();
        };

        // Configurar Event Listeners Globales
        const setupEventListeners = () => {
            // Formulario de Registro
            UIModule.form.addEventListener('submit', handleFormSubmit);
            
            // Botón Cancelar Edición
            UIModule.btnCancelar.addEventListener('click', () => {
                UIModule.resetForm();
                UIModule.showToast('Modo edición cancelado.', 'success');
            });

            // Filtros Dinámicos
            UIModule.inputBuscar.addEventListener('input', applyFilters);
            UIModule.selectFiltroTipo.addEventListener('change', applyFilters);

            // Delegación de Eventos para botones de la Tabla (Mejor práctica que addEventListener por cada fila)
            UIModule.tbody.addEventListener('click', (e) => {
                const btnEdit = e.target.closest('.btn-edit');
                const btnDelete = e.target.closest('.btn-delete');
                
                // Acción: Editar
                if (btnEdit) {
                    const id = parseInt(btnEdit.dataset.id);
                    const pet = StateModule.getPets().find(p => p.id === id);
                    if (pet) {
                        StateModule.setEditingId(id);
                        UIModule.fillForm(pet);
                    }
                }
                
                // Acción: Eliminar
                if (btnDelete) {
                    const id = parseInt(btnDelete.dataset.id);
                    const pet = StateModule.getPets().find(p => p.id === id);
                    if (pet && confirm(`¿Estás seguro de eliminar el registro de ${pet.nombre}?\nEsta acción no se puede deshacer.`)) {
                        StateModule.deletePet(id);
                        
                        // Si el usuario borra la mascota que estaba editando, limpiamos el formulario
                        if (StateModule.getEditingId() === id) {
                            UIModule.resetForm();
                        }
                        
                        UIModule.showToast('Registro eliminado exitosamente.', 'success');
                        refreshUI();
                    }
                }
            });

            // Botón de Exportar a CSV
            const btnExport = document.getElementById('btn-export');
            if (btnExport) {
                btnExport.addEventListener('click', exportToCSV);
            }
        };

        // Función para exportar datos a CSV
        const exportToCSV = () => {
            const pets = StateModule.getPets();
            if (pets.length === 0) {
                UIModule.showToast('No hay datos para exportar', 'error');
                return;
            }

            // Crear encabezados CSV
            const headers = ['ID', 'Nombre', 'Tipo', 'Edad (años)', 'Peso (kg)', 'Vacunado', 'Dueño', 'Teléfono', 'Observaciones'];
            
            // Crear filas CSV
            const csvRows = [
                headers.join(','),
                ...pets.map(p => [
                    p.id,
                    `"${p.nombre}"`, // Escapar strings en caso de comas
                    `"${p.tipo}"`,
                    p.edad,
                    p.peso,
                    p.vacunado ? 'Sí' : 'No',
                    `"${p.dueno}"`,
                    `"${p.telefono}"`,
                    `"${p.observaciones || ''}"`
                ].join(','))
            ];

            // Unir todo con saltos de línea
            const csvString = csvRows.join('\n');
            
            // Crear el Blob
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            // Crear enlace de descarga temporal y simular click
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `petcare_export_${new Date().toISOString().slice(0,10)}.csv`);
            link.style.display = 'none';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            UIModule.showToast('Archivo CSV descargado exitosamente');
        };

        return { init };
    })();

    // ==========================================
    // 5. MÓDULO DEL PANEL EDUCATIVO
    // ==========================================
    const EduModule = (() => {
        const consoleOutput = document.getElementById('edu-output');
        const consoleContainer = document.getElementById('edu-console');
        const btnArrays = document.getElementById('btn-edu-arrays');
        const btnStorage = document.getElementById('btn-edu-storage');
        const btnDom = document.getElementById('btn-edu-dom');
        const btnClose = document.getElementById('btn-close-console');
        
        // Imprimir en la pseudo-consola de la UI
        const logToConsole = (title, data) => {
            consoleContainer.classList.remove('hidden');
            let output = `[Concepto JavaScript: ${title}]\n-------------------------------------------------\n`;
            
            if (typeof data === 'object') {
                output += JSON.stringify(data, null, 2);
            } else {
                output += data;
            }
            
            consoleOutput.textContent = output;
            consoleContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        };

        const setupEduListeners = () => {
            // Ejemplo 1: Arrays (.map y .filter)
            btnArrays.addEventListener('click', () => {
                const pets = StateModule.getPets();
                
                if(pets.length === 0) {
                    logToConsole('Manipulación de Arrays', 'La lista de mascotas está vacía.\nPor favor registra algunas mascotas en la aplicación primero para ver cómo las procesamos.');
                    return;
                }

                const nombres = pets.map(p => p.nombre);
                const vacunados = pets.filter(p => p.vacunado).map(p => p.nombre);
                
                const explicacion = `
// Explicación de Código:
// 1. Usamos .map() para crear un array solo con los nombres:
   const nombres = pets.map(pet => pet.nombre);

// 2. Usamos .filter() para obtener los vacunados, y luego .map() para el nombre:
   const vacunados = pets.filter(pet => pet.vacunado === true).map(pet => pet.nombre);

> Total de mascotas: ${pets.length}
> Nombres extraídos: [${nombres.join(', ')}]
> Mascotas vacunadas: [${vacunados.length > 0 ? vacunados.join(', ') : 'Ninguna'}]`;

                logToConsole('Métodos de Arrays (map y filter)', explicacion);
            });

            // Ejemplo 2: LocalStorage y JSON
            btnStorage.addEventListener('click', () => {
                const dataRaw = localStorage.getItem('petcare_data');
                
                if(!dataRaw || dataRaw === '[]') {
                    logToConsole('Estructura de Datos', 'Aún no hay datos guardados.\nRegistra una mascota para ver cómo se guarda un Objeto literal en el LocalStorage convertido a JSON.');
                } else {
                    const parsed = JSON.parse(dataRaw);
                    const ejemploObjeto = parsed[0]; // Mostrar el primer objeto como ejemplo
                    
                    const explicacion = `
// Así guardamos los datos en LocalStorage (como texto):
// localStorage.setItem('petcare_data', JSON.stringify(petsArray));

// Objeto de la primera mascota en memoria:
${JSON.stringify(ejemploObjeto, null, 2)}`;
                    
                    logToConsole('Objetos y LocalStorage', explicacion);
                }
            });

            // Ejemplo 3: Manipulación del DOM en vivo
            btnDom.addEventListener('click', () => {
                const root = document.documentElement;
                const oldColor = getComputedStyle(root).getPropertyValue('--primary-color').trim();
                
                // Escoger color aleatorio distinto al oliva
                const colors = ['#2c3e50', '#8e44ad', '#d35400', '#16a085', '#2980b9'];
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                
                // Cambiar variable CSS dinámicamente
                root.style.setProperty('--primary-color', randomColor);
                
                const explicacion = `
// Manipulación del DOM y CSS Variables:
// Acabamos de inyectar un nuevo valor al CSS usando JavaScript:

document.documentElement.style.setProperty('--primary-color', '${randomColor}');

// Nota cómo los botones, íconos y bordes cambiaron de color instantáneamente.
// El color original regresará en 4 segundos...`;

                logToConsole('DOM e Interfaz de Usuario', explicacion);
                UIModule.showToast('¡Tema alterado desde el código JS!', 'success');

                // Restaurar color automáticamente
                setTimeout(() => {
                    root.style.setProperty('--primary-color', oldColor);
                    if(!consoleContainer.classList.contains('hidden')) {
                         consoleOutput.textContent += '\n\n> Color original restaurado.';
                    }
                }, 4000);
            });
            
            // Botón para cerrar consola educativa
            btnClose.addEventListener('click', () => {
                consoleContainer.classList.add('hidden');
            });
        };

        return { init: setupEduListeners };
    })();

    // ==========================================
    // EJECUCIÓN INICIAL
    // ==========================================
    AppController.init();
    EduModule.init();

});
