import type { ComponentType } from 'react';

/** Any icon component accepted by the UI: Lucide icons or custom SVG components from `assets/icons`. */
export type IconComponent = ComponentType<{ className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
