import { StorageService } from './storage.service';
import { SupabaseProvider } from './providers/supabase.provider';
import { CloudinaryProvider } from './providers/cloudinary.provider';
import { AwsProvider } from './providers/aws.provider';
import 'dotenv/config'

export function createStorageService() {
  const providers = [];

  // ordre = priorité (important pour fallback)
  if (process.env.SUPABASE_URL) {
    console.log("utilisation de superbase")
    providers.push(new SupabaseProvider());
    console.log("utilisation reussi")
  }

  if (process.env.CLOUDINARY_CLOUD_NAME) {
    providers.push(new CloudinaryProvider());
  }

  if (process.env.AWS_BUCKET) {
    providers.push(new AwsProvider());
  }

  

  return new StorageService(providers);
}