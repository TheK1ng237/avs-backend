function decodePath(value: string): string | null {
  try {
    return value
      .split('/')
      .map((segment) => decodeURIComponent(segment))
      .join('/');
  } catch {
    return null;
  }
}

export function extractStorageKeyFromUrl(publicUrl: string): string | null {
  let url: URL;
  try {
    url = new URL(publicUrl);
  } catch {
    return null;
  }

  const supabaseMarker = '/storage/v1/object/public/';
  const supabaseIndex = url.pathname.indexOf(supabaseMarker);
  if (supabaseIndex !== -1) {
    const bucketAndKey = url.pathname.slice(supabaseIndex + supabaseMarker.length);
    const separatorIndex = bucketAndKey.indexOf('/');
    if (separatorIndex !== -1) {
      return decodePath(bucketAndKey.slice(separatorIndex + 1));
    }
    return null;
  }

  const firebaseMarker = '/o/';
  const firebaseIndex = url.pathname.indexOf(firebaseMarker);
  if (url.hostname === 'firebasestorage.googleapis.com' && firebaseIndex !== -1) {
    return decodePath(url.pathname.slice(firebaseIndex + firebaseMarker.length));
  }

  const cloudinaryMarker = '/upload/';
  const cloudinaryIndex = url.pathname.indexOf(cloudinaryMarker);
  if (url.hostname.endsWith('cloudinary.com') && cloudinaryIndex !== -1) {
    const path = url.pathname.slice(cloudinaryIndex + cloudinaryMarker.length);
    const key = path.replace(/^v\d+\//, '');
    const decodedKey = decodePath(key);
    return decodedKey?.replace(/\.[^.]+$/, '') ?? null;
  }

  if (url.hostname.includes('.s3.') || url.hostname.endsWith('.amazonaws.com')) {
    return decodePath(url.pathname.replace(/^\/+/, ''));
  }

  return null;
}
