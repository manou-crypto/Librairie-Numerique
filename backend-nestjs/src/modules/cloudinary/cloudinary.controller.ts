import { Controller, Get, Post, Body } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';

@Controller(['api/v1/cloudinary', 'api/cloudinary'])
export class CloudinaryController {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  @Post('signature')
  createSignature(@Body() body: any) {
    const paramsToSign = body?.paramsToSign || body || {};
    return this.cloudinaryService.getSignature(paramsToSign);
  }

  @Get('signature')
  getSignature() {
    return this.cloudinaryService.getSignature();
  }
}
