import { useCallback, useState } from "react";

// Open/close state for modals, drawers and dropdowns, with an optional payload (e.g. the item being edited).
export default function useDisclosure() {
  const [state, setState] = useState({ open: false, data: null });
  const open = useCallback((data = null) => setState({ open: true, data }), []);
  const close = useCallback(() => setState({ open: false, data: null }), []);
  return { isOpen: state.open, data: state.data, open, close };
}
