import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { compressImage } from '../lib/imageUtils';
import { useToast } from '../context/ToastContext';

export interface UploadOptions {
  bucket?: string;
  compress?: boolean;
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

/**
 * Custom hook to upload files securely to Supabase Storage with optional client-side image compression.
 */
export const useFileUpload = (defaultOptions: UploadOptions = {}) => {
  const { addToast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const uploadFile = async (
    file: File,
    customPath?: string,
    options: UploadOptions = {}
  ): Promise<{ publicUrl: string; filePath: string }> => {
    const bucket = options.bucket || defaultOptions.bucket || 'documents';
    const shouldCompress = options.compress !== false && defaultOptions.compress !== false;
    const maxSizeMB = options.maxSizeMB || defaultOptions.maxSizeMB || 1;
    const maxWidthOrHeight = options.maxWidthOrHeight || defaultOptions.maxWidthOrHeight || 1600;

    setIsUploading(true);
    try {
      // 1. Process/Compress if it is an image and size exceeds 500KB (auto-handled in compressImage)
      let processedFile: File | Blob = file;
      if (shouldCompress && file.type.startsWith('image/')) {
        try {
          processedFile = await compressImage(file, { maxSizeMB, maxWidthOrHeight });
        } catch (compressionErr) {
          console.warn('Erro ao comprimir imagem, enviando arquivo original:', compressionErr);
        }
      }

      // 2. Generate custom unique filepath if not specified
      const finalPath = customPath || `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;

      // 3. Upload directly to Supabase storage
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(finalPath, processedFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // 4. Retrieve and return the public URL
      const { data } = supabase.storage.from(bucket).getPublicUrl(finalPath);
      if (!data?.publicUrl) {
        throw new Error('Falha ao gerar URL pública do arquivo.');
      }

      return {
        publicUrl: data.publicUrl,
        filePath: finalPath
      };
    } catch (err: any) {
      const errMsg = err.message || 'Erro desconhecido.';
      addToast(`Falha no upload do arquivo: ${errMsg}`, 'error');
      throw err;
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadFile,
    isUploading
  };
};
