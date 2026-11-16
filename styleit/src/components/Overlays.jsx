import Modal from './Modal'

// The little message at the bottom of the screen
export function Toast({ msg }) {
  return <div className={'toast' + (msg ? ' show' : '')} role="status">{msg}</div>
}

// "Are you sure?" pop-up used before delete / cancel / ship. Cancel is on the left.
export function Confirm({ cfm, onNo, onYes }) {
  return (
    <Modal open={!!cfm} onClose={onNo} labelledBy="ct">
      {cfm && (
        <>
          <h2 id="ct">{cfm.title}</h2>
          <p>{cfm.text}</p>
          <div className="dact">
            <button className="btn ghost" autoFocus onClick={onNo}>Cancel</button>
            <button className="pill" onClick={onYes}>{cfm.yes}</button>
          </div>
        </>
      )}
    </Modal>
  )
}
