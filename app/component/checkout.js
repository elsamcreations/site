import './checkout.css'

import { loc } from '../state.js'
import { products } from '../data.js'
import { selectedSheet } from './sheet.js'
import { selectedProduct } from './clothing.js'

const cart = []

console.log(products)

const sizesSelector = document.getElementById('sizes-selector')

selectedProduct.on(product => {
  const name = product[loc.name]
  sizesSelector.classList.toggle('disabled', !product.sizes)
  
  console.log(product.options)
})

document.getElementById('order-form').addEventListener('submit', (event) => {
  event.preventDefault()
  console.log({
    sheet: selectedSheet.get().data.name,
    product: selectedProduct.get()[loc.name],
  })
  
  const items = [
    // { quantity, product, sheet, size, note },
  ]

})
