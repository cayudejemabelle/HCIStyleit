import db from '../db/database.js'

export default class Notification {
  static add(userId, icon, text, note = '', act = '') {
    db.prepare('INSERT INTO notifications (user_id, icon, text, note, act, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(userId, icon, text, note, act, new Date().toISOString())
  }
  // Admin-only news (new users, new shops...). Never order or money details.
  static toAdmins(icon, text, note = '') {
    for (const a of db.prepare("SELECT id FROM users WHERE role = 'admin'").all()) Notification.add(a.id, icon, text, note)
  }
  static forUser(userId, limit = 200) {
    return db.prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY id DESC LIMIT ?').all(userId, limit)
      .map((r) => ({ id: r.id, icon: r.icon, text: r.text, note: r.note, act: r.act, read: !!r.read, createdAt: r.created_at }))
  }
  static markAllRead(userId) { db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId) }
}
