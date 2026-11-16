// Product picture: the seller's photo, or an emoji for the sample products.
export default function Pic({ p, className = 'thm' }) {
  return p.img
    ? <img className={className} src={p.img} alt={p.n} />
    : <span className={className} aria-hidden="true">{p.e}</span>
}
