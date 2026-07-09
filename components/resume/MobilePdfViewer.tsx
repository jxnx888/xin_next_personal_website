'use client';

import { useEffect, useRef, useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

export default function MobilePdfViewer({ pdfUrl }: { pdfUrl: string }) {
  const [numPages, setNumPages] = useState(0);
  const [loadFailed, setLoadFailed] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.clientWidth);
    };
    update();
    window.addEventListener('resize', update, { passive: true });
    return () => window.removeEventListener('resize', update);
  }, []);

  return (
    <div ref={containerRef} className="p-2 flex flex-col" role="region" aria-label="Resume PDF viewer">
      <Document
        file={pdfUrl}
        onLoadSuccess={({ numPages }) => setNumPages(numPages)}
        onLoadError={() => setLoadFailed(true)}
        loading={
          <div className="flex justify-center py-16">
            <div
              className="w-8 h-8 rounded-full border-2 animate-spin"
              style={{ borderColor: 'var(--accent-dim)', borderTopColor: 'var(--accent)' }}
            />
          </div>
        }
      >
        {loadFailed ? (
          <p className="p-8 text-center text-sm" style={{ color: 'var(--text-muted)' }}>
            Could not load PDF.{' '}
            <a href={pdfUrl} download className="underline" style={{ color: 'var(--accent)' }}>
              Download instead
            </a>
          </p>
        ) : (
          Array.from({ length: numPages }, (_, i) => (
            <Page
              key={i + 1}
              pageNumber={i + 1}
              width={containerWidth > 0 ? Math.min(containerWidth - 16, 794) : undefined}
              className="mb-2 last:mb-0"
            />
          ))
        )}
      </Document>
    </div>
  );
}
