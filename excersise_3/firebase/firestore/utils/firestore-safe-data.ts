export type WithNonNull<T, K extends keyof T> = Omit<T, K> & {
  [P in K]-?: NonNullable<T[P]>;
};

/**
 * Makes a nested property non-null using dot notation path.
 * @example
 * type ValidCandidate = WithNestedNonNull<Candidate, 'DATES.ENROLLMENT_DATE'>;
 * // This ensures both DATES is not null AND DATES.ENROLLMENT_DATE is not null
 */
export type WithNestedNonNull<T, Path extends string> = Path extends `${infer K}.${infer Rest}`
  ? K extends keyof T
    ? Omit<T, K> & {
        [P in K]-?: WithNestedNonNull<NonNullable<T[P]>, Rest>;
      }
    : T
  : Path extends keyof T
  ? Omit<T, Path> & {
      [P in Path]-?: NonNullable<T[P]>;
    }
  : T;
