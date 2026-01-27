/**
 * UPGAMES CLOUD PRO - NÚCLEO TOTAL RESTAURADO v2
 * FIX: REDIRECCIÓN DE PERFIL Y COMPATIBILIDAD GLOBAL
 */

const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");
let todosLosItems = [];

// 1. CARGA INICIAL
async function cargarContenido() {
    try {
        const res = await fetch(`${API_URL}/items`);
        const data = await res.json();
        todosLosItems = data.filter(i => i.status === "aprobado");
        
        const loading = document.getElementById("loading-state");
        if (loading) loading.style.display = "none";
        
        aplicarEstiloUsuario();
        renderizar(todosLosItems);
        
        // Lógica para links directos por ID
        const sharedId = new URLSearchParams(window.location.search).get('id');
        if (sharedId) {
            setTimeout(() => {
                const target = document.querySelector(`[data-id="${sharedId}"]`);
                if (target) target.click();
            }, 800);
        }
    } catch (e) {
        console.error("Error cargando contenido");
        setTimeout(cargarContenido, 3000);
    }
}

// 2. BUSCADOR DINÁMICO
if (buscador) {
    buscador.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtrados = todosLosItems.filter(i => 
            (i.title && i.title.toLowerCase().includes(term)) || 
            (i.usuario && i.usuario.toLowerCase().includes(term))
        );
        renderizar(filtrados);
    });
}

// 3. MOTOR DE RENDERIZADO
function renderizar(lista) {
    if (!output) return;
    output.innerHTML = "";

    lista.forEach(item => {
        const card = document.createElement("div");
        card.className = "juego-card";
        card.setAttribute("data-id", item._id);
        
        const esVideo = /\.(mp4|webm|mov)$/i.test(item.image);
        const media = esVideo ? 
            `<video src="${item.image}" class="juego-img" autoplay muted loop playsinline></video>` : 
            `<img src="${item.image}" class="juego-img" loading="lazy">`;

        card.innerHTML = `
            <div class="close-btn"><ion-icon name="close-outline"></ion-icon></div>
            <div class="status-badge">Online</div>
            ${media}
            <div class="card-content">
                <span class="user-tag" onclick="event.stopPropagation(); visitarPerfil('${item.usuario}')">@${item.usuario || 'CloudUser'}</span>
                <h4 class="juego-titulo">${item.title}</h4>
                
                <div class="social-actions">
                    <button class="action-btn" type="button" onclick="event.stopPropagation(); fav('${item._id}')">
                        <ion-icon name="heart-outline"></ion-icon>
                    </button>
                    <button class="action-btn" type="button" onclick="event.stopPropagation(); share('${item._id}')">
                        <ion-icon name="share-social-outline"></ion-icon>
                    </button>
                    <button class="action-btn" type="button" onclick="event.stopPropagation(); report('${item._id}')">
                        <ion-icon name="flag-outline"></ion-icon>
                    </button>
                </div>

                <p class="cloud-note">${item.description || 'Sin descripción.'}</p>
                
                <a href="${item.link}" class="boton-descargar-full">ACCEDER A LA NUBE</a>

                <div class="comentarios-section">
                    <h5 style="color:var(--primary); font-size:0.7rem; margin-bottom:8px;">OPINIONES</h5>
                    <div id="list-${item._id}" class="comentarios-list">Cargando...</div>
                    <div class="add-comment">
                        <input type="text" id="input-${item._id}" placeholder="Escribe..." onclick="event.stopPropagation()">
                        <button type="button" onclick="event.stopPropagation(); postComm('${item._id}')">OK</button>
                    </div>
                </div>
            </div>`;

        card.onclick = (e) => {
            if (e.target.closest('.boton-descargar-full') || e.target.closest('.user-tag') || e.target.closest('.action-btn')) return; 
            if (!card.classList.contains("expandida")) {
                card.classList.add("expandida");
                document.body.style.overflow = "hidden";
                cargarComm(item._id);
            }
        };

        card.querySelector(".close-btn").onclick = (e) => {
            e.stopPropagation();
            card.classList.remove("expandida");
            document.body.style.overflow = "auto";
        };

        output.appendChild(card);
    });
}

// 4. SISTEMA DE PUENTE
document.addEventListener('click', function(e) {
    const link = e.target.closest('a');
    if (link && link.href) {
        const url = link.href;
        const dominiosSeguros = ['roucedevstudio.github.io', 'backendapp-037y.onrender.com', window.location.hostname];
        const esExterno = !dominiosSeguros.some(d => url.includes(d)) && !url.includes('mailto:');

        if (esExterno) {
            e.preventDefault();
            window.location.href = './puente.html?d:est=' + encodeURIComponent(url);
        }
    }
}, true);

// 5. FUNCIÓN DE REDIRECCIÓN A PERFIL (PROTEGIDA)
function visitarPerfil(usuario) {
    if (!usuario || usuario === 'undefined') {
        alert("Usuario no identificado.");
        return;
    }
    localStorage.setItem("ver_perfil_de", usuario);
    window.location.href = "https://roucedevstudio.github.io/PerfilApp/";
}

// 6. DETECTOR GLOBAL PARA EL ICONO DE PERFIL (HEADER)
document.addEventListener("click", (e) => {
    // Busca si el clic fue en el contenedor del perfil o en el icono de adentro
    const btnPerfil = e.target.closest(".ProfileIcon") || e.target.closest(".UpIcon");
    
    if (btnPerfil) {
        const miUsuario = localStorage.getItem("user_admin");
        if (miUsuario) {
            visitarPerfil(miUsuario);
        } else {
            window.location.href = "https://roucedevstudio.github.io/LoginApp/";
        }
    }
});

// 7. FAVORITOS, REPORTES Y COMPARTIR
async function fav(id) {
    const u = localStorage.getItem("user_admin");
    if(!u) return alert("Inicia sesión.");
    try {
        const res = await fetch(`${API_URL}/favoritos/add`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ usuario: u, itemId: id })
        });
        alert(res.ok ? "Guardado en Bóveda." : "Ya está en favoritos.");
    } catch (e) { alert("Error al guardar."); }
}

async function report(id) {
    if (confirm("¿Reportar error en este link?")) {
        await fetch(`${API_URL}/items/report/${id}`, { method: 'PUT' });
        alert("Reporte enviado.");
    }
}

async function share(id) {
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    await navigator.clipboard.writeText(url);
    alert("Link copiado.");
}

// 8. COMENTARIOS
async function cargarComm(id) {
    const box = document.getElementById(`list-${id}`);
    try {
        const res = await fetch(`${API_URL}/comentarios/${id}`);
        const data = await res.json();
        box.innerHTML = data.map(c => `<div class="comm-item"><b>@${c.usuario}:</b> ${c.texto}</div>`).join('') || "Sin opiniones.";
    } catch(e) { box.innerHTML = "Error."; }
}

async function postComm(id) {
    const u = localStorage.getItem("user_admin");
    const input = document.getElementById(`input-${id}`);
    if(!u || !input.value.trim()) return;
    await fetch(`${API_URL}/comentarios`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ usuario: u, texto: input.value, itemId: id })
    });
    input.value = "";
    cargarComm(id);
}

// 9. PERSONALIZACIÓN
function aplicarEstiloUsuario() {
    const config = JSON.parse(localStorage.getItem("user_style") || "{}");
    if(config.themeColor) document.documentElement.style.setProperty('--primary', config.themeColor);
    if(config.layoutMode === "list") output.classList.add('view-mode-list');
}

document.addEventListener("DOMContentLoaded", cargarContenido);
