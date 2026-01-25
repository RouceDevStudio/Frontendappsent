const API_URL = "https://backendapp-037y.onrender.com";
const output = document.getElementById("output");
const buscador = document.getElementById("buscador");
const overlay = document.getElementById("overlay");

let todosLosItems = [];

async function cargarContenido() {
    try {
        output.innerHTML = `<p style="grid-column:1/-1; text-align:center; color:#5EFF43; padding:50px;">☁️ Sincronizando nube...</p>`;
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
    if (lista.length === 0) return;

    lista.forEach((item) => {
        const card = document.createElement("div");
        card.className = "juego-card";
        const autor = item.usuario || 'Cloud User';
        const shortID = item._id ? item._id.slice(-6) : 'e29b43';

        card.innerHTML = `
            <div class="close-btn"><ion-icon name="close-outline"></ion-icon></div>
            <img src="${item.image || ''}" class="juego-img">
            <div class="card-content">
                <div class="user-tag" onclick="event.stopPropagation(); prepararPerfil('${autor}')">
                    <ion-icon name="person-circle"></ion-icon> <span>${autor}</span>
                </div>
                <h4 class="juego-titulo">${item.title}</h4>
                <p class="cloud-note">${item.description || 'Sin descripción.'}</p>
                <div class="boton-descargar">ACCEDER A LA NUBE</div>
                <div class="info-verificacion">
                    <div class="verificado-flex">
                        <div class="status-check"><ion-icon name="shield-checkmark"></ion-icon> Verificado</div>
                        <div class="file-id">ID: ${shortID}</div>
                    </div>
                </div>
            </div>
        `;

        card.addEventListener("click", () => {
            if (!card.classList.contains("expandida")) {
                document.querySelectorAll(".juego-card").forEach(c => c.classList.remove("expandida"));
                card.classList.add("expandida");
                overlay.style.display = "block";
                document.body.style.overflow = "hidden";
                card.querySelector(".boton-descargar").onclick = () => window.open(item.link, "_blank");
            }
        });

        card.querySelector(".close-btn").addEventListener("click", (e) => {
            e.stopPropagation();
            card.classList.remove("expandida");
            overlay.style.display = "none";
            document.body.style.overflow = "auto";
        });

        output.appendChild(card);
    });
}

// FUNCIÓN PARA VER EL PERFIL DE OTROS (Al tocar el nombre en la carta)
function prepararPerfil(nombre) {
    if (!nombre || nombre === 'Cloud User') {
        alert("Este colaborador no tiene un perfil configurado.");
        return;
    }
    localStorage.setItem("ver_perfil_de", nombre.trim());
    window.location.href = "https://roucedevstudio.github.io/PerfilApp/";
}

// FUNCIÓN PARA MI PROPIO PERFIL (Icono del header)
const btnPerfil = document.getElementById('btn-mi-perfil');
if (btnPerfil) {
    btnPerfil.addEventListener('click', () => {
        const miUsuario = localStorage.getItem("user_admin"); // Asegúrate de que este dato exista al loguear
        if (miUsuario) {
            localStorage.setItem("ver_perfil_de", miUsuario);
            window.location.href = "https://roucedevstudio.github.io/PerfilApp/";
        } else {
            alert("No hemos detectado tu sesión. Por favor, inicia sesión.");
            // Opcional: window.location.href = "login.html";
        }
    });
}

overlay.addEventListener("click", () => {
    document.querySelectorAll(".juego-card").forEach(c => c.classList.remove("expandida"));
    overlay.style.display = "none";
    document.body.style.overflow = "auto";
});

buscador.addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const filtrados = todosLosItems.filter(item => 
        item.title.toLowerCase().includes(term) || 
        (item.usuario || "").toLowerCase().includes(term)
    );
    renderizar(filtrados);
});

document.addEventListener("DOMContentLoaded", cargarContenido);
