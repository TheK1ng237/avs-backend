import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';
import { IStorageProvider } from '../storage.interface';
import { v4 as uuid } from 'uuid';

let firebaseInitialized = false;

const serviceAccountEnv = process.env.FIREBASE_SERVICE_ACCOUNT;
const firebaseBucketEnv = process.env.FIREBASE_BUCKET;

if (serviceAccountEnv && firebaseBucketEnv) {
  try {
    const serviceAccount = JSON.parse(serviceAccountEnv);
    // Protect against double initialization in some environments
    if (!getApps().length) {
      initializeApp({
        credential: cert(serviceAccount),
        storageBucket: firebaseBucketEnv,
      });
    }
    firebaseInitialized = true;
  } catch (err) {
    // Avoid crashing startup on empty/invalid JSON; log for debugging instead
    // eslint-disable-next-line no-console
    console.error('FIREBASE_SERVICE_ACCOUNT is set but contains invalid JSON:', err);
    firebaseInitialized = false;
  }
} else {
  // Not configured — leave firebaseInitialized false
}

export class FirebaseProvider implements IStorageProvider {
  private bucket = firebaseInitialized ? getStorage().bucket() : null;

  constructor() {
    if (!firebaseInitialized) {
      throw new Error('FirebaseProvider: FIREBASE_SERVICE_ACCOUNT and FIREBASE_BUCKET must be set to use Firebase storage');
    }
  }

  async upload(file: Express.Multer.File) {
    const key = `patterns/${uuid()}-${file.originalname}`;
    const fileUpload = this.bucket!.file(key);

    await fileUpload.save(file.buffer, {
      contentType: file.mimetype,
      resumable: false,
    });

    const url = await fileUpload.getSignedUrl({
      action: 'read',
      expires: '03-01-2030',
    });

    return {
      url: url[0],
      key,
      provider: 'firebase',
    };
  }

  async delete(key: string) {
    await this.bucket!.file(key).delete();
  }

  async download(key: string) {
    const [content] = await this.bucket!.file(key).download();
    return content;
  }
}