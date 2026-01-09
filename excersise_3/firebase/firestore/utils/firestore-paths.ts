/**
 * Generates dot-notation paths for nested object types.
 * Used for type-safe Firestore field paths like "archive.archiveYear"
 *
 * @example
 * type Doc = { archive: { year: string; book: { id: number } } };
 * type Paths = DotPaths<Doc>; // "archive" | "archive.year" | "archive.book" | "archive.book.id"
 */

// Remove undefined and null for recursion checks
type NonNullish<T> = T extends undefined | null ? never : T;

// Primitive types that should not be recursed into
type Primitive = string | number | boolean | bigint | symbol | undefined | null;

// Types that look like objects but shouldn't be recursed into
type BuiltInObject = Date | RegExp | Function | Map<any, any> | Set<any> | WeakMap<any, any> | WeakSet<any>;

// Get the non-nullish object type to recurse into
type RecursiveObject<T> = NonNullish<T> extends Primitive | BuiltInObject | readonly any[] ? never : NonNullish<T>;

// Filter out keys that are always undefined (not just optional)
type DefinedKeys<T> = {
  [K in keyof T]: T[K] extends undefined ? never : K;
}[keyof T];

export type DotPaths<T> = T extends object
  ? {
      [K in DefinedKeys<T> & string]: RecursiveObject<T[K]> extends never
        ? K
        : K | `${K}.${DotPaths<RecursiveObject<T[K]>>}`;
    }[DefinedKeys<T> & string]
  : never;

// HELP ON HOW TO USE
// type Example = {
//   a: {
//     b: undefined;
//     c: { d: number } | null;
//     e: string | null;
//     f: Array<{ x: number }>;
//   } | null;
// };

// // const x: DotPaths<Example> = 'a.b'; // b is undefined => x is not good !!
// const x: DotPaths<Example> = 'a.c.d'; // GOOD !!
// console.log(x);
