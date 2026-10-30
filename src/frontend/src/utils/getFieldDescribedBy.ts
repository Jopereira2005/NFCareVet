export type FieldMessages = {
  hint?: string;
  error?: string;
};

/** ids a form control must reference in `aria-describedby`, so screen readers read its hint and error. */
export const getFieldDescribedBy = (id: string, { hint, error }: FieldMessages) =>
  [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ') || undefined;
