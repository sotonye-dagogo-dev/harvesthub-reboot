/**
 * Review Photo Gallery Component
 *
 * Features:
 * - Display review photos in a grid
 * - Click to view full-size images
 * - Lightbox gallery view
 */

"use client";

import { useState } from "react";
import { Image } from "antd";

interface ReviewPhotoGalleryProps {
  photos: string[];
  maxDisplay?: number;
}

export function ReviewPhotoGallery({ photos, maxDisplay = 4 }: ReviewPhotoGalleryProps) {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!photos || photos.length === 0) {
    return null;
  }

  const displayPhotos = photos.slice(0, maxDisplay);
  const remainingCount = photos.length - maxDisplay;

  const handlePhotoClick = (index: number) => {
    setCurrentIndex(index);
    setVisible(true);
  };

  return (
    <>
      <div className="flex flex-wrap gap-2 mt-3">
        {displayPhotos.map((photo, index) => (
          <div
            key={index}
            onClick={() => handlePhotoClick(index)}
            className="relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer hover:opacity-80 transition-opacity border border-gray-200 dark:border-gray-700"
          >
            <Image
              src={photo}
              alt={`Review photo ${index + 1}`}
              preview={false}
              className="w-full h-full object-cover"
            />

            {index === maxDisplay - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center">
                <span className="text-white font-semibold">+{remainingCount}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Gallery */}
      <div style={{ display: "none" }}>
        <Image.PreviewGroup
          preview={{
            visible,
            onVisibleChange: setVisible,
            current: currentIndex,
          }}
        >
          {photos.map((photo, index) => (
            <Image key={index} src={photo} alt={`Review photo ${index + 1}`} />
          ))}
        </Image.PreviewGroup>
      </div>
    </>
  );
}
