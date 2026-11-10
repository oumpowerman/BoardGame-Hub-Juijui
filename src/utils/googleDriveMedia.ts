/**
 * Parses Google Drive sharing URLs or File IDs and generates direct image / video preview links
 * supporting automatic looping video previews.
 */
export function parseGoogleDriveUrl(inputUrl: string): {
  isDrive: boolean;
  fileId: string | null;
  directImageUrl: string;
  directVideoUrl: string;
  originalUrl: string;
} {
  const trimmed = (inputUrl || '').trim();
  if (!trimmed) {
    return {
      isDrive: false,
      fileId: null,
      directImageUrl: '',
      directVideoUrl: '',
      originalUrl: '',
    };
  }

  let fileId: string | null = null;

  // Pattern 1: /file/d/FILE_ID/view
  const matchFileD = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (matchFileD && matchFileD[1]) {
    fileId = matchFileD[1];
  }

  // Pattern 2: ?id=FILE_ID or &id=FILE_ID
  if (!fileId) {
    const matchIdParam = trimmed.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (matchIdParam && matchIdParam[1]) {
      fileId = matchIdParam[1];
    }
  }

  // Pattern 3: /d/FILE_ID (e.g. lh3.google.com/u/0/d/FILE_ID)
  if (!fileId) {
    const matchDPath = trimmed.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (matchDPath && matchDPath[1]) {
      fileId = matchDPath[1];
    }
  }

  // Pattern 4: Raw file ID if alphanumeric & length >= 20 without spaces/slashes
  if (!fileId && /^[a-zA-Z0-9_-]{20,}$/.test(trimmed)) {
    fileId = trimmed;
  }

  const isDrive = Boolean(fileId);
  const directImageUrl = fileId
    ? `https://lh3.googleusercontent.com/d/${fileId}`
    : trimmed;
  const directVideoUrl = fileId
    ? `https://drive.google.com/uc?export=download&id=${fileId}`
    : trimmed;

  return {
    isDrive,
    fileId,
    directImageUrl,
    directVideoUrl,
    originalUrl: trimmed,
  };
}

/**
 * Reusable Media Component that automatically renders either a looping video or an image
 * with resilient fallback support, supporting Google Drive URLs.
 */
export interface GoogleDriveMediaPreviewProps {
  url: string;
  alt: string;
  className?: string;
  isVideo?: boolean;
}
