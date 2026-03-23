'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useRef, Suspense } from 'react';

function EditorOverlayInner() {
  const searchParams = useSearchParams();
  const isEditor = searchParams.get('editor') === 'true';
  const selectedRef = useRef<number | null>(null);
  const labelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isEditor) return;

    // Hide any fixed/sticky headers and footers that might interfere with clicking
    document.body.style.cursor = 'default';

    // Create floating label element
    const label = document.createElement('div');
    label.style.cssText = 'position:fixed;top:0;left:0;z-index:99999;pointer-events:none;opacity:0;transition:opacity 0.15s;background:#008060;color:#fff;font-size:12px;font-weight:600;padding:4px 10px;border-radius:0 0 6px 0;font-family:system-ui,sans-serif;white-space:nowrap;';
    document.body.appendChild(label);
    labelRef.current = label;

    // Listen for messages from parent editor
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === 'select-section') {
        selectSection(e.data.index);
      }
      if (e.data?.type === 'deselect') {
        clearSelection();
      }
      if (e.data?.type === 'scroll-to-section') {
        const el = document.querySelector(`[data-section-index="${e.data.index}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function selectSection(index: number) {
      clearSelection();
      selectedRef.current = index;
      const el = document.querySelector(`[data-section-index="${index}"]`) as HTMLElement | null;
      if (el) {
        el.style.outline = '2px solid #008060';
        el.style.outlineOffset = '-2px';
        el.setAttribute('data-selected', 'true');
      }
    }

    function clearSelection() {
      selectedRef.current = null;
      document.querySelectorAll('[data-selected="true"]').forEach((el) => {
        (el as HTMLElement).style.outline = 'none';
        el.removeAttribute('data-selected');
      });
    }

    // Add interaction handlers to sections
    const sections = document.querySelectorAll<HTMLElement>('[data-section-index]');

    sections.forEach((section) => {
      section.style.cursor = 'pointer';
      section.style.transition = 'outline 0.15s';

      section.addEventListener('mouseenter', () => {
        const idx = parseInt(section.getAttribute('data-section-index') || '-1');
        if (idx !== selectedRef.current) {
          section.style.outline = '2px dashed #008060';
          section.style.outlineOffset = '-2px';
        }
        // Show label
        const name = section.getAttribute('data-section-name') || '';
        const rect = section.getBoundingClientRect();
        if (label) {
          label.textContent = name;
          label.style.top = `${Math.max(0, rect.top)}px`;
          label.style.left = `${rect.left}px`;
          label.style.opacity = '1';
        }
      });

      section.addEventListener('mouseleave', () => {
        const idx = parseInt(section.getAttribute('data-section-index') || '-1');
        if (idx !== selectedRef.current) {
          section.style.outline = 'none';
        }
        if (label) label.style.opacity = '0';
      });

      section.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const index = parseInt(section.getAttribute('data-section-index') || '0');
        const name = section.getAttribute('data-section-name') || '';
        selectSection(index);
        window.parent.postMessage({ type: 'section-clicked', index, name }, '*');
      });
    });

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      if (label.parentNode) label.parentNode.removeChild(label);
    };
  }, [isEditor]);

  return null;
}

export default function EditorOverlay() {
  return (
    <Suspense fallback={null}>
      <EditorOverlayInner />
    </Suspense>
  );
}
