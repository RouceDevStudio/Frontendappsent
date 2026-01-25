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
// 2. FUNCIÓN PARA IR AL PERFIL (NUEVO)
// ==========================================
function prepararPerfil(nombreUsuario) {
  // Guardamos en la memoria del navegador a quién queremos visitar
  localStorage.setItem("ver_perfil_de", nombreUsuario);
  // Saltamos a la página de perfil
  window.location.href = "perfil.html";
}

// ==========================================
// 3. RENDERIZAR TARJETAS (MODIFICADO)
// ==========================================
function renderizar(lista, esBusquedaDePerfil = false) {
  output.innerHTML = "";
  
  if (lista.length === 0) {
    output.innerHTML = "<p style='color:#888; text-align:center; width:100%; margin-top:50px;'>No hay resultados que coincidan.</p>";
    return;
  }

  // Si la búsqueda detecta un usuario exacto, podríamos añadir un mensaje aquí
  if (esBusquedaDePerfil) {
    const bannerPerfil = document.createElement("div");
    bannerPerfil.style = "grid-column: 1/-1; background: rgba(94, 255, 67, 0.05); border: 1px dashed #5EFF43; padding: 15px; border-radius: 12px; margin-bottom: 20px; text-align: center; color: #5EFF43; font-size: 13px;";
    bannerPerfil.innerHTML = `✨ Se muestran resultados del colaborador seleccionado`;
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
        <div class="user-tag" onclick="event.stopPropagation(); prepararPerfil('${nombreAutor}')" 
             style="background: rgba(94, 255, 67, 0.1); color: #5EFF43; padding: 4px 10px; border-radius: 6px; display: inline-flex; align-items: center; gap: 6px; font-size: 10px; margin-bottom: 12px; border: 1px solid rgba(94, 255, 67, 0.2); font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: 0.3s;">
            <ion-icon name="person-circle-outline"></ion-icon> 
            <span>${nombreAutor}</span>
        </div>

        <h4 class="juego-titulo" style="margin-bottom: 8px;">${item.title || "Archivo sin nombre"}</h4>
        
        <div class="cloud-note" style="font-size: 13px; line-height: 1.4; color: #aaa;">
            ${item.description || "Sin descripción proporcionada por el colaborador."}
        </div>

        <a href="${item.link}" class="boton-descargar" target="_blank" onclick="event.stopPropagation();" style="margin-top: 15px;">
            ACCEDER A LA NUBE
        </a>

        <div class="info-extra" style="display:none; margin-top:15px; border-top:1px solid #222; padding-top:12px;">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <p style="font-size:11px; color:#5EFF43;">🛡️ Verificado</p>
                <p style="font-size:10px; color:#555;">ID: ${item._id ? item._id.slice(-6) : 'N/A'}</p>
            </div>
            <p style="font-size:11px; color:#777; margin-top:8px;">
                Toca el nombre del colaborador arriba para ver su perfil completo.
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
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
    });

    const btnCerrar = div.querySelector(".close-btn");
    btnCerrar.addEventListener("click", (e) => {
        e.stopPropagation();
        div.classList.remove("expandida");
        div.querySelector(".info-extra").style.display = "none";
        document.body.style.overflow = "auto";
    });

    output.appendChild(div);
  });
}

// ==========================================
// 4. BUSCADOR INTEGRADO (REFORZADO)
// ==========================================
if (buscador) {
  buscador.addEventListener("input", (e) => {
    const textoUsuario = e.target.value.toLowerCase().trim();
    
    if (textoUsuario === "") {
        renderizar(todosLosItems);
        return;
    }

    const itemsFiltrados = todosLosItems.filter(item => {
      const enTitulo = (item.title || "").toLowerCase().includes(textoUsuario);
      const enDesc = (item.description || "").toLowerCase().includes(textoUsuario);
      const enUsuario = (item.usuario || "").toLowerCase().includes(textoUsuario);
      
      return enTitulo || enDesc || enUsuario;
    });

    // Si el texto coincide exactamente con un nombre de usuario, avisamos al render
    const esNombreDeUsuario = todosLosItems.some(item => (item.usuario || "").toLowerCase() === textoUsuario);
    
    renderizar(itemsFiltrados, esNombreDeUsuario);
  });
}

// ==========================================
// 5. LÓGICA DEL ICONO DE BÚSQUEDA
// ==========================================
const ioIcon = document.getElementById('ioIcon');
const buscadorInput = document.getElementById('buscador');

if (ioIcon && buscadorInput) {
    ioIcon.addEventListener('click', () => {
        buscadorInput.classList.toggle('buscadorHidden');
        ioIcon.style.opacity = "0";
        ioIcon.style.pointerEvents = "none";
        buscadorInput.focus();
    });

    buscadorInput.addEventListener('blur', () => {
        if (buscadorInput.value === "") {
            ioIcon.style.opacity = "1";
            ioIcon.style.pointerEvents = "auto";
            buscadorInput.classList.remove('buscadorHidden');
        }
    });
}

// Iniciar al cargar
document.addEventListener("DOMContentLoaded", cargarContenido);
