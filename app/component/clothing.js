import './clothing.css'

import { eve } from '../../lib/eve.js'
import { products } from '../data.js'
import { templates, loc } from '../state.js'
import { selectedSheet } from './sheet.js'

selectedSheet.on(sheet => {
  if (!sheet) return
  console.log(sheet.cover)
  document.querySelector('#bg-img')
    .setAttribute('href', sheet.cover)
})

const selectedClothing = eve(undefined)

export const selectedProduct = selectedClothing
  .map(group => group && products[group.id])
  .filter(Boolean)

selectedClothing.on((group, prev) => {
  if (!group) return
  prev && (prev.style.display = '')
  group.style.display = 'initial'
})

selectedProduct.on(product => product && (title.textContent = product[loc.name]))

const svg = document.querySelector('#clothing svg')
const title = document.querySelector('#clothing p')
const selectorWrapper = document.querySelector('#clothing-selector')
const clothGroups = [...svg.getElementsByTagName('g')]
const selectors = clothGroups.map(group => {
  const label = templates.selector()
  const thumb = svg.cloneNode(true)
  const [input] = label.getElementsByTagName('input')
  const g = thumb.getElementById(group.id)
  g.firstElementChild.setAttribute('fill', '#fff')
  g.setAttribute('style', 'display: initial')
  input.name = 'clothing-selector'

  label.append(thumb)
  label.onclick = () => selectedClothing.set(group)
  return label
})

selectorWrapper.append(...selectors)
selectors[0].click()
