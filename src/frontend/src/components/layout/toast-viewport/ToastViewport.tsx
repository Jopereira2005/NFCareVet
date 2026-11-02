import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { Toast } from '@/components/ui/toast/Toast';
import { useToastStore } from '@/stores/useToastStore';

/**
 * Renders the newest toast of the global queue.
 * When a native modal (<dialog open>) is in the browser's Top Layer,
 * portals into it so toasts render directly above the dialog rather than
 * being hidden behind it.
 */
export function ToastViewport() {
  const toast = useToastStore((state) => state.toasts.at(-1));
  const dismiss = useToastStore((state) => state.dismiss);
  const [activeDialog, setActiveDialog] = useState<Element | null>(null);

  useEffect(() => {
    const updateActiveDialog = () => {
      const dialogs = document.querySelectorAll('dialog[open]');
      setActiveDialog(dialogs.length > 0 ? dialogs[dialogs.length - 1] : null);
    };

    updateActiveDialog();

    const observer = new MutationObserver(updateActiveDialog);
    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ['open'],
      childList: true,
    });

    return () => observer.disconnect();
  }, [toast]);

  if (!toast) return null;

  const toastElement = (
    <Toast
      key={toast.id}
      title={toast.title}
      description={toast.description}
      tone={toast.tone}
      onClose={() => dismiss(toast.id)}
    />
  );

  if (activeDialog) {
    return createPortal(toastElement, activeDialog);
  }

  return toastElement;
}
