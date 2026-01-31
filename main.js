const API_URL = "https://backendapp-037y.onrender.com";
const usuarioLogueado = localStorage.getItem("user_admin");

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
// NUEVA FUNCIÓN: ANALIZADOR DE ENLACES (UPGAMES SHIELD)
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
// 1. LÓGICA DE VISTA PREVIA (OPTIMIZADA)
// ==========================================
function actualizarPreview() {
    if (els.prevTitle) els.prevTitle.textContent = els.addTitle.value || "Título del Proyecto";
    if (els.prevTag) els.prevTag.textContent = (els.addCategory.value || "Categoría").toUpperCase();
    if (els.prevImg) els.prevImg.src = els.addImage.value || "https://via.placeholder.com/300x150?text=Esperando+Imagen";
    
    // Validación visual del link en tiempo real (Borde dinámico)
    if (els.addLink && els.addLink.value.trim() !== "") {
        const res = analizarEnlaceSeguro(els.addLink.value.trim());
        els.addLink.style.borderColor = res.ok ? "#5EFF43" : "#ff4444";
    } else if (els.addLink) {
        els.addLink.style.borderColor = "";
    }
}

// Escuchadores eficientes
[els.addTitle, els.addImage, els.addCategory, els.addLink].forEach(el => {
    el?.addEventListener("input", actualizarPreview);
});

// ==========================================
// NUEVO: MOSTRAR NOMBRE + VERIFICADO + AVATAR + BIO DEL USUARIO LOGUEADO
// ==========================================
async function mostrarUsuarioVerificado() {
    if (!usuarioLogueado || !els.userLoggedDisplay || !els.checkVerificado) return;
    
    els.userLoggedDisplay.textContent = `@${usuarioLogueado}`;
    
    try {
        const res = await fetch(`${API_URL}/auth/users`);
        const data = await res.json();
        const usuarioData = data.find(u => u.usuario === usuarioLogueado);
        if (!usuarioData) return;
        
        const nivel = usuarioData.verificadoNivel || 0;
        
        // Mostrar badge de verificación
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
// 2. SUBIR METADATOS AL BACKEND (MEJOR VALIDACIÓN)
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
        
        // ✅ VALIDACIÓN DE SEGURIDAD
        const validacion = analizarEnlaceSeguro(link);
        if (validacion.ok === false) return alert(validacion.msg);
        
        try {
            const res = await fetch(`${API_URL}/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    title, 
                    description: desc, 
                    link, 
                    image, 
                    category, 
                    usuario: usuarioLogueado,
                    reportes: 0,
                    status: "pendiente"
                })
            });
            
            if (res.ok) {
                alert("🚀 TU PROYECTO ESTÁ EN REVISIÓN.\n\nRecibirás notificación cuando esté aprobado.");
                [els.addTitle, els.addDescription, els.addLink, els.addImage].forEach(el => el.value = "");
                els.addCategory.value = "general";
                actualizarPreview();
                cargarEstadoActual();
            } else {
                alert("❌ Error al subir. Revisa tu conexión.");
            }
        } catch (e) {
            console.error(e);
            alert("❌ ERROR DE CONEXIÓN. Verifica tu internet.");
        }
    };
}

// ==========================================
// 3. CARGAR HISTORIAL DEL USUARIO
// ==========================================
async function cargarEstadoActual() {
    if (!els.showContent || !usuarioLogueado) return;
    
    els.showContent.innerHTML = '<p class="empty-msg">⏳ Cargando historial...</p>';
    
    try {
        const res = await fetch(`${API_URL}/items`);
        const data = await res.json();
        const misItems = data.filter(i => i.usuario === usuarioLogueado);
        
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
            div.className = "history-item";
            
            const statusIcon = item.status === "aprobado" ? "✅" : "⏳";
            const statusText = item.status === "aprobado" ? "Aprobado" : "En revisión";
            const statusColor = item.status === "aprobado" ? "var(--primary)" : "var(--warning)";
            
            div.innerHTML = `
                <img src="${item.image}" alt="${item.title}">
                <div class="history-info">
                    <div class="history-title">${item.title}</div>
                    <div class="history-category">${item.category || 'General'}</div>
                    <div class="history-status" style="color: ${statusColor};">
                        ${statusIcon} ${statusText}
                    </div>
                    ${item.status === "aprobado" ? `
                        <button onclick="window.location.href='./biblioteca.html?id=${item._id}'" style="
                            margin-top: 10px;
                            background: var(--primary);
                            color: #000;
                            border: none;
                            padding: 8px 15px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-weight: bold;
                            font-size: 0.8rem;
                        ">
                            📖 Ver en Biblioteca
                        </button>
                    ` : ''}
                </div>
            `;
            fragment.appendChild(div);
        });
        
        els.showContent.appendChild(fragment);
        
    } catch (e) {
        console.error(e);
        els.showContent.innerHTML = '<p class="error-msg">❌ Error al cargar historial</p>';
    }
}

// ==========================================
// NUEVO: CAMBIAR AVATAR Y BIO
// ==========================================
if (els.avatarDisplay) {
    els.avatarDisplay.addEventListener('click', () => {
        const modal = document.getElementById('modal-avatar');
        if (modal) {
            modal.style.display = 'flex';
            
            // Pre-cargar valores actuales
            const avatarActual = localStorage.getItem(`avatar_${usuarioLogueado}`) || '';
            const bioActual = localStorage.getItem(`bio_${usuarioLogueado}`) || '';
            
            if (els.inputAvatarUrl) els.inputAvatarUrl.value = avatarActual;
            if (els.inputBio) els.inputBio.value = bioActual;
            if (els.previewAvatar) els.previewAvatar.src = avatarActual || 'https://via.placeholder.com/120?text=Vista+Previa';
        }
    });
}

// Preview del avatar en tiempo real
if (els.inputAvatarUrl && els.previewAvatar) {
    els.inputAvatarUrl.addEventListener('input', (e) => {
        const url = e.target.value.trim();
        if (url) {
            els.previewAvatar.src = url;
        } else {
            els.previewAvatar.src = 'https://via.placeholder.com/120?text=Vista+Previa';
        }
    });
}

async function guardarAvatar() {
    if (!usuarioLogueado) return;
    
    const avatarUrl = els.inputAvatarUrl?.value.trim() || '';
    const bio = els.inputBio?.value.trim() || '';
    
    try {
        // Intentar guardar en el backend
        const res = await fetch(`${API_URL}/usuarios/actualizar-perfil`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                usuario: usuarioLogueado, 
                avatar: avatarUrl,
                bio: bio
            })
        });
        
        if (res.ok) {
            alert("✅ Perfil actualizado correctamente");
            localStorage.setItem(`avatar_${usuarioLogueado}`, avatarUrl);
            localStorage.setItem(`bio_${usuarioLogueado}`, bio);
            mostrarUsuarioVerificado(); // Recargar el perfil
        } else {
            // Fallback: guardar solo en localStorage
            alert("⚠️ Guardado localmente (el backend no está disponible)");
            localStorage.setItem(`avatar_${usuarioLogueado}`, avatarUrl);
            localStorage.setItem(`bio_${usuarioLogueado}`, bio);
            mostrarUsuarioVerificado();
        }
        
        document.getElementById('modal-avatar').style.display = 'none';
    } catch (e) {
        console.error("Error guardando avatar:", e);
        // Guardar en localStorage como fallback
        if (avatarUrl) {
            localStorage.setItem(`avatar_${usuarioLogueado}`, avatarUrl);
        }
        if (bio) {
            localStorage.setItem(`bio_${usuarioLogueado}`, bio);
        }
        
        document.getElementById('modal-avatar').style.display = 'none';
    }
}

// ✅ FUNCIÓN MEJORADA: cargar favoritos (Bóveda) con mejor manejo de errores
async function cargarBoveda() {
    if (!els.vaultContent) {
        console.warn("Elemento vaultContent no encontrado");
        return;
    }
    
    if (!usuarioLogueado) {
        els.vaultContent.innerHTML = `<p class="error-msg">⚠️ INICIA SESIÓN</p>`;
        return;
    }

    // Mostrar estado de carga
    els.vaultContent.innerHTML = `
        <p class="empty-msg" style="grid-column: 1/-1; text-align: center;">
            <ion-icon name="hourglass-outline" style="font-size: 2rem; display: block; margin: 0 auto 10px;"></ion-icon>
            Cargando favoritos...
        </p>
    `;

    try {
        console.log(`🔍 Cargando favoritos para: ${usuarioLogueado}`);
        const res = await fetch(`${API_URL}/favoritos/${usuarioLogueado}`);
        
        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("📦 Respuesta del servidor:", data);

        // ✅ VERIFICACIÓN MEJORADA: Manejo de diferentes formatos de respuesta
        let favoritos = [];
        
        if (Array.isArray(data)) {
            // Si la respuesta es directamente un array
            favoritos = data;
        } else if (data.favoritos && Array.isArray(data.favoritos)) {
            // Si está dentro de un objeto con propiedad favoritos
            favoritos = data.favoritos;
        } else if (data.items && Array.isArray(data.items)) {
            // Posible formato alternativo
            favoritos = data.items;
        } else if (data.data && Array.isArray(data.data)) {
            // Otro formato posible
            favoritos = data.data;
        }

        console.log(`✅ Total de favoritos procesados: ${favoritos.length}`);

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

        favoritos.forEach((item, index) => {
            if (!item) {
                console.warn(`⚠️ Item ${index} es nulo o undefined`);
                return;
            }
            
            console.log(`Procesando favorito ${index + 1}:`, item);
            
            const div = document.createElement("div");
            div.className = "vault-item";

            // ✅ Escapar datos para prevenir XSS
            const safeTitle = (item.title || 'Sin título').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeUsuario = (item.usuario || 'Anónimo').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeImage = item.image || 'https://via.placeholder.com/200x150?text=Sin+Imagen';
            const safeLink = item.link || '#';
            const itemId = item._id || item.id || item.itemId || '';

            if (!itemId) {
                console.error(`❌ Item sin ID válido:`, item);
            }

            div.innerHTML = `
                <img src="${safeImage}" alt="${safeTitle}" onerror="this.src='https://via.placeholder.com/200x150?text=Sin+Imagen'">
                <div class="vault-item-info">
                    <div class="vault-item-title">${safeTitle}</div>
                    <div class="vault-item-user">@${safeUsuario}</div>
                    <div class="vault-item-actions">
                        <button onclick="window.open('${safeLink}', '_blank')" style="
                            background: var(--primary);
                            color: #000;
                            border: none;
                            padding: 8px 15px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-weight: bold;
                            font-size: 0.8rem;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        ">
                            <ion-icon name="cloud-download"></ion-icon> Ver
                        </button>
                        <button class="delete" onclick="eliminarDeBoveda('${itemId}')" style="
                            background: var(--danger);
                            color: white;
                            border: none;
                            padding: 8px 15px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-weight: bold;
                            font-size: 0.8rem;
                            display: flex;
                            align-items: center;
                            gap: 5px;
                        ">
                            <ion-icon name="trash"></ion-icon> Quitar
                        </button>
                    </div>
                </div>
            `;

            fragment.appendChild(div);
        });

        els.vaultContent.appendChild(fragment);
        console.log(`✅ Se renderizaron ${favoritos.length} favoritos correctamente`);

    } catch (e) {
        console.error("❌ Error cargando bóveda:", e);
        els.vaultContent.innerHTML = `
            <p class="error-msg" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                ❌ Error al cargar favoritos<br>
                <small style="color: var(--text-dim); margin-top: 10px; display: block;">
                    ${e.message || 'Error desconocido'}
                </small>
                <button onclick="cargarBoveda()" style="
                    margin-top: 20px;
                    background: var(--primary);
                    color: #000;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 5px;
                    cursor: pointer;
                    font-weight: bold;
                ">
                    🔄 Reintentar
                </button>
            </p>
        `;
    }
}

// Función para eliminar de la bóveda
async function eliminarDeBoveda(itemId) {
    if (!itemId) {
        alert("❌ Error: No se puede identificar el favorito a eliminar.");
        return;
    }
    
    if (!confirm("¿Quitar este archivo de tu bóveda?")) return;

    try {
        console.log(`🗑️ Eliminando favorito con ID: ${itemId}`);
        
        const res = await fetch(`${API_URL}/favoritos/delete/${itemId}`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ usuario: usuarioLogueado })
        });

        if (res.ok) {
            alert("💔 Eliminado de tu bóveda.");
            cargarBoveda(); // Recargar la lista
        } else {
            const errorData = await res.json();
            console.error("Error del servidor:", errorData);
            alert(`❌ Error: ${errorData.message || 'No se pudo eliminar de favoritos'}`);
        }
    } catch (error) {
        console.error("Error eliminando de bóveda:", error);
        alert("❌ Error de conexión.");
    }
}

// Función para cerrar sesión
function cerrarSesion() {
    if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
        localStorage.removeItem("user_admin");
        alert("👋 Sesión cerrada correctamente.");
        window.location.href = "./index.html";
    }
}

// Hacer funciones globales
window.guardarAvatar = guardarAvatar;
window.eliminarDeBoveda = eliminarDeBoveda;
window.cerrarSesion = cerrarSesion;
window.cargarBoveda = cargarBoveda; // ✅ Exportar para poder llamarla manualmente

// ✅ INICIALIZACIÓN MEJORADA
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Inicializando perfil...");
    console.log("Usuario logueado:", usuarioLogueado);
    
    cargarEstadoActual();
    cargarBoveda(); // ← Cargar favoritos
    actualizarPreview();
    mostrarUsuarioVerificado(); // ← Carga el nombre + verificado + avatar + bio al cargar la página
    
    console.log("✅ Perfil inicializado");
});
