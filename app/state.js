import { eve } from '../lib/eve.js'

// Elements
const templatesEntries =
  [...document.getElementsByTagName('template')].map(t => {
    const elem = t.content.firstElementChild
    return [t.id, () => elem.cloneNode(true)]
  })

export const templates = Object.fromEntries(templatesEntries)
export const isFR = navigator.languages.includes('fr')
const languageSuffix = isFR ? '_fr' : ''

document.body.classList.add(isFR ? 'fr' : 'en')

// Events
export const X = eve(0)
export const buttons = eve(0)
export const frame = eve(0)
export const activeElement = frame.map(() => document.activeElement)
export const loc = new Proxy({}, { get: (_, k) => `${k}${languageSuffix}`})

requestAnimationFrame(function loop(time) {
  frame.set(time)
  requestAnimationFrame(loop)
})

const updateMouseState =  e => {
  X.set(e.x)
  buttons.set(e.buttons)
}

window.addEventListener('mousemove', updateMouseState, false)
window.addEventListener('mousedown', updateMouseState, false)
window.addEventListener('touchmove', e => X.set(e.touches[0].pageX), false)
