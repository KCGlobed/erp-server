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
   * (Currently bypassed to return the public URL directly)
   */
  async getSignedUrl(urlOrFilename: string): Promise<string | null> {
    if (!urlOrFilename) return null;

    // If it's already a full HTTP URL, just return it directly.
    // If we only have a filename, we construct the public Google Cloud Storage URL.
    if (urlOrFilename.startsWith('http')) {
      return urlOrFilename;
    }

    return `https://storage.googleapis.com/${this.bucketName}/${urlOrFilename}`;
  }
}
