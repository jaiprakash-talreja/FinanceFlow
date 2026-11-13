import { useState } from "react";
import Modal from "./Modal";
import Button from "./Button";

export default function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = "Delete", variant = "danger" }) {
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={busy ? () => {} : onClose} title={title} size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button variant={variant} onClick={confirm} loading={busy}>{confirmLabel}</Button>
      </>}>
      <p className="text-sm text-slate-600 dark:text-slate-400">{message}</p>
    </Modal>
  );
}
