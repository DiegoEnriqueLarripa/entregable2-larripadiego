document.addEventListener('DOMContentLoaded', () => {

    let productos = [];
    let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
    let pagoIniciado = false;

    const sidebarCarritoElement = document.getElementById('sidebarCarrito');
    const catalogoProductos = document.getElementById('catalogo-productos');
    const listaCarrito = document.getElementById('lista-carrito');
    const totalCarritoDisplay = document.getElementById('total');
    const contadorCarritoBadge = document.getElementById('contador-carrito');
    const btnVaciar = document.getElementById('btn-vaciar');
    const btnPagar = document.getElementById('btn-pagar');
    const filtrosForm = document.getElementById('filtros-form');
    const busquedaInput = document.getElementById('busqueda');
    const ordenarSelect = document.getElementById('ordenar');
    const categoriaSelect = document.getElementById('filtrar-categoria');
    const loadingSpinner = document.getElementById('loading');

    const generarCodigoPedido = (longitud = 6) => {
        const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let codigo = '';
        for (let i = 0; i < longitud; i++) {
            codigo += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
        }
        return codigo;
    };

    const cargarProductos = async () => {
        loadingSpinner.style.display = 'block';
        try {
            await new Promise(resolve => setTimeout(resolve, 500));
            const response = await fetch('data/productos.json');
            if (!response.ok) throw new Error('Error al cargar productos');
            productos = await response.json();
            aplicarFiltros();
            llenarCategorias();
        } catch (error) {
            console.error(error);
            catalogoProductos.innerHTML = `<p class="text-danger text-center">Error al cargar productos.</p>`;
        } finally {
            loadingSpinner.style.display = 'none';
        }
    };

    const mostrarCatalogo = (lista) => {
        catalogoProductos.innerHTML = '';
        if (lista.length === 0) {
            catalogoProductos.innerHTML = '<p class="text-center text-muted col-12">No se encontraron productos con esos criterios.</p>';
            return;
        }
        lista.forEach(producto => {
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6 col-lg-4';
            col.innerHTML = `
                <div class="card h-100 product-card">
                    <div class="card-img-container">
                        <img src="${producto.img}" class="card-img-top" alt="${producto.nombre}">
                    </div>
                    <div class="card-body d-flex flex-column">
                        <h5 class="card-title">${producto.nombre}</h5>
                        <p class="card-text text-muted small">${producto.categoria}</p>
                        <p class="card-text fs-4 fw-bold mt-auto mb-3">$${producto.precio.toLocaleString()}</p>
                        <button class="btn btn-primary w-100 mt-auto agregar-carrito" data-id="${producto.id}">
                            <i class="bi bi-cart-plus-fill me-2"></i>Agregar al carrito
                        </button>
                    </div>
                </div>
            `;
            catalogoProductos.appendChild(col);
        });
    };

    const agregarAlCarrito = (productoId, boton) => {
        const itemEnCarrito = carrito.find(item => item.id === productoId);
        if (itemEnCarrito) {
            itemEnCarrito.cantidad++;
        } else {
            const producto = productos.find(p => p.id === productoId);
            carrito.push({ ...producto, cantidad: 1 });
        }
        actualizarCarrito();
        if (boton) {
            boton.innerHTML = `<i class="bi bi-check-lg"></i> Agregado`;
            boton.classList.remove('btn-primary');
            boton.classList.add('btn-success');
            boton.disabled = true;
            setTimeout(() => {
                boton.innerHTML = `<i class="bi bi-cart-plus-fill me-2"></i>Agregar al carrito`;
                boton.classList.remove('btn-success');
                boton.classList.add('btn-primary');
                boton.disabled = false;
            }, 1500);
        }
    };

    const actualizarCarrito = () => {
        listaCarrito.innerHTML = '';
        if (carrito.length === 0) {
            listaCarrito.innerHTML = `
                <li class="list-group-item text-center p-4">
                    <i class="bi bi-cart-x" style="font-size: 3rem; color: #ccc;"></i>
                    <p class="text-muted mt-2 mb-0">Tu carrito está vacío.</p>
                </li>
            `;
            btnPagar.disabled = true;
            btnVaciar.disabled = true;
        } else {
            carrito.forEach(item => {
                const li = document.createElement('li');
                li.className = 'list-group-item d-flex align-items-center gap-3';
                li.innerHTML = `
                    <img src="${item.img}" alt="${item.nombre}" class="carrito-item-img">
                    <div class="carrito-item-detalles">
                        <span class="carrito-item-titulo">${item.nombre}</span>
                        <span class="carrito-item-precio">$${(item.precio * item.cantidad).toLocaleString()}</span>
                    </div>
                    <div class="carrito-item-controles ms-auto d-flex align-items-center gap-2">
                        <button class="btn btn-outline-secondary btn-sm restar-item" data-id="${item.id}">-</button>
                        <span>${item.cantidad}</span>
                        <button class="btn btn-outline-secondary btn-sm sumar-item" data-id="${item.id}">+</button>
                        <button class="btn btn-danger btn-sm eliminar-item" data-id="${item.id}"><i class="bi bi-trash"></i></button>
                    </div>
                `;
                listaCarrito.appendChild(li);
            });
            btnPagar.disabled = false;
            btnVaciar.disabled = false;
        }
        actualizarTotalYContador();
        guardarCarritoEnStorage();
    };
    
    const actualizarTotalYContador = () => {
        const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
        const totalItems = carrito.reduce((acc, item) => acc + item.cantidad, 0);
        totalCarritoDisplay.textContent = `Total: $${total.toLocaleString()}`;
        contadorCarritoBadge.textContent = totalItems;
    };
    
    const guardarCarritoEnStorage = () => localStorage.setItem('carrito', JSON.stringify(carrito));
    const guardarFiltrosEnStorage = (filtros) => sessionStorage.setItem('filtros', JSON.stringify(filtros));

    const llenarCategorias = () => {
        const categorias = [...new Set(productos.map(p => p.categoria))];
        categorias.sort().forEach(cat => {
            if (!document.querySelector(`#filtrar-categoria option[value="${cat}"]`)) {
                const option = document.createElement('option');
                option.value = cat;
                option.textContent = cat;
                categoriaSelect.appendChild(option);
            }
        });
    };

    const aplicarFiltros = () => {
        let resultado = [...productos];
        const busqueda = busquedaInput.value.trim().toLowerCase();
        const categoria = categoriaSelect.value;
        const orden = ordenarSelect.value;
        if (busqueda) resultado = resultado.filter(p => p.nombre.toLowerCase().includes(busqueda));
        if (categoria) resultado = resultado.filter(p => p.categoria === categoria);
        if (orden === 'alfabetico') resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
        else if (orden === 'precio') resultado.sort((a, b) => a.precio - b.precio);
        mostrarCatalogo(resultado);
        guardarFiltrosEnStorage({ busqueda, categoria, orden });
    };

    const procesarPedido = async () => {
        try {
            const { value: direccion } = await Swal.fire({
                title: 'Paso 1: Dirección de Envío',
                input: 'text',
                inputLabel: 'Tu dirección completa',
                inputPlaceholder: 'Ej: Av. Siempre Viva 742, Springfield',
                showCancelButton: true,
                confirmButtonText: 'Siguiente →',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: 'var(--color-primario)',
                inputValidator: (value) => {
                    if (!value || value.length < 10) return '¡Necesitamos una dirección válida para el envío!';
                }
            });
            if (!direccion) return;

            const { value: nombreReceptor } = await Swal.fire({
                title: 'Paso 2: ¿Quién recibe?',
                input: 'text',
                inputLabel: 'Nombre y apellido de quien recibe el pedido',
                inputPlaceholder: 'Ej: Homero Simpson',
                showCancelButton: true,
                confirmButtonText: 'Siguiente →',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: 'var(--color-primario)',
                inputValidator: (value) => {
                    if (!value || value.trim().length < 3) return 'Por favor, ingresa un nombre válido.';
                }
            });
            if (!nombreReceptor) return;

            const { value: metodoPago } = await Swal.fire({
                title: 'Paso 3: Método de Pago',
                input: 'radio',
                inputOptions: {
                    'credito': 'Tarjeta de Crédito',
                    'transferencia': 'Transferencia Bancaria',
                    'efectivo': 'Efectivo en la entrega'
                },
                showCancelButton: true,
                confirmButtonText: 'Siguiente →',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: 'var(--color-primario)',
                inputValidator: (value) => {
                    if (!value) return '¡Debes seleccionar un método de pago!';
                }
            });
            if (!metodoPago) return;

            const total = carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
            const nombreMetodoPago = { 'credito': 'Tarjeta de Crédito', 'transferencia': 'Transferencia Bancaria', 'efectivo': 'Efectivo en la entrega' }[metodoPago];
            const resumenPedidoHtml = carrito.map(item => `<div style="display: flex; justify-content: space-between; font-size: 0.9rem; padding: 0.25rem 0;"><span>${item.cantidad} x ${item.nombre}</span><span>$${(item.precio * item.cantidad).toLocaleString()}</span></div>`).join('');
            const codigoPedido = generarCodigoPedido();

            const { isConfirmed } = await Swal.fire({
                title: 'Paso 4: Confirma tu Pedido',
                icon: 'question',
                html: `
                    <div style="text-align: left; padding: 1em;">
                        <p><strong>Detalle de productos:</strong></p>
                        <div style="border: 1px solid #eee; padding: 1rem; margin-bottom: 1rem; border-radius: 5px;">${resumenPedidoHtml}</div>
                        <hr>
                        <p><strong>Dirección de Envío:</strong><br>${direccion}</p>
                        <p><strong>Recibe:</strong><br>${nombreReceptor}</p>
                        <p><strong>Método de Pago:</strong><br>${nombreMetodoPago}</p>
                        <p><strong>Código de Pedido:</strong><br>${codigoPedido}</p>
                        <hr>
                        <p class="h4" style="text-align: right;"><strong>Total a Pagar: $${total.toLocaleString()}</strong></p>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: '¡Confirmar y Enviar!',
                cancelButtonText: 'Modificar',
                confirmButtonColor: '#28a745',
            });

            if (isConfirmed) {
                carrito = [];
                actualizarCarrito();
                sessionStorage.removeItem('filtros');
                filtrosForm.reset();
                aplicarFiltros();
                Swal.fire({
                    title: '¡Pedido en camino!',
                    html: `Gracias por tu compra. Tu pedido será enviado a:<br><strong>${direccion}</strong><br><br>Dale este código al cadete:<br><strong style="font-size: 1.5rem; letter-spacing: 2px; color: var(--color-primario);">${codigoPedido}</strong>`,
                    icon: 'success',
                    confirmButtonColor: 'var(--color-primario)'
                });
            }
        } catch (error) {
            Swal.fire('Error', 'Hubo un problema al procesar tu pedido. Intenta de nuevo.', 'error');
        }
    };

    filtrosForm.addEventListener('input', aplicarFiltros);
    filtrosForm.addEventListener('submit', (e) => e.preventDefault());

    catalogoProductos.addEventListener('click', e => {
        const boton = e.target.closest('.agregar-carrito');
        if (boton) {
            agregarAlCarrito(parseInt(boton.dataset.id), boton);
        }
    });

    listaCarrito.addEventListener('click', e => {
        const target = e.target;
        const id = parseInt(target.closest('[data-id]')?.dataset.id);
        if (!id) return;
        const item = carrito.find(p => p.id === id);
        if (target.matches('.sumar-item')) {
            if (item) item.cantidad++;
        } else if (target.matches('.restar-item')) {
            if (item && item.cantidad > 1) {
                item.cantidad--;
            } else {
                carrito = carrito.filter(p => p.id !== id);
            }
        } else if (target.matches('.eliminar-item, .eliminar-item *')) {
            carrito = carrito.filter(p => p.id !== id);
        }
        actualizarCarrito();
    });

    btnVaciar.addEventListener('click', () => {
        if (carrito.length === 0) return;
        Swal.fire({
            title: '¿Vaciar carrito?', text: "Se eliminarán todos los productos.", icon: 'warning',
            showCancelButton: true, confirmButtonText: 'Sí, vaciar', cancelButtonText: 'Cancelar'
        }).then(result => {
            if (result.isConfirmed) {
                carrito = [];
                actualizarCarrito();
                Swal.fire('¡Carrito vacío!', '', 'success');
            }
        });
    });

    btnPagar.addEventListener('click', () => {
        if (carrito.length === 0) {
            Swal.fire({
                title: 'Carrito vacío',
                text: 'Agrega productos antes de continuar.',
                icon: 'info',
                confirmButtonColor: 'var(--color-primario)'
            });
            return;
        }
        pagoIniciado = true;
        const offcanvas = bootstrap.Offcanvas.getInstance(sidebarCarritoElement);
        offcanvas.hide();
    });

    sidebarCarritoElement.addEventListener('hidden.bs.offcanvas', () => {
        if (pagoIniciado) {
            procesarPedido();
            pagoIniciado = false;
        }
    });

    const init = async () => {
        const filtrosGuardados = JSON.parse(sessionStorage.getItem('filtros'));
        if (filtrosGuardados) {
            busquedaInput.value = filtrosGuardados.busqueda || '';
            ordenarSelect.value = filtrosGuardados.orden || '';
        }
        await cargarProductos();
        if (filtrosGuardados && filtrosGuardados.categoria) {
            categoriaSelect.value = filtrosGuardados.categoria;
        }
        actualizarCarrito();
        aplicarFiltros();
    };

    init();
});