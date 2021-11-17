import './size.css'

import { loc } from '../state.js'
import { products } from '../data.js'
import { selectedSheet } from './sheet.js'
import { selectedProduct } from './clothing.js'

const cart = []

console.log(products)

const sizesWrapper = document.querySelector('#size article > div') 

selectedProduct.on(product => {
  const name = product[loc.name]
  sizesWrapper.classList.toggle('disabled', !product.sizes)
  
  console.log(product.options)
})


console.log({ sizesWrapper})
