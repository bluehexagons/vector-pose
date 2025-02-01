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
    const loadImage = async () => {
      try {
        const relativePath = uri;
        const fullPath = await window.native.fs.resolveGamePath(
          gameDirectory,
          relativePath
        );
        const buffer = await window.native.fs.readFile(fullPath);
        const blob = new Blob([buffer], {type: 'image/png'});
        const blobUrl = URL.createObjectURL(blob);
        setImageSrc(blobUrl);
        onLoad?.();
      } catch (err) {
        console.error('Failed to load image:', uri, err);
        onError?.(err as Error);
      }
    };

    loadImage();

    return () => {
      if (imageSrc) {
        URL.revokeObjectURL(imageSrc);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uri, gameDirectory]);

  if (!imageSrc) {
    return null;
  }

  return <img src={imageSrc} className={className} style={style} />;
};
