import './sheet.css'
import { templates, buttons, X } from '../state.js'

const makeImageUrl = (filename, sheet) => 
  `url(https://dev.oct.ovh:2096/x/photo?filename=${filename}&sheet=${sheet}&size=328)`

const slideTo = (slider, n) => slider.style.transform = `translate(${n}%)`

export const Sheet = (couette) => {
  if (!couette.photos.length) return ''
  const sheet = templates.sheet()
  sheet.id = couette.name

  const [previews] = sheet.getElementsByClassName('previews')
  const [slider] = sheet.getElementsByClassName('slider')
  const inputs = couette.photos.map((href, i) => {
    const label = templates.preview()
    const [preview] = label.getElementsByTagName('div')
    const [input] = label.getElementsByTagName('input')
    const url = makeImageUrl(href, couette.name)
    preview.style.backgroundImage = url
    input.name = couette.name
    input.checked = !i
    label.onclick = () => {
      input.checked = true
      slideTo(slider, offset = -100*i)
    }
    return label
  })

  slider.append(...couette.photos.map((href, i) => {
    const image = document.createElement('div')
    const url = makeImageUrl(href, couette.name)
    image.style.backgroundImage = url
    return image
  }))

  previews.append(...inputs)

  // handle slide
  const max = (couette.photos.length-1) * -100
  let offset = 0
  let width = 324
  let time = 0
  let startX, startY
  const release = () => {
    if (!startX) return
    const dist = startX - X.get() || 0
    const delay = Date.now() - time
    if (Math.abs(dist) < 20 && delay < (width * 0.8)) {
      const { left } = sheet.getBoundingClientRect()
      const dir = Math.sign((startX - left) - width / 2)
      const input = inputs[(-offset)/100 + dir]
      stop()
      return input && input.click()
    }

    stop()
    if (Math.abs(dist) < (width / 3) - Math.max((width * 0.8) - delay, 0)) return
    const input = inputs[(-offset)/100 + Math.sign(dist)]
    input && input.click()
  }

  const stop = () => {
    if (!startX) return true
    startX = undefined
    slider.classList.add('smooth')
    slideTo(slider, offset)
  }

  const start = (initX) => {
    width = slider.clientWidth
    startX = initX
    time = Date.now()
    slider.classList.remove('smooth')
  }

  buttons.on(btn => btn || (startX && release()))

  const calcPosition = (diff) => {

    // first element inertia
    if (!offset && diff > 0) return diff / (diff + 4)

    // last element inertia
    if (max >= offset && diff < 0) return -(-diff / (-diff + 4))

    // normal case
    return diff
  }

  X.on(x => {
    if (!startX) return
    slideTo(slider, calcPosition((x - startX)/width)*100 + offset)
  })

  slider.onmousedown = (e) => {
    if (startY) return
    e.preventDefault()
    start(e.x)
  }

  slider.ontouchmove = (e) => {
    if (!startX) return
    Math.abs(startX - X.get()) > Math.abs(startY - e.touches[0].pageY)
      ? e.preventDefault()
      : stop()
  }

  slider.onmouseup = slider.ontouchend = slider.ontouchcancel = release
  slider.ontouchstart = (e) => {
    startY = e.touches[0].pageY
    start(e.touches[0].pageX)
  }

  sheet.onmouseup = () => sheet.firstElementChild.focus()
  return sheet
}
