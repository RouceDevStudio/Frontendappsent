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
    els.prevTitle.textContent = els.addTitle.value || "Título del Proyecto";
    els.prevTag.textContent = (els.addCategory.value || "Categoría").toUpperCase();
    els.prevImg.src = els.addImage.value || "https://via.placeholder.com/300x150?text=Esperando+Imagen";
    
    // Validación visual del link en tiempo real (Borde dinámico)
    if (els.addLink.value.trim() !== "") {
        const res = analizarEnlaceSeguro(els.addLink.value.trim());
        els.addLink.style.borderColor = res.ok ? "#5EFF43" : "#ff4444";
    } else {
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
        console.error("Error sincronizando historial");
    }
}

// ==========================================
// 3. FUNCIÓN ELIMINAR (CORREGIDA - ERROR DE SINTAXIS ARREGLADO)
// ==========================================
async function eliminarArchivo(id) {
    if (!confirm("¿Eliminar este archivo de la nube?")) return;
    try {
        // ✅ CORREGIDO: Sintaxis de template string arreglada
        const res = await fetch(`${API_URL}/items/${id}`, { method: 'DELETE' });
        if (res.ok) cargarEstadoActual();
    } catch (error) {
        alert("Error de conexión al eliminar.");
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
    
    // FILTRO DE PALABRAS PROHIBIDAS
    const prohibidas = ["crack", "full", "gratis", "pirata", "free"];
    const contieneProhibida = prohibidas.some(palabra =>
        tituloFormateado.toLowerCase().includes(palabra) ||
        descripcionFormateada.toLowerCase().includes(palabra)
    );
    
    if (contieneProhibida) {
        return alert("❌ ERROR DE LINEAMIENTOS: No uses palabras como Crack, Full o Gratis. Usa términos técnicos como Mod, Port o Archive.");
    }
    
    const datos = {
        title: tituloFormateado,
        description: descripcionFormateada,
        link: linkDescarga,
        image: els.addImage.value.trim(),
        category: els.addCategory.value,
        categoria: els.addCategory.value,
        usuario: usuarioLogueado.trim(),
        status: "pendiente"
    };
    
    if (!datos.title || !datos.link || !datos.image) {
        return alert("Completa Título, Link e Imagen.");
    }
    
    els.subirBack.disabled = true;
    els.subirBack.innerHTML = "⏳ VALIDANDO...";
    
    try {
        const response = await fetch(`${API_URL}/items/add`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(datos)
        });
        
        if (response.ok) {
            alert("✅ Aporte enviado. Será revisado según los términos de metadatos.");
            [els.addTitle, els.addDescription, els.addLink, els.addImage].forEach(el => el.value = "");
            actualizarPreview();
            cargarEstadoActual();
        } else {
            alert("Error al subir.");
        }
    } catch (error) {
        alert("Error de conexión.");
    } finally {
        els.subirBack.disabled = false;
        els.subirBack.innerHTML = `<ion-icon name="rocket-outline"></ion-icon> PUBLICAR EN LA NUBE`;
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
        // Como no hay endpoint específico, vamos a usar el endpoint de actualización de usuario
        // Si tu backend no tiene este endpoint, necesitarás agregarlo
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
            // Si el endpoint no existe, guardamos localmente y mostramos advertencia
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
        
        // Guardar localmente como fallback
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

// Función para cargar favoritos (Bóveda)
async function cargarBoveda() {
    if (!els.vaultContent) return;
    if (!usuarioLogueado) {
        els.vaultContent.innerHTML = `<p class="error-msg">⚠️ INICIA SESIÓN</p>`;
        return;
    }

    try {
        const res = await fetch(`${API_URL}/favoritos/${usuarioLogueado}`);
        const data = await res.json();

        if (!data.favoritos || data.favoritos.length === 0) {
            els.vaultContent.innerHTML = `
                <p class="empty-msg" style="grid-column: 1/-1; text-align: center; padding: 40px;">
                    💔 Tu bóveda está vacía.<br>
                    <small style="color: var(--text-dim);">Agrega favoritos desde la biblioteca.</small>
                </p>
            `;
            return;
        }

        els.vaultContent.innerHTML = '';
        const fragment = document.createDocumentFragment();

        data.favoritos.forEach(item => {
            const div = document.createElement("div");
            div.className = "vault-item";

            div.innerHTML = `
                <img src="${item.image}" alt="${item.title}" onerror="this.src='https://via.placeholder.com/200x150?text=Sin+Imagen'">
                <div class="vault-item-info">
                    <div class="vault-item-title">${item.title}</div>
                    <div class="vault-item-user">@${item.usuario}</div>
                    <div class="vault-item-actions">
                        <button onclick="window.open('${item.link}', '_blank')">
                            <ion-icon name="cloud-download"></ion-icon> Ver
                        </button>
                        <button class="delete" onclick="eliminarDeBoveda('${item._id}')">
                            <ion-icon name="trash"></ion-icon> Quitar
                        </button>
                    </div>
                </div>
            `;

            fragment.appendChild(div);
        });

        els.vaultContent.appendChild(fragment);

    } catch (e) {
        console.error("Error cargando bóveda:", e);
        els.vaultContent.innerHTML = `<p class="error-msg" style="grid-column: 1/-1;">❌ Error al cargar favoritos</p>`;
    }
}

// Función para eliminar de la bóveda
async function eliminarDeBoveda(itemId) {
    if (!confirm("¿Quitar este archivo de tu bóveda?")) return;

    try {
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
            alert("❌ Error al eliminar de favoritos.");
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

document.addEventListener("DOMContentLoaded", () => {
    cargarEstadoActual();
    cargarBoveda(); // ← Cargar favoritos
    actualizarPreview();
    mostrarUsuarioVerificado(); // ← Carga el nombre + verificado + avatar + bio al cargar la página
});
