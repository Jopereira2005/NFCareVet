import { useSearchParams } from 'react-router';

/**
 * A single URL query param as React state, restricted to `allowedValues`.
 * The default value is kept out of the URL so links stay clean (`/tasks` instead of `/tasks?tab=mine`),
 * and updates replace the history entry, so the back button leaves the screen instead of undoing a tab switch.
 */
export function useSearchParamState<TValue extends string>(
  key: string,
  defaultValue: TValue,
  allowedValues: readonly TValue[],
): [TValue, (value: TValue) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawValue = searchParams.get(key);
  const value = allowedValues.find((allowed) => allowed === rawValue) ?? defaultValue;

  const setValue = (nextValue: TValue) =>
    setSearchParams(
      (current) => {
        const next = new URLSearchParams(current);
        if (nextValue === defaultValue) next.delete(key);
        else next.set(key, nextValue);
        return next;
      },
      { replace: true },
    );

  return [value, setValue];
}
