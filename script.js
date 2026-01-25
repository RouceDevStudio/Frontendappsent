const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");
const overlay = document.getElementById("overlay");

let todosLosItems = [];

async function cargarContenido() {
    try {
        output.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#5EFF43; padding:50px;">☁️ Sincronizando repositorio...</p>`;
        const res = await fetch(`${API_URL}/items`);
        const data = await res.json();
        todosLosItems = Array.isArray(data) ? data.filter(item => item.status === "aprobado") : [];
        renderizar(todosLosItems);
    } catch (error) {
        output.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:red;">Error de conexión.</p>`;
    }
}

function renderizar(lista) {
    output.innerHTML = "";
    if (lista.length === 0) {
        output.innerHTML = `<p style="grid-column:1/-1; text-align:center; opacity:0.5; padding:50px;">Sin resultados.</p>`;
        return;
    }

    lista.forEach((item) => {
        const card = document.createElement("div");
        card.className = "juego-card";
        const autor = item.usuario || 'Cloud User';
        const shortID = item._id ? item._id.slice(-6) : 'e29b43';

        // La estructura NO incluye la X inicialmente para evitar el error visual
        card.innerHTML = `
            <div class="close-btn"><ion-icon name="close-outline"></ion-icon></div>
            <img src="${item.image || ''}" class="juego-img" alt="banner">
            
            <div class="card-content">
                <div class="user-tag" onclick="event.stopPropagation(); prepararPerfil('${autor}')">
                    <ion-icon name="person-circle"></ion-icon> <span>${autor}</span>
                </div>
                
                <h4 class="juego-titulo">${item.title}</h4>
                
                <p class="cloud-note">${item.description || 'Sin descripción.'}</p>
                
                <div class="boton-descargar">ACCEDER A LA NUBE</div>

                <div class="info-verificacion">
                    <div class="verificado-flex">
                        <div class="status-check">
                            <ion-icon name="shield-checkmark"></ion-icon> Verificado
                        </div>
                        <div class="file-id">ID: ${shortID}</div>
                    </div>
                    <p class="footer-nota">Toca el nombre del colaborador para ver su perfil.</p>
                </div>
            </div>
        `;

        card.addEventListener("click", () => {
            if (!card.classList.contains("expandida")) {
                // Cerrar cualquier otra
                document.querySelectorAll(".juego-card").forEach(c => c.classList.remove("expandida"));
                
                card.classList.add("expandida");
                overlay.style.display = "block";
                document.body.style.overflow = "hidden";
                
                // Si el item tiene link, hacerlo funcional en el botón al expandir
                const btn = card.querySelector(".boton-descargar");
                btn.onclick = () => window.open(item.link, "_blank");
            }
        });

        // Evento para el botón de cerrar (solo funciona cuando está expandida)
        card.querySelector(".close-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            card.classList.remove("expandida");
            overlay.style.display = "none";
            document.body.style.overflow = "auto";
        });

        output.appendChild(card);
    });
}

overlay.addEventListener("click", () => {
    document.querySelectorAll(".juego-card").forEach(c => c.classList.remove("expandida"));
    overlay.style.display = "none";
    document.body.style.overflow = "auto";
});

function prepararPerfil(nombre) {
    if (!nombre || nombre === 'Cloud User') return alert("Perfil no configurado.");
    localStorage.setItem("ver_perfil_de", nombre.trim());
    window.location.href = "https://roucedevstudio.github.io/PerfilApp/";
}

buscador.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtrados = todosLosItems.filter(item => 
        item.title.toLowerCase().includes(term) || 
        (item.usuario || "").toLowerCase().includes(term)
    );
    renderizar(filtrados);
});

document.addEventListener("DOMContentLoaded", cargarContenido);
