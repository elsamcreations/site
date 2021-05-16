// create an observable or event
export const eve = (...args) => {
  const subs = new Set()
  const sub = (fn) => (subs.add(fn), () => subs.delete(fn))
  const next = () => new Promise(once)
  const once = (fn) =>
    subs.add(function $(value, prev) {
      subs.delete($)
      fn(value, prev)
    })

  // If no arguments are passed, this is an simple event
  if (!args.length) {
    const trigger = (value) => {
      for (const fn of subs) fn(value)
    }
    return { next, once, on: sub, trigger }
  }

  // Otherwhise it's an observable with `set`, `get` and `map`
  // additional methods
  let [data] = args
  const get = () => data
  const on = (fn) => (fn(data), sub(fn))
  const set = (next) => {
    if (next === data) return
    const prev = data
    data = next
    for (const fn of subs) fn(next, prev)
  }
  const map = (fn) => {
    const { set, ...obs } = eve(fn(get()))
    on((data) => set(fn(data)))
    return obs
  }
  return { map, once, next, get, set, on }
}
