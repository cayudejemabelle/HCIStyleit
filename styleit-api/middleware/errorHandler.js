import { HttpError } from '../utils/validate.js'

// Every error ends up here and becomes a JSON reply like { error, field }.
export default function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) return res.status(err.status).json({ error: err.message, field: err.field })
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'That photo is too big. Try a smaller one.', field: '' })
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'The request was not valid JSON.', field: '' })
  console.error(err)
  res.status(500).json({ error: 'Something went wrong on our side. Please try again.', field: '' })
}
