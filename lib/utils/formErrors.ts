export type AntdFormValidationError = {
  errorFields?: unknown[];
};

export const isAntdFormValidationError = (
  error: unknown
): error is AntdFormValidationError =>
  typeof error === "object" &&
  error !== null &&
  "errorFields" in error &&
  Array.isArray((error as AntdFormValidationError).errorFields);

