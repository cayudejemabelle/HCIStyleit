export default function Logo() {
  return (
    <div className="logo" role="img" aria-label="StyleIt">
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 9.5a3 3 0 1 1 3 3c-1.7 0-3 1.3-3 3v1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 16.5 4.2 24.3a1.5 1.5 0 0 0 .8 2.7h22a1.5 1.5 0 0 0 .8-2.7z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      </svg>
      <span aria-hidden="true">Style<em>It</em> 🎀</span>
    </div>
  )
}
