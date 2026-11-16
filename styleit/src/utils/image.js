// Reads a photo the seller picked and shrinks it so the page stays light.
export function readImg(file) {
  return new Promise((resolve) => {
    if (!file) return resolve({ img: '' })
    if (!/^image\//.test(file.type)) return resolve({ error: 'Please choose an image file (JPG or PNG).' })
    const r = new FileReader()
    r.onload = () => {
      const im = new Image()
      im.onload = () => {
        const k = Math.min(1, 520 / Math.max(im.width, im.height))
        const c = document.createElement('canvas')
        c.width = im.width * k
        c.height = im.height * k
        c.getContext('2d').drawImage(im, 0, 0, c.width, c.height)
        resolve({ img: c.toDataURL('image/jpeg', 0.82) })
      }
      im.onerror = () => resolve({ error: 'That image couldn’t be read. Try another one.' })
      im.src = r.result
    }
    r.readAsDataURL(file)
  })
}
