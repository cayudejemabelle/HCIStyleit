export default function Stats({ items }) {
  return (
    <div className="stats">
      {items.map(([label, value]) => <div className="stat" key={label}><b>{value}</b>{label}</div>)}
    </div>
  )
}
