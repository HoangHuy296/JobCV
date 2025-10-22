// Simple class name merger tailwind-merge)
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

// Simple conditional class name helper
export function cx(
  ...classes: (string | undefined | null | false | { [key: string]: boolean })[]
): string {
  return classes
    .map((cls) => {
      if (typeof cls === 'string') return cls;
      if (cls && typeof cls === 'object') {
        return Object.entries(cls)
          .filter(([, value]) => value)
          .map(([key]) => key)
          .join(' ');
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}
