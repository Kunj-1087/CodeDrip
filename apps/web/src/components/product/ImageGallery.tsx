'use client';
import { useState } from 'react';
import type { ProductImage } from '@/types';

export function ImageGallery({ images, name }: { images: ProductImage[]; name: string }) {
  const list = images.length > 0 ? images : [{ id: 'ph', url: '/uploads/placeholder.png', altText: name, sortOrder: 0, isPrimary: true }];
  const [active, setActive] = useState(0);

  return (
    <div>
      <div className="card aspect-square overflow-hidden bg-surface-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={list[active].url} alt={list[active].altText || name} className="h-full w-full object-cover" />
      </div>
      {list.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {list.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setActive(i)}
              aria-label={`View image ${i + 1}`}
              className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${i === active ? 'border-primary' : 'border-border'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt={img.altText || `${name} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
