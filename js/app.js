// Catálogo de productos predefinidos
const productos = [
    { nombre: "Cocacola", precio: 2500, categoria: "Bebida" },
    { nombre: "Pepsi", precio: 2500, categoria: "Bebida" },
    { nombre: "Fanta", precio: 2500, categoria: "Bebida" },
    { nombre: "Agua", precio: 2000, categoria: "Bebida" },
    { nombre: "Hamburguesa", precio: 5000, categoria: "Comida" },
    { nombre: "Pizza", precio: 8000, categoria: "Comida" },
    { nombre: "Papas Fritas", precio: 3000, categoria: "Comida" },
    { nombre: "Helado", precio: 1500, categoria: "Postre" },
    { nombre: "Brownie", precio: 2000, categoria: "Postre" },
    { nombre: "Torta", precio: 2500, categoria: "Postre" }
];

let carrito = [];

const carritoGuardado = localStorage.getItem('carrito');
if (carritoGuardado) {
    carrito = JSON.parse(carritoGuardado);
}

const formProducto = document.getElementById('form-producto');
const nombreInput = document.getElementById('nombre');
const precioInput = document.getElementById('precio');
const listaCarrito = document.getElementById('lista-carrito');
const total = document.getElementById('total');
const catalogoProductos = document.getElementById('catalogo-productos');
const filtrosForm = document.getElementById('filtros-form');
const busquedaInput = document.getElementById('busqueda');
const ordenarSelect = document.getElementById('ordenar');
const filtrarCategoriaSelect = document.getElementById('filtrar-categoria');
const btnBuscar = document.getElementById('btn-buscar');
const btnVaciar = document.getElementById('btn-vaciar');
const btnPagar = document.getElementById('btn-pagar');

let mensajeCarrito = '';

function iconoCategoria(categoria) {
    switch (categoria) {
        case "Bebida": return "bi-cup-straw";
        case "Comida": return "bi-egg-fried";
        case "Postre": return "bi-cupcake";
        default: return "bi-box";
    }
}

function agruparPorCategoria(productos) {
    return productos.reduce((acum, producto) => {
        if (!acum[producto.categoria]) {
            acum[producto.categoria] = [];
        }
        acum[producto.categoria].push(producto);
        return acum;
    }, {});
}

function llenarCategorias() {
    const categorias = [...new Set(productos.map(p => p.categoria))];
    filtrarCategoriaSelect.innerHTML = '<option value="">Todas las categorías</option>' +
        categorias.map(cat => `<option value="${cat}">${cat}</option>`).join('');
}

function obtenerProductosFiltrados() {
    let resultado = [...productos];
    const texto = busquedaInput.value.trim().toLowerCase();
    if (texto) {
        resultado = resultado.filter(p => p.nombre.toLowerCase().includes(texto));
    }
    const categoria = filtrarCategoriaSelect.value;
    if (categoria) {
        resultado = resultado.filter(p => p.categoria === categoria);
    }
    const orden = ordenarSelect.value;
    if (orden === 'alfabetico') {
        resultado.sort((a, b) => a.nombre.localeCompare(b.nombre));
    } else if (orden === 'precio') {
        resultado.sort((a, b) => a.precio - b.precio);
    } else if (orden === 'categoria') {
        resultado.sort((a, b) => a.categoria.localeCompare(b.categoria));
    }
    return resultado;
}

function mostrarCatalogo(productosFiltrados = null) {
    catalogoProductos.innerHTML = '';
    const lista = productosFiltrados || productos;
    const productosPorCategoria = agruparPorCategoria(lista);
    Object.keys(productosPorCategoria).forEach(categoria => {
        const titulo = document.createElement('h5');
        titulo.className = 'mt-4 mb-3 text-primary';
        titulo.innerHTML = `<i class="bi ${iconoCategoria(categoria)} me-2"></i>${categoria}`;
        catalogoProductos.appendChild(titulo);
        const fila = document.createElement('div');
        fila.className = 'row g-4 mb-2';
        productosPorCategoria[categoria].forEach((producto, index) => {
            const col = document.createElement('div');
            col.className = 'col-12 col-md-6 col-lg-4';
            col.innerHTML = `
                <div class="card h-100 shadow-sm">
                    <div class="card-body d-flex flex-column justify-content-between">
                        <div class="d-flex align-items-center mb-2 gap-2">
                            <i class="bi ${iconoCategoria(producto.categoria)} me-2"></i>
                            <h5 class="card-title mb-0">${producto.nombre}</h5>
                        </div>
                        <p class="card-text mb-1"><strong>Precio:</strong> $${producto.precio}</p>
                        <button class="btn btn-success w-100 agregar-carrito" data-nombre="${producto.nombre}"><i class="bi bi-cart-plus me-1"></i>Agregar al carrito</button>
                    </div>
                </div>
            `;
            fila.appendChild(col);
        });
        catalogoProductos.appendChild(fila);
    });
}

filtrosForm.addEventListener('input', function(e) {
    if (e.target !== btnBuscar) {
        const filtrados = obtenerProductosFiltrados();
        mostrarCatalogo(filtrados);
    }
});
filtrosForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const filtrados = obtenerProductosFiltrados();
    mostrarCatalogo(filtrados);
});

catalogoProductos.addEventListener('click', function(e) {
    if (e.target.classList.contains('agregar-carrito')) {
        mensajeCarrito = '';
        const nombre = e.target.getAttribute('data-nombre');
        const producto = productos.find(p => p.nombre === nombre);
        carrito.push({ ...producto });
        guardarCarrito();
        mostrarCarrito();
    }
});
function mostrarCarrito() {
    listaCarrito.innerHTML = '';
    let total = 0;
    if (mensajeCarrito) {
        listaCarrito.innerHTML = `<li class='list-group-item text-center text-success fw-bold'>${mensajeCarrito}</li>`;
    } else if (carrito.length === 0) {
        listaCarrito.innerHTML = '<li class="list-group-item text-center text-muted">El carrito está vacío.</li>';
    } else {
        carrito.forEach((producto, index) => {
            li = document.createElement('li');
            li.innerHTML = `
                <span><i class="bi bi-bag-check me-1 text-success"></i>${producto.nombre} - $${producto.precio}</span>
                <button class="eliminar btn btn-danger btn-sm ms-2" data-index="${index}"><i class="bi bi-trash"></i></button>
            `;
            li.className = 'list-group-item d-flex justify-content-between align-items-center';
            listaCarrito.appendChild(li);
            total += Number(producto.precio);
        });
    }
    total.textContent = `Total: $${total}`;
}
function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
}
if (formProducto) {
    formProducto.addEventListener('submit', function(e) {
        e.preventDefault();
        const nombre = nombreInput.value.trim();
        const precio = parseInt(precioInput.value);
        if (nombre && precio > 0) {
            productos.push({ nombre, precio, categoria: "Otro" });
            mostrarCatalogo();
            nombreInput.value = '';
            precioInput.value = '';
        }
    });
}
listaCarrito.addEventListener('click', function(e) {
    const btn = e.target.closest('.eliminar');
    if (btn) {
        const index = btn.getAttribute('data-index');
        carrito.splice(index, 1);
        guardarCarrito();
        mostrarCarrito();
    }
});

llenarCategorias();
mostrarCatalogo();
mostrarCarrito();

if (btnVaciar) {
    btnVaciar.addEventListener('click', function() {
        if (carrito.length === 0) return;
        carrito = [];
        guardarCarrito();
        mostrarCarrito();
    });
}

if (btnPagar) {
    btnPagar.addEventListener('click', function() {
        if (carrito.length === 0) {
            mostrarCarrito();
            return;
        }
        carrito = [];
        guardarCarrito();
        mensajeCarrito = '¡Gracias por tu compra!';
        mostrarCarrito();
    });
} 