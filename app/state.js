import { eve } from '../lib/eve.js'

// Elements
const templatesEntries =
  [...document.getElementsByTagName('template')].map(t => {
    const elem = t.content.firstElementChild
    return [t.id, () => elem.cloneNode(true)]
  })

export const templates = Object.fromEntries(templatesEntries)

// Events
export const X = eve(0)
export const buttons = eve(0)

const updateMouseState =  e => {
  X.set(e.x)
  buttons.set(e.buttons)
}

window.addEventListener('mousemove', updateMouseState, false)
window.addEventListener('mousedown', updateMouseState, false)
window.addEventListener('touchmove', e => X.set(e.touches[0].pageX), false)
