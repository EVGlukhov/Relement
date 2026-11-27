export type CSSModuleClasses = Readonly<Record<string, string>>;

const cssByClassName = new Map<string, string>();

export function registerCSSModule<T extends CSSModuleClasses>(
  classes: T,
  cssText: string,
): T {
  for (const value of Object.values(classes)) {
    for (const className of value.split(/\s+/).filter(Boolean)) {
      const existingCSS = cssByClassName.get(className);

      if (existingCSS !== undefined && existingCSS !== cssText) {
        throw new Error(
          `CSS class "${className}" is registered more than once.`,
        );
      }

      cssByClassName.set(className, cssText);
    }
  }

  return classes;
}

export function getCSSForClassNames(classNames: string): string[] {
  const stylesheets = new Set<string>();

  for (const className of classNames.split(/\s+/).filter(Boolean)) {
    const cssText = cssByClassName.get(className);

    if (cssText !== undefined) {
      stylesheets.add(cssText);
    }
  }

  return [...stylesheets];
}
