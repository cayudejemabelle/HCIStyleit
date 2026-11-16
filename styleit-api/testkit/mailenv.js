// Import this FIRST in a test file to pretend email is set up (before the settings are read).
process.env.SMTP_HOST = 'smtp.test'
process.env.SMTP_USER = 'shop@test.com'
process.env.SMTP_PASS = 'abcd efgh ijkl mnop' // spaces are removed, like Gmail's display
process.env.SHOW_RESET_CODE = 'false'
