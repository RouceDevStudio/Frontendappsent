const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");

let todosLosItems = [];

// ==========================================
// 1. CARGAR DATOS DESDE MONGODB
// ==========================================
async function cargarContenido() {
  try {
    output.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 50px;">
        <p style="color:#5EFF43; font-weight:bold; font-size:1.2rem; letter-spacing:2px;">☁️ SINCRONIZANDO NUBE...</p>
        <small style="color:#666;">El servidor gratuito puede tardar unos segundos en responder.</small>
      </div>`;

    const res = await fetch(`${API_URL}/items`);
    const data = await res.json();
    
    const listaBruta = Array.isArray(data) ? data : [];
    // Filtramos para mostrar solo lo aprobado
    todosLosItems = listaBruta.filter(item => item.status === "aprobado");
    
    renderizar(todosLosItems);
    
  } catch (error) {
    console.error("Error cargando el contenido:", error);
    output.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding: 50px;">
        <p style="color:#FF4343; font-weight:bold;">⚠️ ERROR DE CONEXIÓN CON EL REPOSITORIO</p>
      </div>`;
  }
}

// ==========================================
// 2. FUNCIÓN PARA IR AL PERFIL (CORREGIDA)
// ==========================================
function prepararPerfil(nombreUsuario) {
  // Evitamos el error 404 si el perfil es anónimo o genérico
  if (!nombreUsuario || nombreUsuario === 'Cloud User' || nombreUsuario === 'Anónimo') {
      alert("Este usuario es temporal y no tiene un perfil configurado.");
      return;
  }

  // Guardamos el nombre limpio en la memoria
  localStorage.setItem("ver_perfil_de", nombreUsuario.trim());
  
  // REDIRECCIÓN A GITHUB PAGES (Asegúrate que el nombre del repo sea exacto)
  window.location.href = "https://roucedevstudio.github.io/PerfilApp/";
}

// ==========================================
// 3. RENDERIZAR TARJETAS
// ==========================================
function renderizar(lista, esBusquedaDePerfil = false) {
  output.innerHTML = "";
  
  if (lista.length === 0) {
    output.innerHTML = "<p style='color:#888; text-align:center; width:100%; margin-top:50px;'>No hay resultados que coincidan.</p>";
    return;
  }

  if (esBusquedaDePerfil) {
    const bannerPerfil = document.createElement("div");
    bannerPerfil.style = "grid-column: 1/-1; background: rgba(94, 255, 67, 0.05); border: 1px dashed #5EFF43; padding: 15px; border-radius: 12px; margin-bottom: 20px; text-align: center; color: #5EFF43; font-size: 13px;";
    bannerPerfil.innerHTML = `✨ Mostrando resultados de un colaborador`;
    output.appendChild(bannerPerfil);
  }

  lista.forEach(item => {
    const div = document.createElement("div");
    div.classList.add("juego-card");
    
    const nombreAutor = item.usuario || 'Cloud User';

    div.innerHTML = `
      <div class="close-btn">✕</div>
      ${item.image ? `<img src="${item.image}" class="juego-img" alt="${item.title}">` : '<div style="height:120px; background:#111; display:flex; align-items:center; justify-content:center; color:#333;"><ion-icon name="image-outline" style="font-size:2rem;"></ion-icon></div>'}
      
      <div class="card-content">
        <div class="user-tag" onclick="event.stopPropagation(); prepararPerfil('${nombreAutor}')">
            <ion-icon name="person-circle-outline"></ion-icon> 
            <span>${nombreAutor}</span>
        </div>

        <h4 class="juego-titulo">${item.title || "Archivo sin nombre"}</h4>
        
        <div class="cloud-note">
            ${item.description || "Sin descripción disponible."}
        </div>

        <a href="${item.link}" class="boton-descargar" target="_blank" onclick="event.stopPropagation();">
            ACCEDER A LA NUBE
        </a>

        <div class="info-extra" style="display:none; margin-top:15px; border-top:1px solid #222; padding-top:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <p style="font-size:11px; color:#5EFF43;">🛡️ Verificado</p>
                <p style="font-size:10px; color:#555;">ID: ${item._id ? item._id.slice(-6) : 'N/A'}</p>
            </div>
            <p style="font-size:11px; color:#777; margin-top:8px;">
                Toca el nombre del colaborador para ver su perfil.
            </p>
        </div>
      </div>
    `;

    // --- LÓGICA DE EXPANSIÓN ---
    div.addEventListener("click", () => {
        const estaExpandida = div.classList.contains("expandida");
        document.querySelectorAll(".juego-card.expandida").forEach(card => {
            card.classList.remove("expandida");
            card.querySelector(".info-extra").style.display = "none";
        });

        if (!estaExpandida) {
            div.classList.add("expandida");
            div.querySelector(".info-extra").style.display = "block";
        }
    });

    const btnCerrar = div.querySelector(".close-btn");
    btnCerrar.addEventListener("click", (e) => {
        e.stopPropagation();
        div.classList.remove("expandida");
        div.querySelector(".info-extra").style.display = "none";
    });

    output.appendChild(div);
  });
}

// ==========================================
// 4. BUSCADOR
// ==========================================
if (buscador) {
  buscador.addEventListener("input", (e) => {
    const texto = e.target.value.toLowerCase().trim();
    if (texto === "") {
        renderizar(todosLosItems);
        return;
    }

    const filtrados = todosLosItems.filter(item => 
      (item.title || "").toLowerCase().includes(texto) || 
      (item.description || "").toLowerCase().includes(texto) || 
      (item.usuario || "").toLowerCase().includes(texto)
    );

    const esAutor = todosLosItems.some(item => (item.usuario || "").toLowerCase() === texto);
    renderizar(filtrados, esAutor);
  });
}

// ==========================================
// 5. ICONO BUSCADOR
// ==========================================
const ioIcon = document.getElementById('ioIcon');
if (ioIcon && buscador) {
    ioIcon.addEventListener('click', () => {
        buscador.classList.toggle('buscadorHidden');
        ioIcon.style.opacity = "0";
        buscador.focus();
    });
}

document.addEventListener("DOMContentLoaded", cargarContenido);

document.addEventListener("DOMContentLoaded", () => {
    // 1. Obtenemos el usuario actual para que el contrato sea personal
    const usuarioActivo = localStorage.getItem("user_admin") || "Invitado";
    
    // 2. Creamos una llave única que combina el usuario con la versión de los términos
    // Esto hace que si cambian de cuenta o cierran sesión, la llave desaparezca o cambie
    const llaveLegal = `aceptacion_v1_${usuarioActivo}`;
    const yaAcepto = localStorage.getItem(llaveLegal);

    if (!yaAcepto) {
        const mensajeLegal = `⚖️ TÉRMINOS DE NEUTRALIDAD Y SEGURIDAD UPGAMES:

1. UpGames es un servicio de ALOJAMIENTO de enlaces. No suministramos ni somos dueños del contenido vinculado.
2. La responsabilidad legal de los archivos recae exclusivamente en el usuario que los publica.
3. UpGames NO edita el contenido del usuario, EXCEPTO en casos de material sensible, para adultos (NSFW) o ilegal, el cual será eliminado sin previo aviso.
4. Al continuar, declaras que eres responsable de los links que compartes y eximes a la plataforma de cualquier reclamo legal.

¿Aceptas estos términos de intermediación?`;

        if (confirm(mensajeLegal)) {
            // Se almacena en LocalStorage: No volverá a salir mientras no borren datos o cambien de usuario
            localStorage.setItem(llaveLegal, "true");
        } else {
            // Si rechaza, limpiamos sesión y lo sacamos
            localStorage.removeItem("user_admin");
            window.location.href = "https://www.google.com";
        }
    }
});
