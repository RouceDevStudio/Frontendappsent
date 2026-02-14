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
    'dropbox.com',
    'github.com'
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
        const res = await fetch(`${API_URL}/items/usuario/${usuarioLogueado}`)
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
        
        // Actualizar estadísticas después de cargar el historial
        cargarEstadisticasPerfil();
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
            cargarEstadisticasPerfil(); // Actualizar estadísticas después de eliminar
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
// 4. FUNCIÓN PUBLICAR (CON FILTRO DE SEGURIDAD, ENLACES Y ANTI-SPAM)
// ==========================================

// Sistema anti-spam: guardar timestamp de última publicación
const LIMITE_TIEMPO_PUBLICACION = 30000; // 30 segundos en milisegundos

async function subirJuego() {
    if (!usuarioLogueado) return alert("Debes iniciar sesión.");
    
    // ✅ SISTEMA ANTI-SPAM: Verificar tiempo desde última publicación
    const ahora = Date.now();
    const ultimaPublicacion = localStorage.getItem('ultima_publicacion');
    
    if (ultimaPublicacion) {
        const tiempoTranscurrido = ahora - parseInt(ultimaPublicacion);
        const tiempoRestante = LIMITE_TIEMPO_PUBLICACION - tiempoTranscurrido;
        
        if (tiempoTranscurrido < LIMITE_TIEMPO_PUBLICACION) {
            const segundosRestantes = Math.ceil(tiempoRestante / 1000);
            return alert(`⏱️ Anti-spam activado: Espera ${segundosRestantes} segundos antes de publicar nuevamente.`);
        }
    }
    
    const tituloFormateado = els.addTitle.value.trim();
    const descripcionFormateada = els.addDescription.value.trim();
    const linkDescarga = els.addLink.value.trim();
    
    // 🛡️ BOT DE KEYWORDS: VALIDACIÓN ANTI-PIRATERÍA
    const bannedKeywords = [
        'crack', 'cracked', 'crackeado', 'crackeo',
        'pirata', 'pirateado', 'piratear',
        'gratis', 'free', 'gratuito',
        'full', 'completo', 'complete',
        'premium gratis', 'pro gratis',
        'descargar gratis', 'download free'
    ];
    
    const tituloLower = tituloFormateado.toLowerCase();
    const palabraDetectada = bannedKeywords.find(keyword => {
        const regex = new RegExp('\\b' + keyword + '\\b', 'i');
        return regex.test(tituloLower);
    });
    
    if (palabraDetectada) {
        return alert(`🚫 BOT DE METADATA: Palabra prohibida detectada: "${palabraDetectada}"\n\n⚠️ No se permite usar términos que inciten a la piratería.\n\nUsa un título descriptivo y profesional.`);
    }
    
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
            // ✅ GUARDAR TIMESTAMP DE PUBLICACIÓN EXITOSA
            localStorage.setItem('ultima_publicacion', Date.now().toString());
            
            alert("✅ Archivo publicado. Esperando aprobación.");
            els.addTitle.value = "";
            els.addDescription.value = "";
            els.addLink.value = "";
            els.addImage.value = "";
            actualizarPreview();
            cargarEstadoActual();
            
            // Actualizar contador de publicaciones
            cargarEstadisticasPerfil();
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
            
            // ✅ CRÍTICO: Usar el _id del item para eliminar (no el favoritoId)
            const itemId = item._id;
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
                        <button onclick="window.open('puente.html?id=${itemId}', '_blank')" style="
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
                            <ion-icon name="cloud-download"></ion-icon> Acceder
                        </button>
                        <button onclick="eliminarDeBoveda('${itemId}')" style="
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
async function eliminarDeBoveda(itemId) {
    if (!confirm("¿Quitar este archivo de tu bóveda?")) return;

    try {
        console.log(`🗑️ Eliminando favorito - Usuario: ${usuarioLogueado}, ItemID: ${itemId}`);
        
        const res = await fetch(`${API_URL}/favoritos/remove`, {
            method: 'DELETE',
            headers: { 
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario: usuarioLogueado,
                itemId: itemId
            })
        });

        const data = await res.json();

        if (data.success || data.ok) {
            alert("💔 Eliminado de tu bóveda.");
            cargarBoveda(); // Recargar la lista
        } else {
            console.error("Error del servidor:", data);
            alert(`❌ Error: ${data.error || 'No se pudo eliminar de favoritos'}`);
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

// ==========================================
// FUNCIÓN PARA CARGAR ESTADÍSTICAS DEL PERFIL
// ==========================================
async function cargarEstadisticasPerfil() {
    if (!usuarioLogueado) {
        console.warn("⚠️ No hay usuario logueado para cargar estadísticas");
        return;
    }
    
    console.log("📊 Cargando estadísticas para:", usuarioLogueado);
    
    try {
        // Cargar estadísticas de seguimiento (seguidores y siguiendo)
        console.log("🔍 Buscando stats en:", `${API_URL}/usuarios/stats-seguimiento/${usuarioLogueado}`);
        
        const statsRes = await fetch(`${API_URL}/usuarios/stats-seguimiento/${usuarioLogueado}`);
        console.log("📥 Respuesta stats:", statsRes.status, statsRes.statusText);
        
        if (statsRes.ok) {
            const statsData = await statsRes.json();
            console.log("✅ Datos de stats recibidos:", statsData);
            
            if (statsData && statsData.stats) {
                const seguidores = statsData.stats.seguidores || 0;
                const siguiendo = statsData.stats.siguiendo || 0;
                
                console.log(`👥 Seguidores: ${seguidores}, Siguiendo: ${siguiendo}`);
                
                document.getElementById('stat-followers').textContent = seguidores;
                document.getElementById('stat-following').textContent = siguiendo;
            } else {
                console.warn("⚠️ No se encontró statsData.stats en la respuesta");
                // Intentar cargar desde el objeto de usuario directamente
                await cargarEstadisticasAlternativo();
            }
        } else {
            console.error("❌ Error en respuesta stats:", statsRes.status);
            // Intentar método alternativo
            await cargarEstadisticasAlternativo();
        }
        
        // Cargar número de publicaciones aprobadas usando endpoint específico del usuario
        const itemsRes = await fetch(`${API_URL}/items/user/${usuarioLogueado}`);
        if (itemsRes.ok) {
            const itemsData = await itemsRes.json();
            const allItems = Array.isArray(itemsData) ? itemsData : [];
            
            // Contar solo publicaciones aprobadas del usuario
            const publicacionesUsuario = allItems.filter(item => 
                item.status === 'aprobado'
            );
            
            console.log(`📦 Publicaciones aprobadas: ${publicacionesUsuario.length} de ${allItems.length} totales`);
            document.getElementById('stat-uploads').textContent = publicacionesUsuario.length;
        }
        
    } catch (error) {
        console.error("❌ Error cargando estadísticas:", error);
        // Intentar método alternativo
        await cargarEstadisticasAlternativo();
    }
}

// ==========================================
// MÉT ALTERNATIVO PARA CARGAR ESTADÍSTICAS
// ==========================================
async function cargarEstadisticasAlternativo() {
    console.log("🔄 Intentando método alternativo para estadísticas...");
    
    try {
        // Intentar obtener datos del usuario directamente
        const userRes = await fetch(`${API_URL}/auth/users`);
        if (userRes.ok) {
            const users = await userRes.json();
            const usuario = users.find(u => u.usuario === usuarioLogueado);
            
            if (usuario) {
                console.log("✅ Usuario encontrado:", usuario);
                
                // ✅ CORREGIDO: El backend usa 'listaSeguidores' en lugar de 'seguidores'
                const seguidores = usuario.listaSeguidores ? usuario.listaSeguidores.length : 
                                 (usuario.seguidores ? usuario.seguidores.length : 0);
                const siguiendo = usuario.siguiendo ? usuario.siguiendo.length : 0;
                
                console.log(`👥 (Alt) Seguidores: ${seguidores}, Siguiendo: ${siguiendo}`);
                
                document.getElementById('stat-followers').textContent = seguidores;
                document.getElementById('stat-following').textContent = siguiendo;
            } else {
                console.error("❌ Usuario no encontrado en la lista");
            }
        }
    } catch (error) {
        console.error("❌ Error en método alternativo:", error);
    }
}





// ==========================================
// FUNCIONES ADICIONALES PARA MAIN.JS
// Agregar estas funciones al final del archivo main.js existente
// ==========================================

// ========== VARIABLES GLOBALES PARA EDICIÓN ========== //
let currentEditItemId = null;

// ========== CARGAR HISTORIAL MEJORADO CON EDICIÓN ========== //
async function cargarEstadoActual() {
    const container = document.getElementById("showContent");
    if (!container) return;
    if (!usuarioLogueado) {
        container.innerHTML = `
            <div class="empty-state">
                <ion-icon name="alert-circle"></ion-icon>
                <h3>Sesión requerida</h3>
                <p>Inicia sesión para ver tus publicaciones</p>
            </div>`;
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_URL}/items/user/${usuarioLogueado}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await res.json();
        const misAportes = Array.isArray(data) ? data : [];
        
        if (misAportes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <ion-icon name="cloud-offline"></ion-icon>
                    <h3>Sin publicaciones</h3>
                    <p>Aún no has publicado nada. ¡Empieza ahora!</p>
                </div>`;
            return;
        }
        
        // Renderizar con opciones de editar/eliminar Y estadísticas
        container.innerHTML = "";
        misAportes.reverse().forEach(item => {
            const isPending = item.status === 'pendiente' || item.status === 'pending';
            const statusClass = isPending ? 'status-pending' : 'status-approved';
            const statusText = isPending ? 'Pendiente' : 'Aprobado';
            const statusIcon = isPending ? 'time' : 'checkmark-circle';
            
            // ⭐ AGREGAR ESTADÍSTICAS DE DESCARGAS
            const descargas = item.descargasEfectivas || 0;
            const linkStatus = item.linkStatus || 'online';
            const linkStatusText = linkStatus === 'online' ? '🟢 Online' : 
                                   linkStatus === 'revision' ? '🟡 En Revisión' : 
                                   '🔴 Caído';

            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <div class="item-status ${statusClass}">
                    <ion-icon name="${statusIcon}"></ion-icon>
                    ${statusText}
                </div>
                <img src="${item.image || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}" 
                     alt="${item.title}"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
                <div class="item-info">
                    <h4 class="item-title">${item.title || 'Sin título'}</h4>
                    <p class="item-category">${item.category || 'General'}</p>
                    
                    <!-- ⭐ ESTADÍSTICAS DE LA PUBLICACIÓN -->
                    <div style="display: flex; gap: 15px; margin: 10px 0; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 8px;">
                        <div style="flex: 1; text-align: center;">
                            <div style="font-size: 1.2rem; font-weight: bold; color: #5EFF43;">${descargas}</div>
                            <div style="font-size: 0.65rem; color: #888;">DESCARGAS</div>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="font-size: 0.75rem; font-weight: bold;">${linkStatusText}</div>
                            <div style="font-size: 0.65rem; color: #888;">ESTADO LINK</div>
                        </div>
                        <div style="flex: 1; text-align: center;">
                            <div style="font-size: 0.75rem; font-weight: bold; color: ${item.reportes >= 3 ? '#ff4444' : '#888'};">${item.reportes || 0}</div>
                            <div style="font-size: 0.65rem; color: #888;">REPORTES</div>
                        </div>
                    </div>
                    
                    <div class="item-actions">
                        <button class="btn-action btn-edit" onclick="openEditModal('${item._id}')">
                            <ion-icon name="create"></ion-icon>
                            Editar
                        </button>
                        <button class="btn-action btn-delete" onclick="eliminarArchivo('${item._id}')">
                            <ion-icon name="trash"></ion-icon>
                            Eliminar
                        </button>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error("Error cargando historial:", e);
        container.innerHTML = `
            <div class="empty-state">
                <ion-icon name="warning"></ion-icon>
                <h3>Error de conexión</h3>
                <p>No se pudo cargar el historial</p>
            </div>`;
    }
}

// ========== ABRIR MODAL DE EDICIÓN ========== //
async function openEditModal(itemId) {
    currentEditItemId = itemId;
    
    try {
        const token = localStorage.getItem('token');
        
        // Buscar el item en los datos del usuario
        const res = await fetch(`${API_URL}/items/user/${usuarioLogueado}`, {
            headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        
        if (!res.ok) {
            throw new Error('Error al cargar datos');
        }
        
        const data = await res.json();
        const item = data.find(i => i._id === itemId);
        
        if (!item) {
            showToast('❌ Item no encontrado');
            return;
        }

        // Llenar el formulario
        document.getElementById('edit-id').value = item._id;
        document.getElementById('edit-title').value = item.title || '';
        document.getElementById('edit-description').value = item.description || '';
        document.getElementById('edit-link').value = item.link || '';
        document.getElementById('edit-image').value = item.image || '';
        document.getElementById('edit-category').value = item.category || 'Juego';

        // Abrir modal
        document.getElementById('editModal').classList.add('active');
    } catch (e) {
        console.error('Error al cargar item:', e);
        showToast('❌ Error al cargar datos');
    }
}

// ========== CERRAR MODAL DE EDICIÓN ========== //
function closeEditModal() {
    document.getElementById('editModal').classList.remove('active');
    currentEditItemId = null;
}

// ========== GUARDAR EDICIÓN ========== //
document.getElementById('editForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!currentEditItemId) {
        showToast('❌ Error: ID no encontrado');
        return;
    }

    const updates = {
        title: document.getElementById('edit-title').value.trim(),
        description: document.getElementById('edit-description').value.trim(),
        link: document.getElementById('edit-link').value.trim(),
        image: document.getElementById('edit-image').value.trim(),
        category: document.getElementById('edit-category').value
    };

    // Validar enlace
    const verificacionLink = analizarEnlaceSeguro(updates.link);
    if (verificacionLink.ok === false) {
        showToast(verificacionLink.msg);
        return;
    }

    if (!updates.title || !updates.link) {
        showToast('⚠️ Título y enlace son obligatorios');
        return;
    }

    // Validar keywords prohibidas
    const bannedKeywords = [
        'crack', 'cracked', 'crackeado', 'crackeo',
        'pirata', 'pirateado', 'piratear',
        'gratis', 'free', 'gratuito',
        'full', 'completo', 'complete',
        'premium gratis', 'pro gratis',
        'descargar gratis', 'download free'
    ];
    
    const tituloLower = updates.title.toLowerCase();
    const palabraDetectada = bannedKeywords.find(keyword => {
        const regex = new RegExp('\\b' + keyword + '\\b', 'i');
        return regex.test(tituloLower);
    });
    
    if (palabraDetectada) {
        showToast(`🚫 Palabra prohibida: "${palabraDetectada}"`);
        return;
    }

    try {
        const token = localStorage.getItem('token');
        
        if (!token) {
            showToast("⚠️ Sesión expirada");
            window.location.href = './index.html';
            return;
        }
        
        const response = await fetch(`${API_URL}/admin/items/${currentEditItemId}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(updates)
        });

        if (response.ok) {
            showToast('✅ Publicación actualizada');
            closeEditModal();
            cargarEstadoActual();
        } else {
            const error = await response.json();
            showToast('❌ Error: ' + (error.error || 'No se pudo actualizar'));
        }
    } catch (e) {
        console.error('Error al actualizar:', e);
        showToast('❌ Error de conexión');
    }
});

// ========== CARGAR BÓVEDA (FAVORITOS) - FUNCIÓN DUPLICADA COMENTADA ========== //
// La función correcta está en la línea 483
/*
async function cargarBoveda() {
    const container = document.getElementById("vaultContent");
    if (!container) return;
    if (!usuarioLogueado) {
        container.innerHTML = `
            <div class="empty-state">
                <ion-icon name="alert-circle"></ion-icon>
                <h3>Sesión requerida</h3>
                <p>Inicia sesión para ver tus favoritos</p>
            </div>`;
        return;
    }

    try {
        const res = await fetch(`${API_URL}/favoritos/${usuarioLogueado}`);
        const favoritos = await res.json();

        if (!Array.isArray(favoritos) || favoritos.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <ion-icon name="heart-dislike"></ion-icon>
                    <h3>Sin favoritos</h3>
                    <p>Aún no has guardado nada en tu bóveda</p>
                </div>`;
            return;
        }

        container.innerHTML = "";
        favoritos.forEach(item => {
            const card = document.createElement('div');
            card.className = 'item-card';
            card.innerHTML = `
                <img src="${item.image || 'https://via.placeholder.com/300x200?text=Sin+Imagen'}" 
                     alt="${item.title}"
                     onerror="this.src='https://via.placeholder.com/300x200?text=Sin+Imagen'">
                <div class="item-info">
                    <h4 class="item-title">${item.title || 'Sin título'}</h4>
                    <p class="item-category">@${item.usuario || 'Anónimo'}</p>
                    <div class="item-actions">
                        <a href="${item.link}" target="_blank" class="btn-action" style="text-decoration:none;">
                            <ion-icon name="download"></ion-icon>
                            Descargar
                        </a>
                    </div>
                </div>
            `;
            container.appendChild(card);
        });
    } catch (e) {
        console.error("Error cargando bóveda:", e);
        container.innerHTML = `
            <div class="empty-state">
                <ion-icon name="warning"></ion-icon>
                <h3>Error de conexión</h3>
                <p>No se pudo cargar la bóveda</p>
            </div>`;
    }
}
*/


// ========== ACTUALIZAR PREVIEW ========== //
function actualizarPreview() {
    const prevTitle = document.getElementById('prev-title');
    const prevTag = document.getElementById('prev-tag');
    const prevImg = document.getElementById('prev-img');
    const prevDesc = document.getElementById('prev-desc');
    const addTitle = document.getElementById('addTitle');
    const addCategory = document.getElementById('addCategory');
    const addImage = document.getElementById('addImage');
    const addDescription = document.getElementById('addDescription');
    const addLink = document.getElementById('addLink');

    if (prevTitle && addTitle) {
        prevTitle.textContent = addTitle.value || "Título de la publicación";
    }
    if (prevTag && addCategory) {
        prevTag.textContent = (addCategory.value || "CATEGORÍA").toUpperCase();
    }
    if (prevImg && addImage) {
        prevImg.src = addImage.value || "https://via.placeholder.com/300x200?text=Vista+Previa";
    }
    if (prevDesc && addDescription) {
        prevDesc.textContent = addDescription.value || "Descripción de la publicación...";
    }

    // Validación visual del link
    if (addLink && addLink.value.trim() !== "") {
        const res = analizarEnlaceSeguro(addLink.value.trim());
        addLink.style.borderColor = res.ok ? "#5EFF43" : "#ff4444";
    } else if (addLink) {
        addLink.style.borderColor = "";
    }
}

// ========== GUARDAR AVATAR ========== //
async function saveAvatar() {
    const avatarUrl = document.getElementById('input-avatar-url').value.trim();
    
    if (!avatarUrl) {
        showToast('⚠️ Ingresa una URL de avatar');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/usuarios/update-avatar`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario: usuarioLogueado,
                avatarUrl: avatarUrl
            })
        });

        if (res.ok) {
            showToast('✅ Avatar actualizado');
            // Actualizar vista
            const avatarImg = document.getElementById('avatar-img');
            if (avatarImg) {
                avatarImg.src = avatarUrl;
                avatarImg.style.display = 'block';
                document.querySelector('.avatar-icon').style.display = 'none';
            }
            closeSettingsModal();
        } else {
            showToast('❌ Error al actualizar avatar');
        }
    } catch (e) {
        console.error('Error:', e);
        showToast('❌ Error de conexión');
    }
}

// ========== GUARDAR BIO ========== //
async function saveBio() {
    const bio = document.getElementById('input-bio').value.trim();
    
    if (!bio) {
        showToast('⚠️ La bio no puede estar vacía');
        return;
    }

    try {
        const res = await fetch(`${API_URL}/usuarios/update-bio`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                usuario: usuarioLogueado,
                bio: bio
            })
        });

        if (res.ok) {
            showToast('✅ Bio actualizada');
            // Actualizar vista
            const userBio = document.getElementById('user-bio');
            if (userBio) {
                userBio.textContent = bio;
            }
            closeSettingsModal();
        } else {
            showToast('❌ Error al actualizar bio');
        }
    } catch (e) {
        console.error('Error:', e);
        showToast('❌ Error de conexión');
    }
}

// ========== TOAST NOTIFICATION ========== //
function showToast(message) {
    const toast = document.getElementById('toast');
    if (!toast) return;
    
    toast.textContent = message;
    toast.style.display = 'block';
    setTimeout(() => {
        toast.style.display = 'none';
    }, 2500);
}

// ========== EXPONER FUNCIONES GLOBALES ========== //
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.cargarBoveda = cargarBoveda;
window.saveAvatar = saveAvatar;
window.saveBio = saveBio;
window.showToast = showToast;

// ========== ESCUCHADORES DE EVENTOS ========== //
// Bot de Keywords - Validación en tiempo real
const bannedKeywordsVisual = [
    'crack', 'cracked', 'crackeado', 'crackeo',
    'pirata', 'pirateado', 'piratear',
    'gratis', 'free', 'gratuito',
    'full', 'completo', 'complete',
    'premium', 'pro',
    'descargar', 'download'
];

function validarTituloEnTiempoReal() {
    const titleInput = document.getElementById('addTitle');
    if (!titleInput) return;
    
    const texto = titleInput.value.toLowerCase();
    const tienePalabraProhibida = bannedKeywordsVisual.some(keyword => {
        const regex = new RegExp('\\b' + keyword + '\\b', 'i');
        return regex.test(texto);
    });
    
    if (tienePalabraProhibida && texto.length > 0) {
        titleInput.style.borderColor = '#ff4444';
        titleInput.style.boxShadow = '0 0 0 2px rgba(255, 68, 68, 0.2)';
    } else {
        titleInput.style.borderColor = '';
        titleInput.style.boxShadow = '';
    }
}

// Preview en tiempo real
['addTitle', 'addCategory', 'addImage', 'addDescription', 'addLink'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('input', actualizarPreview);
        // Validar keywords solo en el título
        if (id === 'addTitle') {
            el.addEventListener('input', validarTituloEnTiempoReal);
        }
    }
});

// Inicialización



// Hacer funciones globales
window.guardarAvatar = guardarAvatar;
window.eliminarDeBoveda = eliminarDeBoveda;
window.cerrarSesion = cerrarSesion;
window.cargarBoveda = cargarBoveda; // ✅ Exportar para poder llamarla manualmente
window.cargarEstadisticasPerfil = cargarEstadisticasPerfil; // ✅ Exportar función de estadísticas




// ✅ INICIALIZACIÓN MEJORADA
document.addEventListener("DOMContentLoaded", () => {
    console.log("🚀 Inicializando perfil...");
    console.log("Usuario logueado:", usuarioLogueado);
    
    cargarEstadoActual();
    cargarBoveda(); // ← Cargar favoritos
    actualizarPreview();
    mostrarUsuarioVerificado(); // ← Carga el nombre + verificado + avatar + bio al cargar la página
    cargarEstadisticasPerfil(); // ← Cargar estadísticas del perfil
    
    console.log("✅ Perfil inicializado");
});
