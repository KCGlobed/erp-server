import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import { Readable } from 'stream';

@Injectable()
export class GcsService {
  private readonly storage: Storage;
  private readonly bucketName: string;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    this.bucketName = config.get<string>('GCS_BUCKET_NAME', '');
    const projectId = config.get<string>('GCS_PROJECT_ID', '');
    const keyFilename = config.get<string>('GCS_KEY_FILE', '');

    if (this.bucketName && projectId) {
      this.storage = new Storage({
        projectId,
        ...(keyFilename ? { keyFilename } : {}),
      });
      this.enabled = true;
    } else {
      this.enabled = false;
    }
  }

  /**
   * Uploads a profile image (photo or banner) directly from the backend to GCS.
   */
  async uploadProfileImage(
    userId: string,
    buffer: Buffer,
    mimetype: string,
    type: 'photo' | 'banner',
  ): Promise<string> {
    if (!this.enabled) {
      throw new InternalServerErrorException(
        'GCS not configured. Set GCS_BUCKET_NAME and GCS_PROJECT_ID environment variables.',
      );
    }

    const ext = mimetype.split('/')[1] || 'jpg';
    const filename = `profiles/${userId}-${type}-${Date.now()}.${ext}`;
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filename);

    const stream = file.createWriteStream({
      metadata: { contentType: mimetype },
      resumable: false,
    });

    await new Promise<void>((resolve, reject) => {
      const readable = Readable.from(buffer);
      readable.pipe(stream).on('finish', resolve).on('error', reject);
    });

    return `https://storage.googleapis.com/${this.bucketName}/${filename}`;
  }

  /**
   * Generates a signed URL for temporary access to a private object.
   */
  async getSignedUrl(urlOrFilename: string): Promise<string | null> {
    if (!urlOrFilename || !this.enabled) return urlOrFilename || null;

    try {
      // Extract filename if a full Google Cloud Storage URL was provided
      const prefix = `https://storage.googleapis.com/${this.bucketName}/`;
      let filename = urlOrFilename;
      if (urlOrFilename.startsWith(prefix)) {
        filename = urlOrFilename.substring(prefix.length);
      } else if (urlOrFilename.startsWith('http')) {
        // If it's a different external URL, return it as-is
        return urlOrFilename;
      }

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(filename);

      const [url] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000, // 15 minutes
      });
      
      return url;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return urlOrFilename; // Fallback to returning the original path/url
    }
  }
}
