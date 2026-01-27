/**
 * UPGAMES CLOUD PRO - NÚCLEO OUTPUT TOTAL v4.1
 * SYNC STATUS: FULL COMPATIBILITY WITH BACKEND 2026
 */

const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");
let todosLosItems = [];

// 1. CARGA INICIAL Y ESTILO
async function cargarContenido() {
    try {
        await aplicarEstiloUsuario(); 
        
        const res = await fetch(`${API_URL}/items`);
        const data = await res.json();
        
        // AJUSTE: Sincronización con estados del backend (Inglés)
        todosLosItems = data.filter(i => i.status === "approved" || i.status === "aprobado");
        
        const loading = document.getElementById("loading-state");
        if (loading) loading.style.display = "none";
        
        renderizar(todosLosItems);
        
        // Soporte para links directos
        const sharedId = new URLSearchParams(window.location.search).get('id');
        if (sharedId) {
            setTimeout(() => {
                const target = document.querySelector(`[data-id="${sharedId}"]`);
                if (target) target.click();
            }, 800);
        }
    } catch (e) {
        console.error("Fallo en carga inicial. Reintentando...");
        setTimeout(cargarContenido, 3000);
    }
}

// 2. BUSCADOR DINÁMICO (Ajustado a i.username)
if (buscador) {
    buscador.addEventListener("input", (e) => {
        const term = e.target.value.toLowerCase().trim();
        const filtrados = todosLosItems.filter(i => {
            const user = i.username || i.usuario || 'CloudUser';
            return (i.title && i.title.toLowerCase().includes(term)) || 
                   (user.toLowerCase().includes(term));
        });
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
        
        // El backend usa 'username'
        const userDisplay = item.username || item.usuario || 'CloudUser';
        
        const esVideo = /\.(mp4|webm|mov)$/i.test(item.image);
        const media = esVideo ? 
            `<video src="${item.image}" class="juego-img" autoplay muted loop playsinline></video>` : 
            `<img src="${item.image}" class="juego-img" loading="lazy">`;

        card.innerHTML = `
            <div class="close-btn"><ion-icon name="close-outline"></ion-icon></div>
            <div class="status-badge">Online</div>
            ${media}
            <div class="card-content">
                <span class="user-tag" onclick="event.stopPropagation(); visitarPerfil('${userDisplay}')">@${userDisplay}</span>
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

        // Expandir card
        card.onclick = (e) => {
            if (e.target.closest('.boton-descargar-full') || e.target.closest('.user-tag') || e.target.closest('.action-btn')) return; 
            if (!card.classList.contains("expandida")) {
                card.classList.add("expandida");
                document.body.style.overflow = "hidden";
                cargarComm(item._id);
            }
        };

        // Cerrar card
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
        const esExterno = !dominiosSeguros.some(d => url.includes(d)) && !url.includes('mailto:') && !url.includes('javascript:');

        if (esExterno && link.classList.contains('boton-descargar-full')) {
            e.preventDefault();
            window.location.href = './puente.html?d:est=' + encodeURIComponent(url);
        }
    }
}, true);

// 5. REDIRECCIÓN A PERFIL
function visitarPerfil(username) {
    if (!username || username === 'undefined') {
        alert("Usuario no identificado.");
        return;
    }
    localStorage.setItem("ver_perfil_de", username);
    window.location.href = "https://roucedevstudio.github.io/PerfilApp/";
}

// 6. DETECTOR HEADER
document.addEventListener("click", (e) => {
    const btnPerfil = e.target.closest(".ProfileIcon") || e.target.closest(".UpIcon");
    const btnUpload = e.target.closest(".UploadBtn") || e.target.closest(".UpIconUpload"); 

    if (btnUpload) {
        window.location.href = "https://roucedevstudio.github.io/SubirApp/";
        return;
    }
    
    if (btnPerfil) {
        const miUsuario = localStorage.getItem("user_admin");
        if (miUsuario) {
            visitarPerfil(miUsuario);
        } else {
            window.location.href = "https://roucedevstudio.github.io/LoginApp/";
        }
    }
});

// 7. BÓVEDA
async function fav(id) {
    const u = localStorage.getItem("user_admin");
    if(!u) return alert("Inicia sesión para guardar.");
    try {
        const res = await fetch(`${API_URL}/favorites/add`, {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ username: u, itemId: id })
        });
        if (res.ok) alert("✅ Guardado en tu Bóveda.");
        else alert("ℹ️ Ya está en tu Bóveda.");
    } catch (e) { alert("Error de red."); }
}

// 8. REPORTES Y COMPARTIR
async function report(id) {
    if (confirm("¿Reportar error en este link?")) {
        await fetch(`${API_URL}/items/report/${id}`, { method: 'PUT' });
        alert("Reporte enviado.");
    }
}

async function share(id) {
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    await navigator.clipboard.writeText(url);
    alert("Enlace copiado al portapapeles.");
}

// 9. COMENTARIOS (Carga y Post - Sincronizado con variables 'username' y 'text')
async function cargarComm(id) {
    const box = document.getElementById(`list-${id}`);
    try {
        const res = await fetch(`${API_URL}/comments/${id}`);
        const data = await res.json();
        box.innerHTML = data.map(c => {
            const user = c.username || c.usuario || 'Anónimo';
            const texto = c.text || c.texto || '';
            return `<div class="comm-item"><b>@${user}:</b> ${texto}</div>`;
        }).join('') || "Sin opiniones aún.";
    } catch(e) { box.innerHTML = "Error."; }
}

async function postComm(id) {
    const u = localStorage.getItem("user_admin");
    const input = document.getElementById(`input-${id}`);
    if(!u || !input.value.trim()) return;
    
    await fetch(`${API_URL}/comments`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ username: u, text: input.value, itemId: id })
    });
    input.value = "";
    cargarComm(id);
}

// 10. AURA Y PERSONALIZACIÓN
async function aplicarEstiloUsuario() {
    const miUsuario = localStorage.getItem("user_admin");
    const auraColor = localStorage.getItem('upgames_aura_color');
    const colorInicial = auraColor || "#5EFF43";

    document.documentElement.style.setProperty('--primary', colorInicial);
    document.documentElement.style.setProperty('--neon-green', colorInicial);

    if (miUsuario) {
        try {
            const res = await fetch(`${API_URL}/auth/user/${miUsuario}`);
            const serverData = await res.json();
            if (serverData && serverData.appStyle?.themeColor) {
                const colorServer = serverData.appStyle.themeColor;
                document.documentElement.style.setProperty('--primary', colorServer);
                document.documentElement.style.setProperty('--neon-green', colorServer);
                localStorage.setItem('upgames_aura_color', colorServer);
            }
        } catch(e) { console.warn("Usando caché local."); }
    }
}

document.addEventListener("DOMContentLoaded", cargarContenido);
