import React, { useLayoutEffect, useRef } from 'react';

/**
 * Text that shrinks its font-size until it fits the fixed width/height of its box.
 * The parent style must give the box a width (and a height for multiline).
 */
export default function FitText({ children, max, min = 14, multiline = false, className = '', style = {} }) {
  const ref = useRef(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let size = max;
    el.style.fontSize = size + 'px';
    while (size > min && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) {
      size -= 1;
      el.style.fontSize = size + 'px';
    }
  }, [children, max, min, multiline]);
  return (
    <div
      ref={ref}
      className={className}
      style={{ overflow: 'hidden', whiteSpace: multiline ? 'normal' : 'nowrap', fontSize: max, ...style }}
    >
      {children}
    </div>
  );
}
