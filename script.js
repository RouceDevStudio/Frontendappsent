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

// 3. RENDERIZADO DE ALTO RENDIMIENTO
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
        
        const isOnline = (item.reportes || 0) < 3;
        const media = /\.(mp4|webm|mov)$/i.test(item.image) ?
            `<video src="${item.image}" class="juego-img" autoplay muted loop playsinline></video>` :
            `<img src="${item.image}" class="juego-img" loading="lazy">`;
        
        const nivelAutor = mapaUsuarios[item.usuario] || 0;

        card.innerHTML = `
            <div class="status-badge ${isOnline ? 'status-online' : 'status-review'}">
                <ion-icon name="${isOnline ? 'checkmark-circle' : 'alert-circle'}"></ion-icon>
                <span>${isOnline ? 'Online' : 'Revisión'}</span>
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

// 4. FUNCIÓN VISITAR PERFIL
function visitarPerfil(usuario) {
    if (!usuario) return;
    window.location.href = `./perfil-publico.html?u=${encodeURIComponent(usuario)}`;
}

// ✅ FUNCIÓN PARA SEGUIR USUARIO
async function seguirUsuario(usuarioASeguir) {
    const usuarioActual = localStorage.getItem("user_admin");
    
    if (!usuarioActual) {
        alert("⚠️ Inicia sesión para seguir usuarios.");
        window.location.href = './index.html';
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/usuarios/seguir`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                seguidor: usuarioActual, 
                siguiendo: usuarioASeguir 
            })
        });
        
        if (res.ok) {
            alert(`✅ Ahora sigues a @${usuarioASeguir}`);
            // Recargar si estamos en perfil público
            if (window.location.pathname.includes('perfil-publico')) {
                location.reload();
            }
        } else {
            const data = await res.json();
            alert(data.message || "ℹ️ Ya sigues a este usuario.");
        }
    } catch (e) {
        console.error(e);
        alert("❌ Error al seguir usuario.");
    }
}

// ✅ NUEVO: Función para dejar de seguir
async function dejarDeSeguir(usuarioADejarDeSeguir) {
    const usuarioActual = localStorage.getItem("user_admin");
    
    if (!usuarioActual) return;
    
    if (confirm(`¿Dejar de seguir a @${usuarioADejarDeSeguir}?`)) {
        try {
            const res = await fetch(`${API_URL}/usuarios/dejar-seguir`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    seguidor: usuarioActual, 
                    siguiendo: usuarioADejarDeSeguir 
                })
            });
            
            if (res.ok) {
                alert(`💔 Dejaste de seguir a @${usuarioADejarDeSeguir}`);
                if (window.location.pathname.includes('perfil-publico')) {
                    location.reload();
                }
            }
        } catch (e) {
            console.error(e);
            alert("❌ Error al dejar de seguir.");
        }
    }
}

// Hacer funciones globales
window.seguirUsuario = seguirUsuario;
window.dejarDeSeguir = dejarDeSeguir;
window.visitarPerfil = visitarPerfil;

// ✅ CORREGIDO: Botón Mi Perfil redirige a perfil.html local
const btnMiPerfil = document.getElementById("btn-mi-perfil");
if (btnMiPerfil) {
    btnMiPerfil.onclick = () => {
        const u = localStorage.getItem("user_admin");
        if (u) {
            window.location.href = "./perfil.html";
        } else {
            window.location.href = "./index.html";
        }
    };
}

// 5. BUSCADOR - ✅ CORREGIDO
if (buscador) {
    buscador.addEventListener('input', function(e) {
        const term = e.target.value.toLowerCase().trim();
        const filtrados = todosLosItems.filter(i =>
            (i.title + (i.usuario || "") + (i.category || "")).toLowerCase().includes(term)
        );
        renderizar(filtrados);
    });
}

// 6. FUNCIONES SOCIALES (Sincronizadas con rutas del Server)
async function share(id) {
    const url = `${window.location.origin}${window.location.pathname}?id=${id}`;
    try {
        await navigator.clipboard.writeText(url);
        alert("✅ Enlace copiado al portapapeles.");
    } catch (e) {
        // Fallback para navegadores que no soportan clipboard
        const textarea = document.createElement('textarea');
        textarea.value = url;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        alert("✅ Enlace copiado al portapapeles.");
    }
}

async function fav(id) {
    const user = localStorage.getItem("user_admin");
    if (!user) return alert("⚠️ Inicia sesión para guardar favoritos.");
    try {
        const res = await fetch(`${API_URL}/favoritos/add`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: user, itemId: id })
        });
        
        if (res.ok) {
            alert("💾 Guardado en Bóveda.");
        } else {
            const data = await res.json();
            alert(data.message || "ℹ️ Ya está en tu Bóveda.");
        }
    } catch (e) { 
        console.error(e);
        alert("❌ Error al guardar en favoritos.");
    }
}

async function report(id) {
    if (confirm("⚠️ ¿Reportar error en este enlace?")) {
        try {
            await fetch(`${API_URL}/items/report/${id}`, { method: 'PUT' });
            alert("✅ Reporte enviado. Gracias por tu colaboración.");
        } catch (e) {
            console.error(e);
            alert("❌ Error al enviar reporte.");
        }
    }
}

async function cargarComm(id) {
    const box = document.getElementById(`list-${id}`);
    if (!box) return;
    
    try {
        const res = await fetch(`${API_URL}/comentarios/${id}`);
        const data = await res.json();
        
        box.innerHTML = data.map(c => `
            <div class="comm-item" style="margin-bottom:8px; border-left:2px solid var(--primary); padding-left:8px;">
                <b style="color:var(--primary); font-size:0.7rem; cursor:pointer;" 
                   class="user-tag-comment" data-usuario="${c.usuario}">
                    @${c.usuario}
                    ${getVerificadoBadge(c.usuario)}
                </b>
                <p style="font-size:0.75rem; color:#ddd; margin:0;">${c.texto || 'Sin texto'}</p>
            </div>
        `).join('') || '<p style="font-size:0.7rem; color:#555;">Sin opiniones aún.</p>';
        
        // Agregar listeners a nombres de usuarios en comentarios
        box.querySelectorAll('.user-tag-comment').forEach(tag => {
            tag.addEventListener('click', (e) => {
                e.stopPropagation();
                visitarPerfil(tag.dataset.usuario);
            });
        });
    } catch (e) {
        box.innerHTML = '<p style="color: #ff4343; font-size:0.8rem;">Error al cargar opiniones</p>';
    }
}

async function postComm(id) {
    const user = localStorage.getItem("user_admin");
    const input = document.getElementById(`input-${id}`);
    if (!user) return alert("⚠️ Inicia sesión para comentar.");
    if (!input || !input.value.trim()) return;
    
    try {
        const res = await fetch(`${API_URL}/comentarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usuario: user, texto: input.value.trim(), itemId: id })
        });
        if (res.ok) {
            input.value = "";
            cargarComm(id);
        } else {
            alert("❌ Error al publicar comentario.");
        }
    } catch (e) { 
        console.error(e);
        alert("❌ Error de conexión.");
    }
}

function handleMail(event) {
    event.preventDefault(); // Evita que el visor intente cargar la URL y falle
    
    const email = "mr.m0onster@protonmail.com";
    const subject = "Reporte UpGames";
    const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(subject)}`;

    // Intentamos abrirlo en una ventana nueva. 
    // Esto fuerza a Android a preguntar "¿Con qué app quieres abrir esto?" 
    // en lugar de intentar cargarlo dentro de SPCK.
    window.open(mailtoUrl, '_system'); 
    
    // Fallback: Si después de 1 segundo el usuario sigue aquí, 
    // es que el visor es muy limitado. Copiamos el email al portapapeles.
    setTimeout(() => {
        navigator.clipboard.writeText(email);
        alert("Copiado al portapapeles: " + email);
    }, 1000);
}




// 7. SISTEMA DE MONETIZACIÓN (PUENTE) - Mantenido igual
document.addEventListener('click', function(e) {
    const anchor = e.target.closest('a');
    if (anchor && anchor.href) {
        const urlDestino = anchor.href;
        if (urlDestino.includes('mailto:mr.m0onster@protonmail.com')) return;
        
        const dominiosSeguros = ['roucedevstudio.github.io', 'backendapp-037y.onrender.com', window.location.hostname];
        const esSeguro = dominiosSeguros.some(dominio => urlDestino.includes(dominio));
        
        if (!esSeguro) {
            e.preventDefault();
            window.location.href = './puente.html?dest=' + encodeURIComponent(urlDestino);
        }
    }
}, true);

// 8. CERRAR OVERLAY AL HACER CLICK FUERA
if (overlay) {
    overlay.onclick = () => {
        document.querySelector('.juego-card.expandida')?.classList.remove('expandida');
        overlay.style.display = 'none';
        document.body.style.overflow = 'auto';
    };
}

document.addEventListener("DOMContentLoaded", cargarContenido);
