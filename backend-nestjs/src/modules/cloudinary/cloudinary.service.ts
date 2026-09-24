import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'gbb7huxa',
      api_key: process.env.CLOUDINARY_API_KEY || '959631882842267',
      api_secret: process.env.CLOUDINARY_API_SECRET || 'fpn9r0P2DIHxZWWz9k1E5wYSOX8',
    });
  }

  getSignature(paramsToSign?: Record<string, any>) {
    const apiSecret = process.env.CLOUDINARY_API_SECRET || 'fpn9r0P2DIHxZWWz9k1E5wYSOX8';

    const params = paramsToSign && Object.keys(paramsToSign).length > 0
      ? paramsToSign
      : { timestamp: Math.round(new Date().getTime() / 1000) };

    const signature = cloudinary.utils.api_sign_request(params, apiSecret);

    return { signature, ...params };
  }

  async deleteImage(publicId: string) {
    return new Promise((resolve, reject) => {
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) return reject(error);
        resolve(result);
      });
    });
  }
}
