import './style.css'
import { Sheet } from './component/sheet.js'
import './component/clothing.js'


fetch('https://dev.oct.ovh:2096/x/couette')
  .then((res) => res.json())
  .then((couettes) => {
    const sheets = couettes.map(Sheet)
    document.querySelector('#sheets > article').append(...sheets)
    sheets[0].querySelector('input').focus()
  })
