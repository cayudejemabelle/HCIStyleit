import Notification from '../models/Notification.js'

export const list = (req, res) => res.json(Notification.forUser(req.user.id))
export function readAll(req, res) {
  Notification.markAllRead(req.user.id)
  res.json(Notification.forUser(req.user.id))
}
