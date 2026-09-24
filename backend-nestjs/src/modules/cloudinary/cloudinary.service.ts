import { Injectable } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
  }

  getSignature(paramsToSign?: Record<string, any>) {
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiSecret) {
      throw new Error('CLOUDINARY_API_SECRET non configuré dans les variables d\'environnement');
    }

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
