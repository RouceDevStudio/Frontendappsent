const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");
const overlay = document.getElementById("overlay");
const loadingState = document.getElementById("loading-state");

let todosLosItems = [];
let mapaUsuarios = {}; // Diccionario para cruzar @usuario con su nivel de verificación

// 1. DESPERTADOR INMEDIATO
(function despertar() {
    fetch(`${API_URL}/items`, { mode: 'no-cors' }).catch(() => {});
})();

// 2. CARGA DE DATOS CENTRALIZADA (Cruce de datos local)
async function cargarContenido() {
    // Manejo de términos (v2 para coherencia con tu HTML)
    if (!localStorage.getItem("upgames_terms_accepted")) {
        // La modal se controla por el script del HTML que ya tienes
    }
    
    try {
        // PASO A: Obtener niveles de verificación de la ruta /auth/users
        const resUsers = await fetch(`${API_URL}/auth/users`);
        const usuarios = await resUsers.json();
        usuarios.forEach(u => {
            mapaUsuarios[u.usuario] = u.verificadoNivel || 0;
        });

        // PASO B: Obtener los items
        const res = await fetch(`${API_URL}/items`);
        const data = await res.json();
        
        if (loadingState) loadingState.style.display = "none";
        
        todosLosItems = data.filter(i => i.status === "aprobado");
        renderizar(todosLosItems);
        
        const sharedId = new URLSearchParams(window.location.search).get('id');
        if (sharedId) setTimeout(() => document.querySelector(`[data-id="${sharedId}"]`)?.click(), 500);
        
    } catch (e) {
        console.error("Error de carga:", e);
        if (loadingState) loadingState.innerHTML = `<p style="color:red">ERROR DE NÚCLEO. REINTENTANDO...</p>`;
        setTimeout(cargarContenido, 3000);
    }
}

// Helper: Extrae el badge del mapa de usuarios cargado
function getVerificadoBadge(nombreUsuario) {
    const nivel = mapaUsuarios[nombreUsuario] || 0;
    if (nivel === 0) return '';
    
    let colorClass = '';
    if (nivel === 1) colorClass = 'level-1';
    else if (nivel === 2) colorClass = 'level-2';
    else if (nivel === 3) colorClass = 'level-3';
    
    return `
        <span class="verificado-badge ${colorClass}" title="Verificado nivel ${nivel}">
            <ion-icon name="checkmark-circle"></ion-icon>
        </span>
    `;
}

// 3. RENDERIZADO DE ALTO RENDIMIENTO CON LINKSTATUS
function renderizar(lista) {
    output.innerHTML = lista.length ? "" : `
        <div class="no-results">
            <ion-icon name="cloud-offline-outline"></ion-icon>
            <h3>Sin resultados</h3>
            <p>No hay coincidencias en la nube.</p>
            <a href="./perfil.html" class="btn-subir-vacio">SUBIR AHORA</a>
        </div>`;
    
    const fragment = document.createDocumentFragment();
    
    lista.forEach(item => {
        const card = document.createElement("div");
        card.className = "juego-card";
        card.setAttribute("data-id", item._id);
        
        // ⭐ NUEVO: Usar linkStatus del backend
        const linkStatus = item.linkStatus || (item.reportes >= 3 ? 'revision' : 'online');
        const isOnline = linkStatus === 'online';
        const statusText = linkStatus === 'online' ? 'Online' : 
                          linkStatus === 'revision' ? 'Revisión' : 'Caído';
        const statusIcon = linkStatus === 'online' ? 'checkmark-circle' : 
                          linkStatus === 'revision' ? 'alert-circle' : 'close-circle';
        
        const media = /\.(mp4|webm|mov)$/i.test(item.image) ?
            `<video src="${item.image}" class="juego-img" autoplay muted loop playsinline></video>` :
            `<img src="${item.image}" class="juego-img" loading="lazy">`;
        
        const nivelAutor = mapaUsuarios[item.usuario] || 0;

        card.innerHTML = `
            <div class="status-badge ${isOnline ? 'status-online' : 'status-review'}">
                <ion-icon name="${statusIcon}"></ion-icon>
                <span>${statusText}</span>
            </div>
            <div class="close-btn"><ion-icon name="close-outline"></ion-icon></div>
            ${media}
            <div class="card-content">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
                    <span class="user-tag ${nivelAutor > 0 ? 'verificado' : ''}" 
                          data-usuario="${item.usuario}"
                          style="cursor: pointer;">
                        @${item.usuario || 'Cloud User'}
                        ${getVerificadoBadge(item.usuario)}
                    </span>
                    <span class="category-badge">${item.category || 'Gral'}</span>
                </div>
                <h4 class="juego-titulo">${item.title}</h4>
                <div class="social-actions">
                    <button class="action-btn btn-fav" data-id="${item._id}"><ion-icon name="heart-sharp"></ion-icon></button>
                    <button class="action-btn btn-share" data-id="${item._id}"><ion-icon name="share-social-sharp"></ion-icon></button>
                    <button class="action-btn btn-report" data-id="${item._id}"><ion-icon name="flag-sharp"></ion-icon></button>
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
                        <input type="text" id="input-${item._id}" class="input-comment" data-id="${item._id}" placeholder="Escribe...">
                        <button class="btn-post-comment" data-id="${item._id}">OK</button>
                    </div>
                </div>
            </div>`;
        
        // ✅ EVENTO DE CLICK DIRECTO EN LA CARD (SIN DELEGACIÓN)
        card.addEventListener('click', function(e) {
            // No expandir si se clickeó en elementos interactivos
            if (e.target.closest('.user-tag') || 
                e.target.closest('.action-btn') || 
                e.target.closest('.input-comment') || 
                e.target.closest('.btn-post-comment') ||
                e.target.closest('.close-btn') ||
                e.target.closest('a')) {
                return;
            }
            
            if (!card.classList.contains("expandida")) {
                card.classList.add("expandida");
                overlay.style.display = "block";
                document.body.style.overflow = "hidden";
                cargarComm(item._id);
            }
        });
        
        // ✅ BOTÓN CERRAR CON EVENTO DIRECTO
        const closeBtn = card.querySelector(".close-btn");
        closeBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            card.classList.remove("expandida");
            overlay.style.display = "none";
            document.body.style.overflow = "auto";
        });
        
        // ✅ EVENTO CLICK EN NOMBRE DE USUARIO
        const userTag = card.querySelector('.user-tag');
        userTag.addEventListener('click', function(e) {
            e.stopPropagation();
            const usuario = userTag.dataset.usuario;
            visitarPerfil(usuario);
        });
        
        // ✅ EVENTOS DE BOTONES SOCIALES
        const btnFav = card.querySelector('.btn-fav');
        btnFav.addEventListener('click', function(e) {
            e.stopPropagation();
            fav(item._id);
        });
        
        const btnShare = card.querySelector('.btn-share');
        btnShare.addEventListener('click', function(e) {
            e.stopPropagation();
            share(item._id);
        });
        
        const btnReport = card.querySelector('.btn-report');
        btnReport.addEventListener('click', function(e) {
            e.stopPropagation();
            report(item._id);
        });
        
        // ✅ EVENTO DEL BOTÓN DE COMENTARIOS
        const btnPostComment = card.querySelector('.btn-post-comment');
        btnPostComment.addEventListener('click', function(e) {
            e.stopPropagation();
            postComm(item._id);
        });
        
        fragment.appendChild(card);
    });
    
    output.appendChild(fragment);
}

// Cerrar overlay
if (overlay) {
    overlay.addEventListener('click', function() {
        document.querySelectorAll('.juego-card.expandida').forEach(c => c.classList.remove('expandida'));
        overlay.style.display = "none";
        document.body.style.overflow = "auto";
    });
}

// 4. BÚSQUEDA EN TIEMPO REAL
if (buscador) {
    buscador.addEventListener("input", function(e) {
        const q = e.target.value.toLowerCase().trim();
        const filtrados = q === "" ? todosLosItems : todosLosItems.filter(i =>
            (i.title || "").toLowerCase().includes(q) || 
            (i.usuario || "").toLowerCase().includes(q) ||
            (i.category || "").toLowerCase().includes(q)
        );
        renderizar(filtrados);
    });
}

// ==========================================
// 5. SISTEMA DE FAVORITOS
// ==========================================
async function fav(id) {
    const user = localStorage.getItem("user_admin");
    if (!user) {
        if (confirm("Debes iniciar sesión para guardar favoritos.\n¿Ir a Login?")) {
            window.location.href = "./puente.html";
        }
        return;
    }
    
    try {
        const r = await fetch(`${API_URL}/favoritos/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: user, itemId: id })
        });
        
        if (r.ok) {
            showMiniToast("❤️ Guardado en favoritos");
        } else {
            const errData = await r.json();
            if (errData.error && errData.error.includes("Ya está")) {
                showMiniToast("Ya está en tus favoritos");
            } else {
                showMiniToast("Error al guardar");
            }
        }
    } catch (e) {
        console.error(e);
        showMiniToast("❌ Error al guardar en favoritos.");
    }
}

// ==========================================
// 6. SISTEMA DE COMPARTIR
// ==========================================
async function share(id) {
    const base = window.location.origin + window.location.pathname;
    const url = `${base}?id=${id}`;
    
    if (navigator.share) {
        try {
            await navigator.share({ url, title: 'Mira este contenido', text: 'Compartido desde UP GAMES' });
            showMiniToast("✅ Enlace compartido correctamente");
        } catch (e) {
            copiarAlPortapapeles(url);
        }
    } else {
        copiarAlPortapapeles(url);
    }
}

function copiarAlPortapapeles(texto) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(texto)
            .then(() => showMiniToast("📋 Enlace copiado al portapapeles"))
            .catch(() => copiarConFallback(texto));
    } else {
        copiarConFallback(texto);
    }
}

function copiarConFallback(texto) {
    const input = document.createElement("input");
    input.value = texto;
    document.body.appendChild(input);
    input.select();
    input.setSelectionRange(0, 99999);
    try {
        document.execCommand("copy");
        showMiniToast("📋 Enlace copiado");
    } catch (err) {
        showMiniToast("❌ No se pudo copiar");
    }
    document.body.removeChild(input);
}

// ==========================================
// 7. SISTEMA DE REPORTES (MEJORADO)
// ==========================================
async function report(id) {
    if (confirm("⚠️ ¿Reportar error en este enlace?")) {
        try {
            const response = await fetch(`${API_URL}/items/report/${id}`, { method: 'PUT' });
            const data = await response.json();
            
            if (response.ok) {
                showMiniToast("✅ Reporte enviado. Gracias por tu colaboración.");
                
                // ⭐ Actualizar el estado visual inmediatamente
                if (data.linkStatus === 'revision') {
                    const card = document.querySelector(`[data-id="${id}"]`);
                    if (card) {
                        const statusBadge = card.querySelector('.status-badge');
                        if (statusBadge) {
                            statusBadge.className = 'status-badge status-review';
                            statusBadge.innerHTML = `
                                <ion-icon name="alert-circle"></ion-icon>
                                <span>Revisión</span>
                            `;
                        }
                    }
                }
            } else {
                showMiniToast("❌ Error al enviar reporte.");
            }
        } catch (e) {
            console.error(e);
            showMiniToast("❌ Error al enviar reporte.");
        }
    }
}

// ==========================================
// 8. SISTEMA DE COMENTARIOS
// ==========================================
async function cargarComm(id) {
    const box = document.getElementById(`list-${id}`);
    if (!box) return;
    
    try {
        const r = await fetch(`${API_URL}/comentarios/${id}`);
        const comms = await r.json();
        
        if (!comms.length) {
            box.innerHTML = '<p style="color:#888; font-size:0.7rem; text-align:center;">Aún no hay comentarios.</p>';
            return;
        }
        
        box.innerHTML = comms.map(c => `
            <div class="comentario-item">
                <div class="comm-header">
                    <strong class="comm-user">
                        @${c.usuario}
                        ${getVerificadoBadge(c.usuario)}
                    </strong>
                    <span class="comm-fecha">${timeAgo(c.fecha)}</span>
                </div>
                <p class="comm-texto">${c.texto}</p>
            </div>`).join('');
    } catch (e) {
        box.innerHTML = '<p style="color:red; font-size:0.7rem;">Error al cargar comentarios</p>';
    }
}

async function postComm(id) {
    const user = localStorage.getItem("user_admin");
    const input = document.getElementById(`input-${id}`);
    
    if (!user) {
        showMiniToast("⚠️ Debes iniciar sesión para comentar");
        return;
    }
    
    const texto = input.value.trim();
    if (!texto) return;
    
    try {
        const r = await fetch(`${API_URL}/comentarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ itemId: id, usuario: user, texto })
        });
        
        if (r.ok) {
            input.value = "";
            cargarComm(id);
            showMiniToast("✅ Comentario publicado");
        }
    } catch (e) {
        showMiniToast("❌ Error al comentar");
    }
}

// ==========================================
// 9. HELPER: TIME AGO
// ==========================================
function timeAgo(fecha) {
    const ahora = Date.now();
    const diff = ahora - new Date(fecha).getTime();
    const mins = Math.floor(diff / 60000);
    const horas = Math.floor(mins / 60);
    const dias = Math.floor(horas / 24);
    
    if (mins < 1) return "Ahora";
    if (mins < 60) return `${mins}m`;
    if (horas < 24) return `${horas}h`;
    if (dias < 7) return `${dias}d`;
    return new Date(fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

// ==========================================
// 10. MINI TOAST NOTIFICATION
// ==========================================
function showMiniToast(msg) {
    let toast = document.getElementById('miniToast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'miniToast';
        toast.style.cssText = `
            position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%);
            background: rgba(0,0,0,0.9); color: #5EFF43; padding: 12px 24px;
            border-radius: 50px; font-size: 0.85rem; font-weight: 700;
            z-index: 99999; display: none; box-shadow: 0 4px 15px rgba(94,255,67,0.3);
            border: 1px solid #5EFF43;
        `;
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 2500);
}

// ==========================================
// 11. NAVEGACIÓN A PERFIL PÚBLICO
// ==========================================
function visitarPerfil(usuario) {
    window.location.href = `./perfil-publico.html?usuario=${encodeURIComponent(usuario)}`;
}

// ==========================================
// 12. INICIALIZACIÓN
// ==========================================
window.addEventListener("load", cargarContenido);
