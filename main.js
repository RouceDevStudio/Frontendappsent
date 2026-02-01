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
    
    const permitidos = [
    'mediafire.com',
    'mega.nz',
    'drive.google.com',
    'mega.co.nz',
    'gofile.io',
    'onedrive.live.com',
    'icloud.com',
    'proton.me',
    'pcloud.com',
    'pixeldrain.com',
    '1fichier.com',
    'qiwi.gg',
    'krakenfiles.com',
    'dropbox.com'
];

    
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

// ✅ Función para guardar avatar y bio - CORREGIDA CON RUTAS CORRECTAS
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
        let avatarSuccess = false;
        let bioSuccess = false;

        // ✅ Actualizar avatar si se proporcionó
        if (avatarUrl) {
            try {
                const resAvatar = await fetch(`${API_URL}/auth/update-avatar`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        usuario: usuarioLogueado,
                        nuevaFoto: avatarUrl
                    })
                });

                if (resAvatar.ok) {
                    avatarSuccess = true;
                    console.log("✅ Avatar actualizado en el servidor");
                    
                    // Actualizar la vista
                    els.avatarImg.src = avatarUrl;
                    els.avatarImg.style.display = 'block';
                    els.avatarIcon.style.display = 'none';
                } else {
                    const errorData = await resAvatar.json();
                    console.error("Error actualizando avatar:", errorData);
                }
            } catch (error) {
                console.error("Error en petición de avatar:", error);
            }
        }

        // ✅ Actualizar bio si se proporcionó
        if (bio) {
            try {
                const resBio = await fetch(`${API_URL}/auth/update-bio`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ 
                        usuario: usuarioLogueado,
                        bio: bio
                    })
                });

                if (resBio.ok) {
                    bioSuccess = true;
                    console.log("✅ Bio actualizada en el servidor");
                    
                    // Actualizar la vista
                    els.userBio.textContent = bio;
                } else {
                    const errorData = await resBio.json();
                    console.error("Error actualizando bio:", errorData);
                }
            } catch (error) {
                console.error("Error en petición de bio:", error);
            }
        }

        // Cerrar modal
        const modal = document.getElementById('modal-avatar');
        if (modal) modal.style.display = 'none';

        // Mostrar resultado
        if ((avatarUrl && avatarSuccess) || (bio && bioSuccess)) {
            let mensaje = "✅ Perfil actualizado correctamente";
            if (avatarUrl && !avatarSuccess) {
                mensaje += "\n⚠️ No se pudo actualizar el avatar";
            }
            if (bio && !bioSuccess) {
                mensaje += "\n⚠️ No se pudo actualizar la biografía";
            }
            alert(mensaje);
        } else {
            alert("❌ No se pudo actualizar el perfil. Verifica tu conexión.");
        }

    } catch (error) {
        console.error("Error general guardando perfil:", error);
        alert("❌ Error de conexión al actualizar perfil.");
    }
}

// ✅ FUNCIÓN MEJORADA: cargar favoritos (Bóveda) con datos completos y mejor manejo de errores
async function cargarBoveda() {
    if (!els.vaultContent) {
        console.warn("⚠️ Elemento vaultContent no encontrado");
        return;
    }
    
    if (!usuarioLogueado) {
        els.vaultContent.innerHTML = `
            <p class="error-msg" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                ⚠️ Inicia sesión para ver tus favoritos
            </p>
        `;
        return;
    }

    // Mostrar estado de carga
    els.vaultContent.innerHTML = `
        <p style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-dim);">
            <ion-icon name="sync-outline" style="font-size: 2rem; animation: spin 1s linear infinite;"></ion-icon><br>
            Cargando favoritos...
        </p>
    `;

    try {
        console.log(`📂 Cargando favoritos para: ${usuarioLogueado}`);
        const res = await fetch(`${API_URL}/favoritos/${usuarioLogueado}`);
        
        if (!res.ok) {
            throw new Error(`Error HTTP: ${res.status}`);
        }
        
        const data = await res.json();
        console.log("📊 Datos de favoritos recibidos:", data);

        // ✅ El backend ahora devuelve array directo con datos completos
        let favoritos = Array.isArray(data) ? data : [];

        console.log(`✅ Favoritos procesados: ${favoritos.length}`);

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

        // ✅ RENDERIZAR FAVORITOS CON INFORMACIÓN COMPLETA
        els.vaultContent.innerHTML = '';
        const fragment = document.createDocumentFragment();

        favoritos.forEach(item => {
            if (!item) {
                console.warn("⚠️ Item nulo detectado, saltando...");
                return;
            }
            
            const div = document.createElement("div");
            div.className = "vault-item";

            // ✅ Datos con valores por defecto seguros
            const safeTitle = (item.title || 'Sin título').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeUsuario = (item.usuario || 'Anónimo').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeDescription = (item.description || 'Sin descripción').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            const safeImage = item.image || 'https://via.placeholder.com/200x150?text=Sin+Imagen';
            const safeLink = item.link || '#';
            const safeCategory = (item.category || 'General').replace(/</g, '&lt;').replace(/>/g, '&gt;');
            
            // ✅ CRÍTICO: Usar favoritoId para eliminar (ID del documento Favorito)
            const favoritoId = item.favoritoId || item._id;

            div.innerHTML = `
                <div class="vault-item-image">
                    <img src="${safeImage}" alt="${safeTitle}" 
                         onerror="this.src='https://via.placeholder.com/200x150?text=Sin+Imagen'"
                         style="width: 100%; height: 150px; object-fit: cover; border-radius: 8px 8px 0 0;">
                </div>
                <div class="vault-item-info" style="padding: 15px;">
                    <div class="vault-item-header" style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 10px;">
                        <div>
                            <div class="vault-item-title" style="font-weight: bold; color: white; font-size: 0.9rem; margin-bottom: 5px;">
                                ${safeTitle}
                            </div>
                            <div class="vault-item-user" style="color: var(--primary); font-size: 0.75rem;">
                                @${safeUsuario}
                            </div>
                        </div>
                        <span style="font-size: 0.65rem; color: var(--text-dim); padding: 2px 8px; border: 1px solid var(--text-dim); border-radius: 3px;">
                            ${safeCategory}
                        </span>
                    </div>
                    
                    <p style="font-size: 0.75rem; color: var(--text-dim); margin-bottom: 15px; line-height: 1.4;">
                        ${safeDescription.substring(0, 100)}${safeDescription.length > 100 ? '...' : ''}
                    </p>
                    
                    <div class="vault-item-actions" style="display: flex; gap: 10px;">
                        <button onclick="window.open('${safeLink}', '_blank')" style="
                            flex: 1;
                            background: var(--primary);
                            color: #000;
                            border: none;
                            padding: 10px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-weight: bold;
                            font-size: 0.8rem;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 5px;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='#4EDF33'" onmouseout="this.style.background='var(--primary)'">
                            <ion-icon name="cloud-download"></ion-icon> Ver
                        </button>
                        <button onclick="eliminarDeBoveda('${favoritoId}')" style="
                            flex: 1;
                            background: var(--danger);
                            color: white;
                            border: none;
                            padding: 10px;
                            border-radius: 5px;
                            cursor: pointer;
                            font-weight: bold;
                            font-size: 0.8rem;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            gap: 5px;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='#E03030'" onmouseout="this.style.background='var(--danger)'">
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

// ✅ Función para eliminar de la bóveda - MEJORADA
async function eliminarDeBoveda(favoritoId) {
    if (!confirm("¿Quitar este archivo de tu bóveda?")) return;

    try {
        console.log(`🗑️ Eliminando favorito ID: ${favoritoId}`);
        
        const res = await fetch(`${API_URL}/favoritos/delete/${favoritoId}`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json'
            }
        });

        if (res.ok) {
            alert("💔 Eliminado de tu bóveda.");
            cargarBoveda(); // Recargar la lista
        } else {
            const errorData = await res.json();
            console.error("Error del servidor:", errorData);
            alert(`❌ Error: ${errorData.mensaje || errorData.error || 'No se pudo eliminar de favoritos'}`);
        }
    } catch (error) {
        console.error("❌ Error eliminando de bóveda:", error);
        alert("❌ Error de conexión al eliminar favorito.");
    }
}

// Función para cerrar sesión
function cerrarSesion() {
    if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
        localStorage.removeItem("user_admin");
        localStorage.removeItem("token"); // ⬅️ NUEVA
        localStorage.removeItem("RefreshToken"); // ⬅️ NUEVA
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
