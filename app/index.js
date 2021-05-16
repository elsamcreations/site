import './style.css'
import { Sheet } from './component/sheet.js'

fetch('https://dev.oct.ovh:2096/x/couette')
  .then((res) => res.json())
  .then((couettes) => document
    .querySelector('#sheets > article')
    .append(...couettes.map(Sheet)))
