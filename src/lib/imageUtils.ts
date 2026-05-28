
/**
 * Utility to compress images on the client side before uploading to the server.
 * This helps save storage space and improves upload speed for users.
 */

interface CompressionOptions {
    maxSizeMB?: number;
    maxWidthOrHeight?: number;
    initialQuality?: number;
}

export const compressImage = async (file: File, options: CompressionOptions = {}): Promise<File | Blob> => {
    const {
        maxSizeMB: _maxSizeMB = 1,
        maxWidthOrHeight = 1600,
        initialQuality = 0.7
    } = options;

    // Only compress images
    if (!file.type.startsWith('image/')) {
        return file;
    }

    // Don't compress if it's already small enough (less than 500KB)
    if (file.size < 500 * 1024) {
        return file;
    }

    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target?.result as string;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                // Calculate new dimensions while maintaining aspect ratio
                if (width > height) {
                    if (width > maxWidthOrHeight) {
                        height *= maxWidthOrHeight / width;
                        width = maxWidthOrHeight;
                    }
                } else {
                    if (height > maxWidthOrHeight) {
                        width *= maxWidthOrHeight / height;
                        height = maxWidthOrHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                if (!ctx) {
                    resolve(file);
                    return;
                }

                ctx.drawImage(img, 0, 0, width, height);

                // Convert canvas to blob
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            resolve(file);
                            return;
                        }

                        // If the compressed blob is actually larger than original (rare but possible), return original
                        if (blob.size > file.size) {
                            resolve(file);
                        } else {
                            // Create a new file from the blob to preserve filename
                            const compressedFile = new File([blob], file.name, {
                                type: 'image/jpeg',
                                lastModified: Date.now(),
                            });
                            resolve(compressedFile);
                        }
                    },
                    'image/jpeg',
                    initialQuality
                );
            };
            img.onerror = (err) => reject(err);
        };
        reader.onerror = (err) => reject(err);
    });
};
