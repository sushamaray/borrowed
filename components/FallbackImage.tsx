"use client";

import Image, { type ImageProps } from "next/image";
import { useState } from "react";

const DEFAULT_PLACEHOLDER_SRC = "/placeholder.png";

type FallbackImageProps = Omit<ImageProps, "src" | "alt"> & {
  src?: string | null;
  alt: string;
  fallbackSrc?: string;
};

export default function FallbackImage({
  src,
  alt,
  fallbackSrc = DEFAULT_PLACEHOLDER_SRC,
  onError,
  unoptimized,
  ...props
}: FallbackImageProps) {
  const normalizedSrc = src?.trim() || fallbackSrc;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const currentSrc = normalizedSrc === failedSrc ? fallbackSrc : normalizedSrc;

  return (
    <Image
      {...props}
      src={currentSrc}
      alt={alt}
      unoptimized={unoptimized ?? true}
      onError={(event) => {
        onError?.(event);
        if (currentSrc !== fallbackSrc) {
          setFailedSrc(currentSrc);
        }
      }}
    />
  );
}
