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
   * Generates a signed URL for a client to upload a file directly to GCS.
   * Limits upload size to 5MB.
   */
  async generateUploadSignedUrl(
    filename: string,
    contentType: string,
  ): Promise<{ signedUrl: string; publicUrl: string }> {
    if (!this.enabled) {
      throw new InternalServerErrorException(
        'GCS not configured. Set GCS_BUCKET_NAME and GCS_PROJECT_ID environment variables.',
      );
    }

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filename);

    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'write',
      expires: expiresAt,
      contentType,
      extensionHeaders: {
        'x-goog-content-length-range': '0,5242880', // 5MB limit
      },
    });

    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${filename}`;

    return { signedUrl, publicUrl };
  }
}
