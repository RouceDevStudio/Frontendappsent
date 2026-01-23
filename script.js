const API_URL = "https://backendapp-037y.onrender.com"
const salidaItem= document.getElementById('outItem');

fetch(`${API_URL}/items`)
  .then(res => res.json())
  .then(items => {
    salidaItem.innerHTML = ""

    items.forEach(item => {
      const div = document.createElement("div")
      div.textContent = item.name
      salidaItem.appendChild(div)
    })
  })




