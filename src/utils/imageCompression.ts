import imageCompression from 'browser-image-compression';

export const compressImage = async (file: File, maxSizeMB: number = 0.8): Promise<File> => {
    // If it's not an image, return original file
    if (!file.type.startsWith('image/')) {
        return file;
    }

    const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
        fileType: file.type,
    };

    try {
        const compressedBlob = await imageCompression(file, options);
        // Convert Blob back to File with original name and type
        return new File([compressedBlob], file.name, { 
            type: file.type,
            lastModified: Date.now() 
        });
    } catch (error) {
        return file;
    }
};
