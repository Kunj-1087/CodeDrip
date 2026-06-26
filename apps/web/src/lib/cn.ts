// Tiny class-name joiner. We deliberately avoid adding clsx + tailwind-merge as
// dependencies: this codebase composes classes from controlled variant maps (not
// arbitrary user input that needs conflict resolution), so a falsy-filtering join
// covers every real case while keeping the dependency surface at zero.
export type ClassValue = string | number | false | null | undefined;

export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(' ');
}
