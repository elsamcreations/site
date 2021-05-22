import './clothing.css'

import { eve } from '../../lib/eve.js'
import { templates } from '../state.js'
import { selectedSheet } from './sheet.js'

selectedSheet.on(sheet => {
  if (!sheet) return
  console.log(sheet.cover)
  document.querySelector('#bg-img')
    .setAttribute('href', sheet.cover)
})

export const selectedCloth = eve(undefined)

selectedCloth.on((group, prev) => {
  prev && (prev.style.display = '')
  group && (group.style.display = 'initial')
})

const svg = document.querySelector('#clothing svg')
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
  label.onclick = () => selectedCloth.set(group)
  return label
})

selectorWrapper.append(...selectors)
selectors[0].click()
