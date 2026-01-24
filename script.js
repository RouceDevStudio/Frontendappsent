

const API_URL = "https://backendapp-037y.onrender.com"

const output = document.getElementById("output")

async function cargarContenido() {
  const res = await fetch(`${API_URL}/items`)
  const items = await res.json()
  
  output.innerHTML = ""
  
  items.forEach(item => {
    const div = document.createElement("div")
    div.innerHTML = `
      <h4>${item.title}</h4>
      <p>${item.description}</p>
      <hr>
    `
    output.appendChild(div)
  })
}

// Se ejecuta apenas carga la página
cargarContenido()