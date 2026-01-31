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
        }

        // Mostrar avatar si existe
        if (usuarioData.avatar && usuarioData.avatar.trim() !== '') {
            els.avatarImg.src = usuarioData.avatar;
            els.avatarImg.style.display = 'block';
            els.avatarIcon.style.display = 'none';
            
            // Pre-llenar modal con datos actuales
            if (els.inputAvatarUrl) els.inputAvatarUrl.value = usuarioData.avatar;
            if (els.previewAvatar) els.previewAvatar.src = usuarioData.avatar;
        }

        // Mostrar bio si existe
        if (usuarioData.bio && usuarioData.bio.trim() !== '') {
            els.userBio.textContent = usuarioData.bio;
            if (els.inputBio) els.inputBio.value = usuarioData.bio;
        }

    } catch (e) {
        console.error("Error cargando datos del usuario", e);
    }
}

// ==========================================
// 2. CARGAR HISTORIAL (OPTIMIZADO - ORIGINAL)
// ==========================================
async function cargarEstadoActual() {
    if (!els.showContent) return;
    if (!usuarioLogueado) {
        els.showContent.innerHTML = `<p class="error-msg">⚠️ INICIA SESIÓN</p>`;
        return;
    }
    
    try {
        const res = await fetch(`${API_URL}/items`);
        const data = await res.json();
        const listaBruta = Array.isArray(data) ? data : [];
        const misAportes = listaBruta.filter(item => item.usuario === usuarioLogueado);
        
        if (misAportes.length === 0) {
            els.showContent.innerHTML = "<p class='empty-msg'>Aún no tienes archivos.</p>";
            return;
        }
        
        const fragment = document.createDocumentFragment();
        misAportes.reverse().forEach(item => {
            const div = document.createElement("div");
            div.className = "log-item";
            const colorStatus = item.status === 'aprobado' ? '#5EFF43' : '#ffcc00';
            
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                    <div>
                        <div style="color:white; font-size:12px; font-weight:bold;">${item.title || 'Sin nombre'}</div>
                        <div style="margin-top:4px;">
                            <span style="font-size:8px; color:${colorStatus}; border:1px solid ${colorStatus}; padding:1px 5px; border-radius:3px; text-transform:uppercase;">
                                ${item.status || 'pendiente'}
                            </span>
                        </div>
                    </div>
                    <button onclick="eliminarArchivo('${item._id}')" class="btn-delete-log">
                        <ion-icon name="trash-outline"></ion-icon>
                    </button>
                </div>
            `;
            fragment.appendChild(div);
        });
        
        els.showContent.innerHTML = "";
        els.showContent.appendChild(fragment);
    } catch (e) {
        console.error("Error sincronizando historial", e);
        if (els.showContent) {
            els.showContent.innerHTML = `<p class="error-msg">❌ Error al cargar historial</p>`;
        }
    }
}

// ==========================================
// 3. FUNCIÓN ELIMINAR (CORREGIDA - ERROR DE SINTAXIS ARREGLADO)
// ==========================================
async function eliminarArchivo(id) {
    if (!confirm("¿Eliminar este archivo de la nube?")) return;
    
    try {
        // ✅ OBTENER TOKEN
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert("⚠️ Sesión expirada. Por favor inicia sesión nuevamente.");
            window.location.href = './index.html';
            return;
        }
        
        const res = await fetch(`${API_URL}/items/${id}`, { 
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}` // ✅ ENVIAR TOKEN
            }
        });
        
        if (res.ok) {
            alert("✅ Archivo eliminado correctamente.");
            cargarEstadoActual();
        } else {
            const errorData = await res.json();
            alert(`❌ Error: ${errorData.mensaje || errorData.error || 'Error al eliminar'}`);
        }
    } catch (error) {
        console.error("Error al eliminar:", error);
        alert("❌ Error de conexión al eliminar.");
    }
}

// ==========================================
// 4. FUNCIÓN PUBLICAR (CON FILTRO DE SEGURIDAD Y ENLACES)
// ==========================================
async function subirJuego() {
    if (!usuarioLogueado) return alert("Debes iniciar sesión.");
    
    const tituloFormateado = els.addTitle.value.trim();
    const descripcionFormateada = els.addDescription.value.trim();
    const linkDescarga = els.addLink.value.trim();
    
    // 🛡️ VALIDACIÓN DE ENLACE ANTES DE SUBIR
    const verificacionLink = analizarEnlaceSeguro(linkDescarga);
    if (verificacionLink.ok === false) {
        return alert(verificacionLink.msg);
    }
    
    if (!tituloFormateado || !linkDescarga) {
        return alert("⚠️ Completa al menos Título y Enlace.");
    }
    
    const body = {
        title: tituloFormateado,
        description: descripcionFormateada,
        link: linkDescarga,
        image: els.addImage.value.trim(),
        category: els.addCategory.value,
        usuario: usuarioLogueado,
        status: "pendiente"
    };
    
    try {
        // ✅ OBTENER TOKEN DE LOCALSTORAGE
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert("⚠️ Sesión expirada. Por favor inicia sesión nuevamente.");
            window.location.href = './index.html';
            return;
        }
        
        console.log("📤 Enviando publicación con token...");
        
        const res = await fetch(`${API_URL}/items/add`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // ✅ ENVIAR TOKEN
            },
            body: JSON.stringify(body)
        });
        
        console.log(`📥 Respuesta: ${res.status} ${res.statusText}`);
        
        if (res.ok) {
            alert("✅ Archivo publicado. Esperando aprobación.");
            els.addTitle.value = "";
            els.addDescription.value = "";
            els.addLink.value = "";
            els.addImage.value = "";
            actualizarPreview();
            cargarEstadoActual();
        } else {
            const errorData = await res.json();
            console.error("Error del servidor:", errorData);
            alert(`❌ Error: ${errorData.error || errorData.message || 'No se pudo publicar'}`);
        }
    } catch (error) {
        console.error("Error subiendo archivo:", error);
        alert("❌ Error de conexión. Verifica tu internet e intenta de nuevo.");
    }
}

// Inicialización
if (els.subirBack) els.subirBack.onclick = subirJuego;
window.eliminarArchivo = eliminarArchivo;

// ==========================================
// NUEVAS FUNCIONES: AVATAR, BÓVEDA Y CERRAR SESIÓN
// ==========================================

// Preview del avatar en tiempo real
if (els.inputAvatarUrl) {
    els.inputAvatarUrl.oninput = () => {
        const url = els.inputAvatarUrl.value.trim();
        if (url && els.previewAvatar) {
            els.previewAvatar.src = url;
        }
    };
}

// Función para guardar avatar y bio
async function guardarAvatar() {
    const avatarUrl = els.inputAvatarUrl.value.trim();
    const bio = els.inputBio.value.trim();

    if (!avatarUrl && !bio) {
        return alert("Ingresa al menos la URL del avatar o una biografía.");
    }

    // Validar que la URL sea válida
    if (avatarUrl) {
        try {
            new URL(avatarUrl);
        } catch (e) {
            return alert("❌ La URL del avatar no es válida.");
        }
    }

    try {
        const res = await fetch(`${API_URL}/auth/profile`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                usuario: usuarioLogueado,
                avatar: avatarUrl,
                bio: bio
            })
        });

        if (res.ok) {
            // Actualizar la vista
            if (avatarUrl) {
                els.avatarImg.src = avatarUrl;
                els.avatarImg.style.display = 'block';
                els.avatarIcon.style.display = 'none';
            }
            if (bio) {
                els.userBio.textContent = bio;
            }

            document.getElementById('modal-avatar').style.display = 'none';
            alert("✅ Perfil actualizado correctamente.");
            
        } else {
            console.warn("Endpoint /auth/profile no disponible, guardando localmente");
            
            if (avatarUrl) {
                els.avatarImg.src = avatarUrl;
                els.avatarImg.style.display = 'block';
                els.avatarIcon.style.display = 'none';
                localStorage.setItem(`avatar_${usuarioLogueado}`, avatarUrl);
            }
            if (bio) {
                els.userBio.textContent = bio;
                localStorage.setItem(`bio_${usuarioLogueado}`, bio);
            }

            document.getElementById('modal-avatar').style.display = 'none';
            alert("✅ Perfil actualizado localmente.\n\n⚠️ Nota: Para que se guarde en el servidor, contacta al administrador para activar el endpoint /auth/profile");
        }

    } catch (error) {
        console.error("Error guardando avatar:", error);
        alert("❌ Error de conexión. Guardando localmente...");
        
        if (avatarUrl) {
            els.avatarImg.src = avatarUrl;
            els.avatarImg.style.display = 'block';
            els.avatarIcon.style.display = 'none';
            localStorage.setItem(`avatar_${usuarioLogueado}`, avatarUrl);
        }
        if (bio) {
            els.userBio.textContent = bio;
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
        console.log(`Cargando favoritos para: ${usuarioLogueado}`);
        const res = await fetch(`${API_URL}/favoritos/${usuarioLogueado}`);
        
        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("Datos de favoritos recibidos:", data);

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
        }

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

        favoritos.forEach(item => {
            if (!item) return; // Saltar items nulos
            
            const div = document.createElement("div");
            div.className = "vault-item";

            // ✅ Escapar datos para prevenir XSS
            const safeTitle = (item.title || 'Sin título').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeUsuario = (item.usuario || 'Anónimo').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeImage = item.image || 'https://via.placeholder.com/200x150?text=Sin+Imagen';
            const safeLink = item.link || '#';
            const itemId = item._id || item.id || '';

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
        console.log(`✅ Se cargaron ${favoritos.length} favoritos correctamente`);

    } catch (e) {
        console.error("Error cargando bóveda:", e);
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
    if (!confirm("¿Quitar este archivo de tu bóveda?")) return;

    try {
        // ✅ OBTENER TOKEN
        const token = localStorage.getItem('token');
        
        if (!token) {
            alert("⚠️ Sesión expirada. Por favor inicia sesión nuevamente.");
            window.location.href = './index.html';
            return;
        }
        
        const res = await fetch(`${API_URL}/favoritos/delete/${itemId}`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // ✅ ENVIAR TOKEN
            },
            body: JSON.stringify({ usuario: usuarioLogueado })
        });

        if (res.ok) {
            alert("💔 Eliminado de tu bóveda.");
            cargarBoveda(); // Recargar la lista
        } else {
            const errorData = await res.json();
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
        // ✅ ELIMINAR TODOS LOS DATOS DE SESIÓN
        localStorage.removeItem("user_admin");
        localStorage.removeItem("token");
        localStorage.removeItem("user_avatar");
        localStorage.removeItem("user_verified");
        localStorage.removeItem("user_rol");
        
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
