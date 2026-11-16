// Scrolls to an element, focuses it and flashes it (used when a reminder is clicked).
export function focusEl(selector) {
  if (!selector) return
  setTimeout(() => {
    const e = document.querySelector(selector)
    if (!e) return
    e.scrollIntoView({ block: 'center' })
    e.focus()
    e.classList.add('flash')
    setTimeout(() => e.classList.remove('flash'), 2500)
  }, 60)
}
