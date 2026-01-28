const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");
const overlay = document.getElementById("overlay");
const loadingState = document.getElementById("loading-state");

let todosLosItems = [];

// 1. DESPERTADOR INMEDIATO
(function despertar() {
    fetch(`${API_URL}/items`, { mode: 'no-cors' }).catch(() => {});
})();

// 2. CARGA DE DATOS CENTRALIZADA
async function cargarContenido() {
    if (!localStorage.getItem("terminos_aceptados_v2")) {
        alert("AVISO LEGAL:\n1. Servicio técnico.\n2. Responsabilidad del usuario.\n3. UpGames no edita contenido ajeno.");
        localStorage.setItem("terminos_aceptados_v2", "true");
    }
    
    try {
        const res = await fetch(`${API_URL}/items`);
        const data = await res.json();
        
        if (loadingState) loadingState.style.display = "none";
        
        todosLosItems = data.filter(i => i.status === "aprobado");
        renderizar(todosLosItems);
        
        const sharedId = new URLSearchParams(window.location.search).get('id');
        if (sharedId) setTimeout(() => document.querySelector(`[data-id="${sharedId}"]`)?.click(), 500);
        
    } catch (e) {
        if (loadingState) loadingState.innerHTML = `<p style="color:red">ERROR DE NÚCLEO. REINTENTANDO...</p>`;
        setTimeout(cargarContenido, 3000);
    }
}

// 3. RENDERIZADO DE ALTO RENDIMIENTO
function renderizar(lista) {
    output.innerHTML = lista.length ? "" : `
        <div class="no-results">
            <ion-icon name="cloud-offline-outline"></ion-icon>
            <h3>Sin resultados</h3>
            <p>No hay coincidencias en la nube.</p>
            <a href="https://roucedevstudio.github.io/Frontendappback/" class="btn-subir-vacio">SUBIR AHORA</a>
        </div>`;
    
    const fragment = document.createDocumentFragment();
    
    lista.forEach(item => {
        const card = document.createElement("div");
        card.className = "juego-card";
        card.setAttribute("data-id", item._id);
        
        const isOnline = (item.reportes || 0) < 3;
        const media = /\.(mp4|webm|mov)$/i.test(item.image) ?
            `<video src="${item.image}" class="juego-img" autoplay muted loop playsinline></video>` :
            `<img src="${item.image}" class="juego-img" loading="lazy">`;
        
        card.innerHTML = `
            <div class="status-badge ${isOnline ? 'status-online' : 'status-review'}">
                <ion-icon name="${isOnline ? 'checkmark-circle' : 'alert-circle'}"></ion-icon>
                <span>${isOnline ? 'Online' : 'Revisión'}</span>
            </div>
            <div class="close-btn"><ion-icon name="close-outline"></ion-icon></div>
            ${media}
            <div class="card-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span class="user-tag" onclick="event.stopPropagation(); visitarPerfil('${item.usuario}')">@${item.usuario || 'Cloud User'}</span>
                    <span class="category-badge">${item.category || 'Gral'}</span>
                </div>
                <h4 class="juego-titulo">${item.title}</h4>
                <div class="social-actions">
                    <button class="action-btn" onclick="event.stopPropagation(); fav('${item._id}')"><ion-icon name="heart-sharp"></ion-icon></button>
                    <button class="action-btn" onclick="event.stopPropagation(); share('${item._id}')"><ion-icon name="share-social-sharp"></ion-icon></button>
                    <button class="action-btn" onclick="event.stopPropagation(); report('${item._id}')"><ion-icon name="flag-sharp"></ion-icon></button>
                </div>
                <p class="cloud-note">${item.description || 'Sin descripción.'}</p>
                
                <div class="boton-descargar-full" style="position:relative; cursor:pointer;">
                    <a href="${item.link}" target="_blank" 
                       style="position:absolute; top:0; left:0; width:100%; height:100%; text-decoration:none; color:inherit; display:flex; align-items:center; justify-content:center;"
                       onclick="event.stopPropagation();">
                       ACCEDER A LA NUBE
                    </a>
                    <span style="visibility:hidden">ACCEDER A LA NUBE</span>
                </div>
                
                <div class="comentarios-section">
                    <h5 style="color:var(--primary); font-size:0.7rem; margin-bottom:10px;">OPINIONES</h5>
                    <div class="comentarios-list" id="list-${item._id}">Cargando...</div>
                    <div class="add-comment" style="display:flex; gap:5px; margin-top:10px;">
                        <input type="text" id="input-${item._id}" placeholder="Escribe..." onclick="event.stopPropagation()">
                        <button onclick="event.stopPropagation(); postComm('${item._id}')">OK</button>
                    </div>
                </div>
            </div>`;
        
        card.onclick = () => {
            if (!card.classList.contains("expandida")) {
                card.classList.add("expandida");
                overlay.style.display = "block";
                document.body.style.overflow = "hidden";
                cargarComm(item._id);
            }
        };
        
        card.querySelector(".close-btn").onclick = (e) => {
            e.stopPropagation();
            card.classList.remove("expandida");
            overlay.style.display = "none";
            document.body.style.overflow = "auto";
        };
        
        fragment.appendChild(card);
    });
    output.appendChild(fragment);

    // FORZAR ESCANEO DE CUTY
    if (typeof cuty_init === 'function') {
        setTimeout(cuty_init, 400);
    }
}

// 4. FUNCIONES DE PERFIL Y NAVEGACIÓN
function visitarPerfil(user) {
    if (!user || user === 'Cloud User') return;
    localStorage.setItem("ver_perfil_de", user);
    window.location.href = "https://roucedevstudio.github.io/PerfilApp/";
}

document.getElementById("btn-mi-perfil").onclick = () => {
    const u = localStorage.getItem("user_admin");
    if (u) { localStorage.setItem("ver_perfil_de", u);
        window.location.href = "https://roucedevstudio.github.io/PerfilApp/"; }
    else { window.location.href = "https://roucedevstudio.github.io/LoginApp/"; }
};

// 5. BUSCADOR
buscador.oninput = (e) => {
    const term = e.target.value.toLowerCase().trim();
    const filtrados = todosLosItems.filter(i =>
        (i.title + (i.usuario || "") + (i.category || "")).toLowerCase().includes(term)
    );
    renderizar(filtrados);
};

// 6. FUNCIONES SOCIALES
async function share(id) {
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    await navigator.clipboard.writeText(url);
    alert("Enlace copiado.");
}

async function fav(id) {
    const user = localStorage.getItem("user_admin");
    if (!user) return alert("Inicia sesión.");
    try {
        const res = await fetch(`${API_URL}/favoritos/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: user, itemId: id })
        });
        alert(res.ok ? "Guardado en Bóveda." : "Ya está en tu Bóveda.");
    } catch (e) { console.error(e); }
}

async function report(id) {
    if (confirm("¿Reportar error en link?")) {
        await fetch(`${API_URL}/items/report/${id}`, { method: 'PUT' });
        alert("Reporte enviado.");
    }
}

async function cargarComm(id) {
    const box = document.getElementById(`list-${id}`);
    try {
        const res = await fetch(`${API_URL}/comentarios/${id}`);
        const data = await res.json();
        box.innerHTML = data.map(c => `
            <div class="comm-item" style="margin-bottom:8px; border-left:2px solid var(--primary); padding-left:8px;">
                <b style="color:var(--primary); font-size:0.7rem;" onclick="visitarPerfil('${c.usuario}')">@${c.usuario}</b>
                <p style="font-size:0.75rem; color:#ddd; margin:0;">${c.texto}</p>
            </div>`).join('') || '<p style="font-size:0.7rem; color:#555;">Sin opiniones aún.</p>';
    } catch (e) { box.innerHTML = "Error al cargar."; }
}

async function postComm(id) {
    const user = localStorage.getItem("user_admin");
    const input = document.getElementById(`input-${id}`);
    if (!user) return alert("Inicia sesión.");
    if (!input.value.trim()) return;
    
    await fetch(`${API_URL}/comentarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ usuario: user, texto: input.value, itemId: id })
    });
    input.value = "";
    cargarComm(id);
}

document.addEventListener("DOMContentLoaded", cargarContenido);


// 7. SISTEMA DE PUENTE Y MONETIZACIÓN (ADAPTADO A RENDERIZADO DINÁMICO)
document.addEventListener('click', function(e) {
    // Buscamos si el clic fue en un enlace (etiqueta <a>)
    const anchor = e.target.closest('a');
    
    if (anchor && anchor.href) {
        const urlDestino = anchor.href;

        // EXCLUSIÓN 1: Correo legal mr.m0onster@protonmail.com
        if (urlDestino.includes('mailto:mr.m0onster@protonmail.com')) {
            return; // No interrumpir contacto legal
        }

        // EXCLUSIÓN 2: Dominios internos y de desarrollo
        const dominiosSeguros = [
            'roucedevstudio.github.io',
            'backendapp-037y.onrender.com', // Tu API
            window.location.hostname
        ];

        const esSeguro = dominiosSeguros.some(dominio => urlDestino.includes(dominio));

        // REDIRECCIÓN AL PUENTE: Solo si es un link externo (como Mediafire, Mega, etc.)
        if (!esSeguro) {
            e.preventDefault(); 
            e.stopPropagation(); // Evita conflictos con el onclick de la card
            
            // Redirigir a tu puente en la raíz del repositorio
            const puenteUrl = './puente.html?dest=' + encodeURIComponent(urlDestino);
            window.location.href = puenteUrl;
        }
    }
}, true); // El parámetro 'true' es vital: captura el evento antes que otros scripts