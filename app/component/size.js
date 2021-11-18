import './size.css'

import { loc } from '../state.js'
import { selectedProduct } from './clothing.js'

const sizesWrapper = document.querySelector('#size article > div') 

selectedProduct.on(product => {
  const name = product[loc.name]
  sizesWrapper.classList.toggle('disabled', !product.sizes)
})

