import './quote.css'

import { isFR } from '../state.js'
import { products } from '../data.js'
import { selectedSheet } from './sheet.js'
import { selectedProduct } from './clothing.js'

const instructions = document.querySelector('#instructions textarea')
const email = document.querySelector('#email')
const form = document.querySelector('#quote form')
const btn = document.querySelector('#quote button[type=submit]')
const sizes = [...document.querySelectorAll('#size input[type=radio]')]

form.addEventListener('submit', e => {
  e.preventDefault()
  const product = selectedProduct.get()
  const sheet = selectedSheet.get()
  const size = sizes.find(i => i.checked).value
  const [productId] = Object.entries(products).find(e => e[1] === product)

  form.parentElement.dataset.state = 'disabled'
  btn.disabled = true
  fetch('https://api.elsamcreations.com/order', {
    method: 'POST',
    body: JSON.stringify({
      lang: isFR ? 'FR' : 'EN',
      productId,
      item: product.name,
      size: product.sizes ? size : 'unisize',
      sheet: sheet.data,
      email: email.value,
      instructions: instructions.value,
    })
  }).then(
    () => {
      form.parentElement.dataset.state = 'success'
      instructions.value = ''
    },
    (err) => {
      form.parentElement.dataset.state = 'failure'
      console.log(err)
      // show error here!
    },
  ).finally(() => btn.disabled = false)
})

// post:
// - size
// - lang
// - email
// - sheet
// - notes
// - item (clothing)
