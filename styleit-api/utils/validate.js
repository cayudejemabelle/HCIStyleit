// An error the controllers can throw. The error handler turns it into a JSON reply.
export class HttpError extends Error {
  constructor(status, message, field = '') {
    super(message)
    this.status = status
    this.field = field // which form field to highlight (matches the React field ids)
  }
}
export const str = (v) => String(v ?? '').trim()
export const isEmail = (v) => /^\S+@\S+\.\S+$/.test(v)
