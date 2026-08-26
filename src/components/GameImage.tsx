import React, {useEffect, useState} from 'react';

interface GameImageProps {
  uri: string;
  gameDirectory: string;
  className?: string;
  style?: React.CSSProperties;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

export const GameImage: React.FC<GameImageProps> = ({
  uri,
  gameDirectory,
  className,
  style,
  onLoad,
  onError,
}) => {
  const [imageSrc, setImageSrc] = useState('');

  useEffect(() => {
    let blobUrl: string | undefined;
    let canceled = false;

    // Do not keep showing a revoked URL while the replacement image loads.
    // oxlint-disable-next-line react/set-state-in-effect -- reset stale async image state.
    setImageSrc('');

    const loadImage = async () => {
      try {
        const relativePath = uri;
        const fullPath = await window.native.fs.resolveGamePath(
          gameDirectory,
          relativePath
        );
        const buffer = await window.native.fs.readFile(fullPath);
        const extension = relativePath
          .toLowerCase()
          .match(/\.(png|jpe?g|webp)$/)?.[1];
        const mimeType =
          extension === 'jpg' || extension === 'jpeg'
            ? 'image/jpeg'
            : extension === 'webp'
              ? 'image/webp'
              : 'image/png';
        const blob = new Blob([Uint8Array.from(buffer)], {type: mimeType});
        blobUrl = URL.createObjectURL(blob);
        if (canceled) {
          URL.revokeObjectURL(blobUrl);
          return;
        }
        setImageSrc(blobUrl);
        onLoad?.();
      } catch (err) {
        console.error('Failed to load image:', uri, err);
        onError?.(err instanceof Error ? err : new Error(String(err)));
      }
    };

    void loadImage();

    return () => {
      canceled = true;
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [gameDirectory, onError, onLoad, uri]);

  if (!imageSrc) {
    return null;
  }

  return (
    <img
      src={imageSrc}
      alt={uri}
      draggable={false}
      className={className}
      style={style}
    />
  );
};
