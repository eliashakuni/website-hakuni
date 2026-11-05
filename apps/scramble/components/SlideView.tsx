import { ViewTransition, type ReactNode } from "react";

/** Must wrap each page rather than the layout: layouts persist, so they never enter or exit. */
export function SlideView({ children }: { children: ReactNode }) {
  return (
    <ViewTransition enter="slide-view" exit="slide-view" default="none">
      <div className="screen-frame">{children}</div>
    </ViewTransition>
  );
}
