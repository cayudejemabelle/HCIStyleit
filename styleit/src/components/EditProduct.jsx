import Modal from './Modal'
import ProductForm from './ProductForm'
import { useStore } from '../store/StoreContext'
import { diffProduct } from '../utils/shop'

function Body({ p, onClose }) {
  const { api, ask } = useStore()
  const submit = (v) => {
    const changes = diffProduct(p, v)
    if (!changes.length) return ask('Nothing changed', 'You haven’t changed anything yet.', 'OK', () => {})
    ask('Save these changes?', changes.join('; ') + '.', 'Yes, save changes', async () => { if (await api.editProduct(p.id, v)) onClose() })
  }
  return (
    <>
      <h2 id="et">Edit product ✏️</h2>
      <ProductForm pre="e" editing initial={p} sold={p.sold} submitLabel="Save changes" onSubmit={submit} onCancel={onClose} />
    </>
  )
}

// Sellers can edit only their own products, and always get a "Save these changes?" check first.
export default function EditProduct({ id, onClose }) {
  const { s } = useStore()
  const p = s.products.find((x) => x.id === id)
  return <Modal open={!!p} onClose={onClose} labelledBy="et">{p && <Body p={p} onClose={onClose} />}</Modal>
}
