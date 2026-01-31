const API_URL = "https://backendapp-037y.onrender.com";
const usuarioLogueado = localStorage.getItem("user_admin");

// ========== HELPER: Petición autenticada ==========
function getAuthHeaders() {
    const token = localStorage.getItem("upgames_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    return headers;
}

// Cache de Selectores DOM
const els = {
    showContent: document.getElementById("showContent"),
    vaultContent: document.getElementById("vaultContent"),
    addTitle: document.getElementById("addTitle"),
    addDescription: document.getElementById("addDescription"),
    addLink: document.getElementById("addLink"),
    addImage: document.getElementById("addImage"),
    addCategory: document.getElementById("addCategory"),
    subirBack: document.getElementById("subirBack"),
    prevTitle: document.getElementById("prev-title"),
    prevImg: document.getElementById("prev-img"),
    prevTag: document.getElementById("prev-tag"),
    userLoggedDisplay: document.getElementById("user-logged-display"),
    userBio: document.getElementById("user-bio"),
    checkVerificado: document.getElementById("check-verificado"),
    avatarDisplay: document.getElementById("avatar-display"),
    avatarIcon: document.getElementById("avatar-icon"),
    avatarImg: document.getElementById("avatar-img"),
    inputAvatarUrl: document.getElementById("input-avatar-url"),
    inputBio: document.getElementById("input-bio"),
    previewAvatar: document.getElementById("preview-avatar")
};

// ==========================================
// ANALIZADOR DE ENLACES (UPGAMES SHIELD)
// ==========================================
function analizarEnlaceSeguro(url) {
    const permitidos = ['mediafire.com', 'mega.nz', 'drive.google.com', 'mega.co.nz'];
    if (!url) return { ok: null };
    try {
        const urlObj = new URL(url);
        const host = urlObj.hostname.replace('www.', '');
        const esValido = permitidos.some(d => host === d || host.endsWith('.' + d));
        
        if (!esValido) {
            return { ok: false, msg: "❌ ENLACE RECHAZADO: Solo se permite MediaFire, Mega o Drive. ¡Prohibido usar acortadores!" };
        }
        if (url.toLowerCase().endsWith('.exe') || url.toLowerCase().endsWith('.msi')) {
            return { ok: false, msg: "⚠️ SEGURIDAD: No enlaces directamente a archivos .exe. Por favor, usa .zip o .rar" };
        }
        return { ok: true };
    } catch (e) {
        return { ok: false, msg: "❌ El formato del enlace no es válido." };
    }
}

// ==========================================
// 1. LÓGICA DE VISTA PREVIA
// ==========================================
function actualizarPreview() {
    if (els.prevTitle) els.prevTitle.textContent = els.addTitle.value || "Título del Proyecto";
    if (els.prevTag) els.prevTag.textContent = (els.addCategory.value || "Categoría").toUpperCase();
    if (els.prevImg) els.prevImg.src = els.addImage.value || "https://via.placeholder.com/300x150?text=Esperando+Imagen";
    
    if (els.addLink && els.addLink.value.trim() !== "") {
        const res = analizarEnlaceSeguro(els.addLink.value.trim());
        els.addLink.style.borderColor = res.ok ? "#5EFF43" : "#ff4444";
    } else if (els.addLink) {
        els.addLink.style.borderColor = "";
    }
}

[els.addTitle, els.addImage, els.addCategory, els.addLink].forEach(el => {
    el?.addEventListener("input", actualizarPreview);
});

// ==========================================
// 2. MOSTRAR NOMBRE + VERIFICADO + AVATAR + BIO
// ==========================================
async function mostrarUsuarioVerificado() {
    if (!usuarioLogueado || !els.userLoggedDisplay || !els.checkVerificado) return;
    
    els.userLoggedDisplay.textContent = `@${usuarioLogueado}`;
    
    try {
        // ✅ CORREGIDO: usar /auth/users-public (no requiere autenticación)
        // antes usaba /auth/users que requiere admin → fallaba con 401
        const res = await fetch(`${API_URL}/auth/users-public`);
        const data = await res.json();
        // /auth/users-public devuelve un array directamente
        const usuarioData = Array.isArray(data) ? data.find(u => u.usuario === usuarioLogueado) : null;
        if (!usuarioData) return;
        
        const nivel = usuarioData.verificadoNivel || 0;
        
        if (nivel > 0) {
            els.checkVerificado.style.display = "inline-flex";
            let icon = "checkmark-circle";
            let clase = "check-verify";
            
            if (nivel === 1) clase += " r-bronce";
            else if (nivel === 2) clase += " r-oro";
            else if (nivel === 3) {
                clase += " r-elite";
                icon = "checkmark-done-circle-sharp";
            }
            
            els.checkVerificado.className = clase;
            els.checkVerificado.innerHTML = `<ion-icon name="${icon}"></ion-icon>`;
            els.checkVerificado.title = `Verificado Nivel ${nivel}`;
        }
        
        // Cargar Avatar
        const avatarUrl = usuarioData.avatar || localStorage.getItem(`avatar_${usuarioLogueado}`);
        if (avatarUrl && els.avatarImg) {
            els.avatarImg.src = avatarUrl;
            els.avatarImg.style.display = 'block';
            if (els.avatarIcon) els.avatarIcon.style.display = 'none';
        } else {
            if (els.avatarImg) els.avatarImg.style.display = 'none';
            if (els.avatarIcon) {
                els.avatarIcon.style.display = 'flex';
                els.avatarIcon.textContent = usuarioLogueado.charAt(0).toUpperCase();
            }
        }
        
        // Cargar Biografía
        const bio = usuarioData.bio || localStorage.getItem(`bio_${usuarioLogueado}`);
        if (bio && els.userBio) {
            els.userBio.textContent = bio;
            els.userBio.style.display = 'block';
        }
        
    } catch (e) {
        console.error("Error cargando datos de usuario:", e);
    }
}

// ==========================================
// 3. SUBIR METADATOS AL BACKEND
// ==========================================
if (els.subirBack) {
    els.subirBack.onclick = async () => {
        if (!usuarioLogueado) return alert("⚠️ SESIÓN EXPIRADA. Recarga e inicia sesión.");
        
        const title = els.addTitle.value.trim();
        const desc = els.addDescription.value.trim();
        const link = els.addLink.value.trim();
        const image = els.addImage.value.trim();
        const category = els.addCategory.value;
        
        if (!title || !link || !image) return alert("⚠️ Completa todos los campos obligatorios.");
        
        const validacion = analizarEnlaceSeguro(link);
        if (validacion.ok === false) return alert(validacion.msg);
        
        els.subirBack.disabled = true;
        els.subirBack.textContent = "⏳ Publicando...";
        
        try {
            // ✅ CORREGIDO: ruta correcta es /items/add (no /items)
            // ✅ CORREGIDO: se agrega header de autorización con el JWT
            const res = await fetch(`${API_URL}/items/add`, {
                method: 'POST',
                headers: getAuthHeaders(),
                body: JSON.stringify({ 
                    title, 
                    description: desc, 
                    link, 
                    image, 
                    category
                    // ❌ ELIMINADO: usuario, reportes, status → el backend los asigna automáticamente
                    // el backend extrae req.usuario del JWT y setea status:"pendiente" y reportes:0
                })
            });
            
            els.subirBack.disabled = false;
            els.subirBack.innerHTML = '<ion-icon name="rocket-outline"></ion-icon> PUBLICAR EN LA NUBE';
            
            if (res.ok) {
                alert("🚀 TU PROYECTO ESTÁ EN REVISIÓN.\n\nRecibirás notificación cuando esté aprobado.");
                [els.addTitle, els.addDescription, els.addLink, els.addImage].forEach(el => el.value = "");
                els.addCategory.value = "Juegos";
                actualizarPreview();
                cargarEstadoActual();
            } else {
                const data = await res.json();
                alert("❌ " + (data.mensaje || data.message || "Error al subir. Revisa tu conexión."));
            }
        } catch (e) {
            console.error(e);
            els.subirBack.disabled = false;
            els.subirBack.innerHTML = '<ion-icon name="rocket-outline"></ion-icon> PUBLICAR EN LA NUBE';
            alert("❌ ERROR DE CONEXIÓN. Verifica tu internet.");
        }
    };
}

// ==========================================
// 4. CARGAR HISTORIAL DEL USUARIO
// ==========================================
async function cargarEstadoActual() {
    if (!els.showContent || !usuarioLogueado) return;
    
    els.showContent.innerHTML = '<p class="empty-msg">⏳ Cargando historial...</p>';
    
    try {
        const res = await fetch(`${API_URL}/items?usuario=${usuarioLogueado}&limit=100`);
        const data = await res.json();
        // ✅ CORREGIDO: el backend devuelve { success, items, pagination }
        // antes el código hacía data.filter() asumiendo un array directo
        const misItems = (data.items || []).filter(i => i.usuario === usuarioLogueado);
        
        if (misItems.length === 0) {
            els.showContent.innerHTML = `
                <p class="empty-msg" style="grid-column: 1/-1;">
                    📦 AÚN NO HAS SUBIDO NADA<br>
                    <small style="color: var(--text-dim);">Usa el formulario de arriba para publicar tu primer proyecto.</small>
                </p>
            `;
            return;
        }
        
        els.showContent.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        misItems.forEach(item => {
            const div = document.createElement("div");
            div.className = "log-item";
            
            const statusIcon = item.status === "aprobado" ? "✅" : "⏳";
            const statusText = item.status === "aprobado" ? "Aprobado" : "En revisión";
            const statusColor = item.status === "aprobado" ? "var(--primary)" : "var(--warning)";
            
            div.innerHTML = `
                <img src="${item.image}" alt="${item.title}" style="width:80px; height:80px; object-fit:cover; border-radius:8px; margin-right:15px; flex-shrink:0;">
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:bold; color:white; margin-bottom:4px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${item.title}</div>
                    <div style="font-size:0.75rem; color:var(--text-dim);">${item.category || 'General'}</div>
                    <div style="font-size:0.75rem; color:${statusColor}; margin-top:4px;">${statusIcon} ${statusText}</div>
                    ${item.status === "aprobado" ? `
                        <button onclick="window.location.href='./biblioteca.html?id=${item._id}'" style="
                            margin-top:8px; background:var(--primary); color:#000; border:none;
                            padding:6px 12px; border-radius:5px; cursor:pointer; font-weight:bold; font-size:0.75rem;
                        ">📖 Ver en Biblioteca</button>
                    ` : ''}
                </div>
                <button class="btn-delete-log" onclick="eliminarItem('${item._id}')" title="Eliminar">
                    <ion-icon name="trash"></ion-icon>
                </button>
            `;
            fragment.appendChild(div);
        });
        
        els.showContent.appendChild(fragment);
        
    } catch (e) {
        console.error(e);
        els.showContent.innerHTML = '<p class="error-msg">❌ Error al cargar historial</p>';
    }
}

// Eliminar item propio
async function eliminarItem(itemId) {
    if (!confirm("¿Eliminar este item permanentemente?")) return;
    try {
        const res = await fetch(`${API_URL}/items/${itemId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        if (res.ok) { alert("✅ Item eliminado."); cargarEstadoActual(); }
        else alert("❌ Error al eliminar.");
    } catch(e) { alert("❌ Error de conexión."); }
}

// ==========================================
// 5. CAMBIAR AVATAR Y BIO
// ==========================================
if (els.avatarDisplay) {
    els.avatarDisplay.addEventListener('click', () => {
        const modal = document.getElementById('modal-avatar');
        if (modal) {
            modal.style.display = 'flex';
            const avatarActual = localStorage.getItem(`avatar_${usuarioLogueado}`) || '';
            const bioActual = localStorage.getItem(`bio_${usuarioLogueado}`) || '';
            if (els.inputAvatarUrl) els.inputAvatarUrl.value = avatarActual;
            if (els.inputBio) els.inputBio.value = bioActual;
            if (els.previewAvatar) els.previewAvatar.src = avatarActual || 'https://via.placeholder.com/120?text=Vista+Previa';
        }
    });
}

if (els.inputAvatarUrl && els.previewAvatar) {
    els.inputAvatarUrl.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        els.previewAvatar.src = url || 'https://via.placeholder.com/120?text=Vista+Previa';
    });
}

async function guardarAvatar() {
    if (!usuarioLogueado) return;
    
    const avatarUrl = els.inputAvatarUrl?.value.trim() || '';
    const bio = els.inputBio?.value.trim() || '';
    
    try {
        // ✅ CORREGIDO: se agrega header de autorización
        // ✅ CORREGIDO: se elimina 'usuario' del body → backend extrae req.usuario del JWT
        const res = await fetch(`${API_URL}/usuarios/actualizar-perfil`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ avatar: avatarUrl, bio: bio })
        });
        
        // Guardar en localStorage como cache
        localStorage.setItem(`avatar_${usuarioLogueado}`, avatarUrl);
        localStorage.setItem(`bio_${usuarioLogueado}`, bio);
        
        if (res.ok) {
            alert("✅ Perfil actualizado correctamente");
        } else {
            alert("⚠️ Guardado localmente (el backend no respondió correctamente)");
        }
        
        mostrarUsuarioVerificado();
        document.getElementById('modal-avatar').style.display = 'none';
    } catch (e) {
        console.error("Error guardando avatar:", e);
        localStorage.setItem(`avatar_${usuarioLogueado}`, avatarUrl);
        localStorage.setItem(`bio_${usuarioLogueado}`, bio);
        mostrarUsuarioVerificado();
        document.getElementById('modal-avatar').style.display = 'none';
    }
}

// ==========================================
// 6. CARGAR FAVORITOS (BÓVEDA)
// ==========================================
async function cargarBoveda() {
    if (!els.vaultContent) return;
    
    if (!usuarioLogueado) {
        els.vaultContent.innerHTML = `<p class="error-msg">⚠️ INICIA SESIÓN</p>`;
        return;
    }

    els.vaultContent.innerHTML = `
        <p class="empty-msg" style="grid-column: 1/-1; text-align: center;">
            <ion-icon name="hourglass-outline" style="font-size: 2rem; display: block; margin: 0 auto 10px;"></ion-icon>
            Cargando favoritos...
        </p>
    `;

    try {
        const res = await fetch(`${API_URL}/favoritos/${usuarioLogueado}`);
        
        if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);
        
        const data = await res.json();

        // ✅ El backend devuelve: { success: true, favoritos: [...], pagination: {...} }
        // Cada elemento del array es un documento Favorito con campo 'itemId' POPULADO:
        //   { _id, usuario, itemId: { _id, title, image, link, usuario, ... }, createdAt }
        const favoritos = data.favoritos || [];

        if (favoritos.length === 0) {
            els.vaultContent.innerHTML = `
                <p class="empty-msg" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    💔 Tu bóveda está vacía.<br>
                    <small style="color: var(--text-dim); margin-top: 10px; display: block;">
                        Agrega favoritos desde la biblioteca haciendo clic en el ❤️
                    </small>
                </p>
            `;
            return;
        }

        els.vaultContent.innerHTML = '';
        const fragment = document.createDocumentFragment();

        favoritos.forEach((fav) => {
            if (!fav || !fav.itemId) return; // itemId puede ser null si el item fue eliminado

            // ✅ CORREGIDO: la estructura es fav.itemId.title, fav.itemId.image, etc.
            // antes el código usaba item.title directamente (como si fuera el item, no el favorito)
            const item = fav.itemId; // el objeto populado del item
            const favDocId = fav._id; // ID del documento Favorito (para eliminar)

            const div = document.createElement("div");
            div.className = "vault-item";

            const safeTitle = (item.title || 'Sin título').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeUsuario = (item.usuario || 'Anónimo').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeImage = item.image || 'https://via.placeholder.com/200x150?text=Sin+Imagen';
            const safeLink = item.link || '#';

            div.innerHTML = `
                <img src="${safeImage}" alt="${safeTitle}" onerror="this.src='https://via.placeholder.com/200x150?text=Sin+Imagen'">
                <div class="vault-item-info">
                    <div class="vault-item-title">${safeTitle}</div>
                    <div class="vault-item-user">@${safeUsuario}</div>
                    <div class="vault-item-actions">
                        <button onclick="window.open('${safeLink}', '_blank')" style="
                            background: var(--primary); color: #000; border: none;
                            padding: 8px 15px; border-radius: 5px; cursor: pointer;
                            font-weight: bold; font-size: 0.8rem;
                            display: flex; align-items: center; gap: 5px;
                        ">
                            <ion-icon name="cloud-download"></ion-icon> Ver
                        </button>
                        <button class="delete" onclick="eliminarDeBoveda('${favDocId}')" style="
                            background: var(--danger); color: white; border: none;
                            padding: 8px 15px; border-radius: 5px; cursor: pointer;
                            font-weight: bold; font-size: 0.8rem;
                            display: flex; align-items: center; gap: 5px;
                        ">
                            <ion-icon name="trash"></ion-icon> Quitar
                        </button>
                    </div>
                </div>
            `;

            fragment.appendChild(div);
        });

        els.vaultContent.appendChild(fragment);

    } catch (e) {
        console.error("❌ Error cargando bóveda:", e);
        els.vaultContent.innerHTML = `
            <p class="error-msg" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                ❌ Error al cargar favoritos<br>
                <small style="color: var(--text-dim); margin-top: 10px; display: block;">
                    ${e.message || 'Error desconocido'}
                </small>
                <button onclick="cargarBoveda()" style="
                    margin-top: 20px; background: var(--primary); color: #000;
                    border: none; padding: 10px 20px; border-radius: 5px;
                    cursor: pointer; font-weight: bold;
                ">🔄 Reintentar</button>
            </p>
        `;
    }
}

// ==========================================
// 7. ELIMINAR DE BÓVEDA
// ==========================================
async function eliminarDeBoveda(favDocId) {
    if (!favDocId) { alert("❌ Error: No se puede identificar el favorito."); return; }
    if (!confirm("¿Quitar este archivo de tu bóveda?")) return;

    try {
        // ✅ CORREGIDO: se agrega header de autorización
        // ✅ CORREGIDO: se elimina el body con 'usuario' → backend verifica req.usuario del JWT
        const res = await fetch(`${API_URL}/favoritos/delete/${favDocId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });

        if (res.ok) {
            alert("💔 Eliminado de tu bóveda.");
            cargarBoveda();
        } else {
            const errorData = await res.json();
            alert(`❌ Error: ${errorData.mensaje || errorData.message || 'No se pudo eliminar'}`);
        }
    } catch (error) {
        console.error("Error eliminando de bóveda:", error);
        alert("❌ Error de conexión.");
    }
}

// ==========================================
// 8. CERRAR SESIÓN
// ==========================================
function cerrarSesion() {
    if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
        // ✅ CORREGIDO: también eliminar el token al cerrar sesión
        localStorage.removeItem("user_admin");
        localStorage.removeItem("upgames_token");
        localStorage.removeItem("upgames_refresh_token");
        alert("👋 Sesión cerrada correctamente.");
        window.location.href = "./index.html";
    }
}

// Hacer funciones globales
window.guardarAvatar = guardarAvatar;
window.eliminarDeBoveda = eliminarDeBoveda;
window.eliminarItem = eliminarItem;
window.cerrarSesion = cerrarSesion;
window.cargarBoveda = cargarBoveda;

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    if (!usuarioLogueado) {
        // Si no hay usuario logueado, redirigir al login
        window.location.href = "./index.html";
        return;
    }
    cargarEstadoActual();
    cargarBoveda();
    actualizarPreview();
    mostrarUsuarioVerificado();
});
