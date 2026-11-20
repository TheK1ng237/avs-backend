import { StorageService } from './storage.service';
import { SupabaseProvider } from './providers/supabase.provider';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { AwsProvider } from './providers/aws.provider';
import 'dotenv/config';

export function createStorageService() {
  const providerName = process.env.STORAGE_PROVIDER?.trim().toLowerCase();
  const providers = [];

  if (providerName && !['supabase', 'cloudinary', 's3', 'aws'].includes(providerName)) {
    throw new Error(
      `STORAGE_PROVIDER="${providerName}" is unsupported. Use "supabase", "cloudinary" or "s3".`,
    );
  }

  // An explicit provider is authoritative. Without one, retain the legacy
  // priority order for existing deployments.
  if (!providerName || providerName === 'supabase') {
    if (!providerName && !process.env.SUPABASE_URL) {
      // Continue with the legacy fallback providers.
    } else {
      providers.push(new SupabaseProvider());
    }
  }

  if (!providerName && process.env.CLOUDINARY_CLOUD_NAME) {
    providers.push(new CloudinaryProvider());
  } else if (providerName === 'cloudinary') {
    providers.push(new CloudinaryProvider());
  }

  if (!providerName && process.env.AWS_BUCKET) {
    providers.push(new AwsProvider());
  } else if (providerName === 's3' || providerName === 'aws') {
    providers.push(new AwsProvider());
  }

  return new StorageService(providers);
}