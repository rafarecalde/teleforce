import type { EaLinkPreview } from '@/lib/ea';

function copy(preview: EaLinkPreview): string {
  if (preview.replacedClientName && preview.replacedEaName) {
    return `${preview.eaName} is linked to ${preview.replacedClientName}, and ${preview.clientName} is linked to ${preview.replacedEaName}. Continuing replaces both.`;
  }
  if (preview.replacedClientName) {
    return `${preview.eaName} is linked to ${preview.replacedClientName}. Linking them to ${preview.clientName} replaces that client.`;
  }
  return `${preview.clientName} is linked to ${preview.replacedEaName}. Linking ${preview.eaName} replaces that assistant.`;
}

export default function EaLinkConfirm({
  preview,
  returnTo,
}: {
  preview: EaLinkPreview;
  returnTo?: 'eas';
}) {
  return (
    <form action="/api/admin/ea-link" method="post" className="card" id="ea-replace">
      <h2>Confirm this link</h2>
      <p className="hint">{copy(preview)}</p>
      <input type="hidden" name="intent" value="link" />
      <input type="hidden" name="confirm" value="1" />
      <input type="hidden" name="eaId" value={preview.eaId} />
      <input type="hidden" name="userId" value={preview.userId} />
      {returnTo === 'eas' && <input type="hidden" name="returnTo" value="eas" />}
      <button className="btn btn-primary" type="submit">Replace and link</button>
    </form>
  );
}
