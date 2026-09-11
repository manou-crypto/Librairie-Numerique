'use client';
import React, { useState } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { UploadCloud, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface CloudinaryUploadWidgetProps {
  onUploadSuccess: (url: string) => void;
  folder?: string;
}

export default function CloudinaryUploadWidget({
  onUploadSuccess,
  folder = 'librairie',
}: CloudinaryUploadWidgetProps) {
  const [isUploading, setIsUploading] = useState(false);

  return (
    <CldUploadWidget
      signatureEndpoint="/api/cloudinary/signature"
      options={{
        folder: folder,
        multiple: true,
        maxFiles: 5,
        clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp', 'avif'],
      }}
      onSuccess={(result: any) => {
        if (result?.info?.secure_url) {
          onUploadSuccess(result.info.secure_url);
          toast.success('Image téléchargée avec succès');
        }
      }}
      onError={(error) => {
        console.error("Erreur d'upload", error);
        toast.error("Erreur lors de l'upload de l'image");
      }}
      onOpen={() => setIsUploading(true)}
      onClose={() => setIsUploading(false)}
    >
      {({ open }) => {
        return (
          <button
            type="button"
            onClick={() => {
              if (typeof open === 'function') {
                open();
              } else {
                console.error(
                  'Cloudinary widget failed to load. Check NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_API_KEY env vars.'
                );
                toast.error(
                  "Le widget d'upload n'a pas pu se charger. Vérifiez la configuration Cloudinary."
                );
              }
            }}
            disabled={isUploading}
            className="flex items-center gap-2 border px-4 py-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <UploadCloud className="w-4 h-4" />
            )}
            Ajouter des images
          </button>
        );
      }}
    </CldUploadWidget>
  );
}
