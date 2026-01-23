const API_URL = "#"
const salidaItem= document.getElementById('outItem');

fetch(`${API_URL}/games`)
  .then(res => res.json())
  .then(items => {
    salidaItem.innerHTML = ""

    items.forEach(item => {
      const div = document.createElement("div")
      div.textContent = item.name
      salidaItem.appendChild(div)
    })
  })




