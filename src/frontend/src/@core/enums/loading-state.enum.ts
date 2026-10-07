export const LoadingState = {
  Idle: 'idle',
  Loading: 'loading',
  Success: 'success',
  Error: 'error',
} as const;

export type LoadingState = (typeof LoadingState)[keyof typeof LoadingState];
