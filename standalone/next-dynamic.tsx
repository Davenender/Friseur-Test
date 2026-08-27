"use client";

/**
 * Ersatz für `next/dynamic` im Einzeldatei-Build.
 *
 * Die App lädt die 3D-Ansicht über `next/dynamic`, damit sie im Next.js-Build
 * nicht auf dem Server gerendert wird. Außerhalb von Next.js gibt es kein
 * Server-Rendering – hier genügt React.lazy mit derselben Aufrufsignatur.
 */

import { Suspense, lazy, type ComponentType, type ReactNode } from "react";

interface DynamicOptions {
  ssr?: boolean;
  loading?: () => ReactNode;
}

export default function dynamic<P extends object>(
  loader: () => Promise<ComponentType<P>>,
  options: DynamicOptions = {},
): ComponentType<P> {
  const Loaded = lazy(() => loader().then((component) => ({ default: component })));
  const Loading = options.loading;

  return function DynamicComponent(props: P) {
    return (
      <Suspense fallback={Loading ? <Loading /> : null}>
        <Loaded {...props} />
      </Suspense>
    );
  };
}
