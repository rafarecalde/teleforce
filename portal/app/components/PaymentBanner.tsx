'use client';

export default function PaymentBanner() {
  function open(event: React.MouseEvent<HTMLAnchorElement>) {
    const section = document.getElementById('add-payment');
    if (!section) return;
    event.preventDefault();
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (window.location.hash !== '#add-payment') {
      history.pushState(null, '', '#add-payment');
    }
    const name = document.getElementById('pm-card-name');
    if (name instanceof HTMLInputElement) name.focus({ preventScroll: true });
  }

  return (
    <div className="pay-banner" role="status">
      <p>
        <strong>Add your card.</strong> No charge while we search and match. Billing starts when
        your EA kicks off — or 3 business days after you accept your match.
      </p>
      <a className="btn btn-primary" href="#add-payment" onClick={open}>
        Add payment method
      </a>
    </div>
  );
}
