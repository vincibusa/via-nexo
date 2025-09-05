import { useEffect, RefObject } from "react";

/**
 * Hook for auto-resizing textarea elements based on their content
 */
export const useAutoResize = (
  textareaRef: RefObject<HTMLTextAreaElement | null>,
  value: string,
  minRows = 1,
  maxRows = 4
) => {
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = "auto";

    // Calculate line height (approximate)
    const computedStyle = window.getComputedStyle(textarea);
    const lineHeight =
      parseInt(computedStyle.lineHeight) ||
      parseInt(computedStyle.fontSize) * 1.2;

    // Calculate min and max heights
    const minHeight =
      lineHeight * minRows +
      (parseInt(computedStyle.paddingTop) +
        parseInt(computedStyle.paddingBottom));
    const maxHeight =
      lineHeight * maxRows +
      (parseInt(computedStyle.paddingTop) +
        parseInt(computedStyle.paddingBottom));

    // Set the height based on content, respecting min/max constraints
    const newHeight = Math.min(
      Math.max(textarea.scrollHeight, minHeight),
      maxHeight
    );
    textarea.style.height = `${newHeight}px`;

    // Set overflow based on whether we've hit the max height
    textarea.style.overflowY =
      textarea.scrollHeight > maxHeight ? "auto" : "hidden";
  }, [value, minRows, maxRows, textareaRef]);
};
