import { useEffect, useState } from "react";
import { fetchPhotoBlob } from "../lib/api.ts";

interface Props {
  r2Key: string;
  alt: string;
  className?: string;
}

export function AuthedImage({ r2Key, alt, className }: Props) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let url: string | null = null;
    let cancelled = false;
    setError(false);
    setSrc(null);

    fetchPhotoBlob(r2Key)
      .then((u) => {
        if (cancelled) {
          URL.revokeObjectURL(u);
          return;
        }
        url = u;
        setSrc(u);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [r2Key]);

  if (error) {
    return (
      <div
        className={`${className ?? ""} bg-[--color-surface-3] flex items-center justify-center text-[--color-text-muted] text-xs`}
      >
        falha
      </div>
    );
  }

  if (!src) {
    return (
      <div
        className={`${className ?? ""} bg-[--color-surface-3] animate-pulse`}
      />
    );
  }

  return <img src={src} alt={alt} className={className} loading="lazy" />;
}
