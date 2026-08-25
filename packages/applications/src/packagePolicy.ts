const PACKAGE_NAME = /^[A-Za-z][A-Za-z0-9_]*(?:\.[A-Za-z0-9_]+)+$/;

export function assertPackageName(value: string): string {
  const packageName = value.trim();
  if (!PACKAGE_NAME.test(packageName)) throw new Error("Invalid Android package name");
  return packageName;
}
