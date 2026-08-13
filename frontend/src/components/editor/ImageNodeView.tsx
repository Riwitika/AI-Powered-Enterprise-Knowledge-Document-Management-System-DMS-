import { useCallback, useEffect, useRef, useState } from 'react';
import { NodeViewWrapper, type NodeViewProps } from '@tiptap/react';
import {
  IMAGE_SPACING_MARGIN,
  PAGE_CONTENT_WIDTH,
  type ImageAlign,
  type ImageBorderStyle,
  type ImageSpacing,
} from './imageConstants';
import { loadAuthenticatedImageSrc, revokeAuthenticatedImageSrc } from './authenticatedImage';

function parsePx(value?: string | number | null): number | null {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return value;
  const match = String(value).match(/([\d.]+)/);
  return match ? parseFloat(match[1]) : null;
}

function buildImageStyle(attrs: Record<string, unknown>): React.CSSProperties {
  const width = parsePx(attrs.width as string | number | null);
  const height = parsePx(attrs.height as string | number | null);
  const borderStyle = (attrs.borderStyle as ImageBorderStyle) || 'none';
  const borderWidth = attrs.borderWidth ? `${attrs.borderWidth}px` : '0';
  const borderColor = (attrs.borderColor as string) || '#000000';
  const borderRadius = (attrs.borderRadius as string) || '0';
  const spacing = (attrs.spacing as ImageSpacing) || 'medium';
  const marginValue = IMAGE_SPACING_MARGIN[spacing] ?? IMAGE_SPACING_MARGIN.medium;

  const style: React.CSSProperties = {
    maxWidth: '100%',
    height: height ? `${height}px` : 'auto',
    objectFit: 'contain',
    display: 'block',
    borderRadius,
    marginTop: marginValue,
    marginBottom: marginValue,
  };

  if (width) {
    style.width = `${Math.min(width, PAGE_CONTENT_WIDTH)}px`;
  }

  if (borderStyle !== 'none' && borderWidth !== '0px') {
    style.borderStyle = borderStyle;
    style.borderWidth = borderWidth;
    style.borderColor = borderColor;
  } else {
    style.border = 'none';
  }

  return style;
}

function wrapperStyle(align: ImageAlign): React.CSSProperties {
  return {
    textAlign: align,
    width: '100%',
    maxWidth: `${PAGE_CONTENT_WIDTH}px`,
    lineHeight: 0,
  };
}

export default function ImageNodeView(props: NodeViewProps) {
  const { node, selected, updateAttributes } = props;
  const imgRef = useRef<HTMLImageElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [displaySrc, setDisplaySrc] = useState<string>('');
  const [naturalSize, setNaturalSize] = useState<{ width: number; height: number } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
    ratio: number;
  } | null>(null);

  const attrs = node.attrs;
  const align = (attrs.align as ImageAlign) || 'center';
  const src = attrs.src as string;

  useEffect(() => {
    let cancelled = false;
    loadAuthenticatedImageSrc(src)
      .then((resolved) => {
        if (!cancelled) setDisplaySrc(resolved);
      })
      .catch(() => {
        if (!cancelled) setDisplaySrc(src);
      });
    return () => {
      cancelled = true;
    };
  }, [src]);

  useEffect(() => {
    return () => revokeAuthenticatedImageSrc(src);
  }, [src]);

  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });

    const currentWidth = parsePx(attrs.width as string | number | null);
    if (!currentWidth && img.naturalWidth > 0) {
      const initialWidth = Math.min(img.naturalWidth, PAGE_CONTENT_WIDTH);
      const ratio = img.naturalHeight / img.naturalWidth;
      updateAttributes({
        width: Math.round(initialWidth),
        height: Math.round(initialWidth * ratio),
        layoutReady: true,
      });
    } else if (!attrs.layoutReady) {
      updateAttributes({ layoutReady: true });
    }
  }, [attrs.width, attrs.layoutReady, updateAttributes]);

  const onResizeStart = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const img = imgRef.current;
      if (!img) return;

      const rect = img.getBoundingClientRect();
      const startWidth = rect.width;
      const startHeight = rect.height;
      resizeRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        startWidth,
        startHeight,
        ratio: startHeight / startWidth || 1,
      };

      const onMove = (moveEvent: MouseEvent) => {
        const state = resizeRef.current;
        if (!state) return;
        const deltaX = moveEvent.clientX - state.startX;
        let nextWidth = Math.max(40, Math.round(state.startWidth + deltaX));
        nextWidth = Math.min(nextWidth, PAGE_CONTENT_WIDTH);
        const nextHeight = Math.round(nextWidth * state.ratio);
        updateAttributes({ width: nextWidth, height: nextHeight });
      };

      const onUp = () => {
        resizeRef.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [updateAttributes],
  );

  const width = parsePx(attrs.width as string | number | null);
  const height = parsePx(attrs.height as string | number | null);

  return (
    <NodeViewWrapper
      as="div"
      className={`tiptap-image-node ${selected ? 'is-selected' : ''}`}
      data-drag-handle
      style={wrapperStyle(align)}
    >
      <div ref={wrapperRef} className="tiptap-image-inner" contentEditable={false}>
        <img
          ref={imgRef}
          src={displaySrc || undefined}
          alt={attrs.alt as string | undefined}
          style={buildImageStyle(attrs)}
          draggable={false}
          onLoad={handleImageLoad}
        />
        {selected && (
          <>
            <div className="tiptap-image-selection-ring" />
            <div
              className="tiptap-image-resize-handle tiptap-image-resize-se"
              onMouseDown={onResizeStart}
            />
            <div className="tiptap-image-dimensions">
              {Math.round(width || naturalSize?.width || 0)} × {Math.round(height || naturalSize?.height || 0)}
            </div>
          </>
        )}
      </div>
    </NodeViewWrapper>
  );
}
