const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");
const overlay = document.getElementById("overlay");
const btnMiPerfil = document.getElementById("btn-mi-perfil");
const loadingState = document.getElementById("loading-state");

let todosLosItems = [];

// --- 1. MANTENEMOS TODA TU LÓGICA DE INICIO (Términos, Scroll, etc.) ---
function verificarTerminos() {
    const aceptado = localStorage.getItem("terminos_aceptados_v2");
    if (!aceptado) {
        alert("AVISO LEGAL:\n1. Servicio de alojamiento técnico.\n2. Responsabilidad del usuario.\n3. UpGames no edita contenido ajeno ni supervisa la propiedad intelectual.");
        localStorage.setItem("terminos_aceptados_v2", "true");
    }
}

// NUEVA FUNCIÓN PARA NAVEGAR (Agregada al set de funciones)
function visitarPerfil(nombreUsuario) {
    if (!nombreUsuario || nombreUsuario === 'Cloud User') return;
    localStorage.setItem("ver_perfil_de", nombreUsuario);
    window.location.href = "https://roucedevstudio.github.io/PerfilApp/";
}

async function cargarContenido() {
    verificarTerminos();
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const sharedId = urlParams.get('id');
        
        const res = await fetch(`${API_URL}/items`);
        const data = await res.json();
        
        if (loadingState) loadingState.style.display = "none";
        
        todosLosItems = data.filter(i => i.status === "aprobado");
        renderizar(todosLosItems);
        
        if (sharedId) {
            setTimeout(() => {
                const card = document.querySelector(`[data-id="${sharedId}"]`);
                if (card) card.click();
            }, 600);
        }
    } catch (e) {
        if (loadingState) {
            loadingState.innerHTML = `
                <div style="text-align:center; color:#ff4343;">
                    <ion-icon name="cloud-offline" style="font-size:3rem;"></ion-icon>
                    <p>ERROR DE CONEXIÓN CON EL NÚCLEO</p>
                    <button onclick="location.reload()" style="background:var(--primary); border:none; padding:5px 15px; border-radius:5px; cursor:pointer;">REINTENTAR</button>
                </div>
            `;
        }
        console.error("Error en la red cloud.");
    }
}

// --- 2. RENDERIZADO (Restaurado a tu estilo original de 278 líneas) ---
function renderizar(lista) {
    output.innerHTML = "";
    
    if (lista.length === 0) {
        output.innerHTML = `
            <div class="no-results">
                <ion-icon name="cloud-offline-outline"></ion-icon>
                <h3>¡Vaya! La nube está vacía</h3>
                <p>No encontramos lo que buscas. ¿Por qué no eres el primero en subirlo?</p>
                <a href="https://roucedevstudio.github.io/Frontendappback/" class="btn-subir-vacio">SUBIR ARCHIVO</a>
            </div>
        `;
        return;
    }
    
    lista.forEach(item => {
        const card = document.createElement("div");
        card.className = "juego-card";
        card.setAttribute("data-id", item._id);
        
        const estaOnline = (item.reportes || 0) < 3;
        const statusClase = estaOnline ? "status-online" : "status-review";
        const statusTexto = estaOnline ? "Online" : "En Revisión";
        const statusIcon = estaOnline ? "checkmark-circle-sharp" : "alert-circle-sharp";
        
        // CORRECCIÓN PUNTO 1: ETIQUETA UNDEFINED
        const categoriaLabel = item.category || item.categoria || "General";
        
        const esVideo = /\.(mp4|webm|mov)$/i.test(item.image);
        const media = esVideo ?
            `<video src="${item.image}" class="juego-img" autoplay muted loop playsinline></video>` :
            `<img src="${item.image}" class="juego-img">`;
        
        card.innerHTML = `
            <div class="status-badge ${statusClase}">
                <ion-icon name="${statusIcon}"></ion-icon> <span>${statusTexto}</span>
            </div>
            <div class="close-btn"><ion-icon name="close-outline"></ion-icon></div>
            ${media}
            <div class="card-content">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px;">
                    
                    <div onclick="event.stopPropagation(); visitarPerfil('${item.usuario}')" 
                         style="color:var(--primary); font-size:10px; font-weight:bold; opacity:0.8; cursor:pointer; text-decoration:underline;">
                         @${item.usuario || 'Cloud User'}
                    </div>

                    <span class="category-badge">${categoriaLabel}</span>
                </div>
                <h4 class="juego-titulo">${item.title}</h4>
                <div class="social-actions">
                    <button class="action-btn" title="Favorito" onclick="event.stopPropagation(); fav('${item._id}')"><ion-icon name="heart-sharp"></ion-icon></button>
                    <button class="action-btn" title="Compartir" onclick="event.stopPropagation(); share('${item._id}')"><ion-icon name="share-social-sharp"></ion-icon></button>
                    <button class="action-btn" title="Reportar Link" onclick="event.stopPropagation(); report('${item._id}')"><ion-icon name="flag-sharp"></ion-icon></button>
                </div>
                <p class="cloud-note">${item.description || 'Sin descripción disponible en los servidores.'}</p>
                <div class="boton-descargar-full" onclick="event.stopPropagation(); window.open('${item.link}', '_blank')">ACCEDER A LA NUBE</div>
                
                <div class="comentarios-section" style="margin-top:20px; border-top:1px solid #222; padding-top:15px;">
                    <h5 style="font-size: 0.7rem; color: var(--primary); margin-bottom: 10px; text-transform: uppercase; letter-spacing:1px;">Opiniones de la Comunidad</h5>
                    
                    <div class="comentarios-list" id="list-${item._id}" 
                         style="max-height: 140px; overflow-y: auto; background: rgba(0,0,0,0.2); border-radius: 8px; padding: 10px; margin-bottom: 10px; display: flex; flex-direction: column; gap: 8px;">
                         <p style="font-size: 0.7rem; color: #444; text-align: center;">Cargando opiniones...</p>
                    </div>

                    <div class="add-comment" style="display: flex; gap: 8px;">
                        <input type="text" id="input-${item._id}" placeholder="Escribe tu reseña..." 
                               style="flex: 1; background: #0a0a0a; border: 1px solid #333; color: #fff; padding: 10px; border-radius: 6px; font-size: 0.8rem; outline:none;"
                               onclick="event.stopPropagation();">
                        <button onclick="event.stopPropagation(); postComm('${item._id}')" 
                                style="background: var(--primary); border: none; padding: 0 15px; border-radius: 6px; color: #000; font-weight: bold; cursor:pointer;">
                            OK
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        // MANTENEMOS TODA TU LÓGICA DE EVENTOS ORIGINALES
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
        
        output.appendChild(card);
    });
}

// --- 3. FUNCIONES SOCIALES COMPLETAS (COMO LAS TENÍAS) ---
async function share(id) {
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    try {
        await navigator.clipboard.writeText(url);
        alert("Enlace de acceso directo copiado al portapapeles.");
    } catch (err) {
        alert("No se pudo copiar el enlace automáticamente.");
    }
}

async function fav(id) {
    const user = localStorage.getItem("user_admin");
    if (!user) return alert("Debes iniciar sesión para guardar en tu Bóveda.");
    
    try {
        const resCheck = await fetch(`${API_URL}/favoritos/${user}`);
        const favs = await resCheck.json();
        const existe = favs.find(f => f.itemId && (f.itemId._id === id || f.itemId === id));
        
        if (existe) {
            const resDel = await fetch(`${API_URL}/favoritos/delete/${existe._id}`, { method: 'DELETE' });
            if (resDel.ok) alert("🗑️ Objeto retirado de tu Bóveda.");
        } else {
            const resAdd = await fetch(`${API_URL}/favoritos/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ usuario: user.trim(), itemId: id })
            });
            if (resAdd.ok) alert("✨ Objeto guardado en tu Bóveda.");
        }
    } catch (e) { console.error("Error en favoritos."); }
}

async function report(id) {
    if (confirm("¿El link está caído o el archivo es incorrecto? Se enviará un reporte técnico.")) {
        try {
            const res = await fetch(`${API_URL}/items/report/${id}`, { method: 'PUT' });
            if (res.ok) {
                alert("Reporte registrado.");
                cargarContenido();
            }
        } catch (e) { alert("Error al enviar reporte."); }
    }
}

async function cargarComm(id) {
    const box = document.getElementById(`list-${id}`);
    try {
        const res = await fetch(`${API_URL}/comentarios/${id}`);
        const data = await res.json();
        if (data.length === 0) {
            box.innerHTML = `<p style="font-size: 0.7rem; color: #555; text-align: center; margin-top:10px;">No hay opiniones. ¡Sé el primero!</p>`;
            return;
        }
        box.innerHTML = data.map(c => `
            <div class="comm-item" style="background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px; border-left: 3px solid var(--primary);">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:3px;">
                    <span onclick="visitarPerfil('${c.usuario}')" style="color: var(--primary); font-size: 0.7rem; font-weight: bold; cursor:pointer;">@${c.usuario}</span>
                    <span style="font-size:0.6rem; color:#444;">${new Date(c.fecha || Date.now()).toLocaleDateString()}</span>
                </div>
                <p style="font-size: 0.75rem; color: #ddd; line-height:1.3; margin:0;">${c.texto}</p>
            </div>
        `).join('');
        box.scrollTop = box.scrollHeight;
    } catch (e) { box.innerHTML = `<p>Error opiniones.</p>`; }
}

async function postComm(id) {
    const user = localStorage.getItem("user_admin");
    const input = document.getElementById(`input-${id}`);
    const txt = input.value;
    if (!user) return alert("Inicia sesión para participar.");
    if (!txt.trim()) return alert("Comentario vacío.");
    
    try {
        const res = await fetch(`${API_URL}/comentarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: user, texto: txt, itemId: id })
        });
        if (res.ok) { input.value = "";
            cargarComm(id); }
    } catch (e) { alert("Error al publicar."); }
}

buscador.oninput = (e) => {
    const term = e.target.value.toLowerCase();
    const filtrados = todosLosItems.filter(i =>
        i.title.toLowerCase().includes(term) ||
        (i.category && i.category.toLowerCase().includes(term))
    );
    renderizar(filtrados);
};

btnMiPerfil.onclick = () => {
    const u = localStorage.getItem("user_admin");
    if (u) {
        localStorage.setItem("ver_perfil_de", u);
        window.location.href = "https://roucedevstudio.github.io/PerfilApp/";
    } else {
        window.location.href = "https://roucedevstudio.github.io/LoginApp/";
    }
};

document.addEventListener("DOMContentLoaded", cargarContenido);