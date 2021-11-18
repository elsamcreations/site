import './style.css'
import './component/instructions.css'
import { Sheet } from './component/sheet.js'
import './component/quote.js'
import './component/clothing.js'
import './component/size.js'

fetch('https://api.elsamcreations.com/couette')
  .then((res) => res.json())
  .then((couettes) => {
    const sheets = couettes.map(Sheet)
    document.querySelector('#sheets > article').append(...sheets)
    sheets[0].querySelector('input').focus()
  })
