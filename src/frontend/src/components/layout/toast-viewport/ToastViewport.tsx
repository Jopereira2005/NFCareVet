import { Toast } from '@/components/ui/toast/Toast';
import { useToastStore } from '@/stores/useToastStore';

/** Renders the newest toast of the global queue; mounted once at the app root. */
export function ToastViewport() {
  const toast = useToastStore((state) => state.toasts.at(-1));
  const dismiss = useToastStore((state) => state.dismiss);

  if (!toast) return null;

  return (
    <Toast
      // A new key per message restarts the auto-dismiss timer
      key={toast.id}
      title={toast.title}
      description={toast.description}
      tone={toast.tone}
      onClose={() => dismiss(toast.id)}
    />
  );
}
