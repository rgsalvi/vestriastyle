import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgl';
import * as faceDetection from '@tensorflow-models/face-detection';

let model: faceDetection.FaceDetector | null = null;
let modelLoadingPromise: Promise<faceDetection.FaceDetector> | null = null;

const PIXELATION_FACTOR = 0.07; // Lower is more pixelated

async function getModel(): Promise<faceDetection.FaceDetector> {
  if (model) {
    return model;
  }
  if (modelLoadingPromise) {
    return modelLoadingPromise;
  }
  
  modelLoadingPromise = new Promise(async (resolve, reject) => {
    try {
        await tf.setBackend('webgl');
        const detector = await faceDetection.createDetector(
            faceDetection.SupportedModels.MediaPipeFaceDetector,
            { runtime: 'tfjs', maxFaces: 10 }
        );
        model = detector;
        resolve(detector);
    } catch (error) {
        console.error("Error loading face detection model:", error);
        reject(error);
    } finally {
        modelLoadingPromise = null;
    }
  });

  return modelLoadingPromise;
}

const canvasToFile = (canvas: HTMLCanvasElement, originalFile: File): Promise<File> => {
    return new Promise((resolve) => {
        canvas.toBlob(
            (blob) => {
                if (blob) {
                    resolve(new File([blob], originalFile.name, { type: 'image/jpeg' }));
                } else {
                    // Fallback to original file if blob creation fails
                    resolve(originalFile);
                }
            },
            'image/jpeg',
            0.92 // quality
        );
    });
};

export const anonymizeImage = async (file: File): Promise<File> => {
    try {
        const detector = await getModel();
        const image = await createImageBitmap(file);

        const faces = await detector.estimateFaces(image, { flipHorizontal: false });

        if (faces.length === 0) {
            return file; // No faces detected, return original file
        }

        const canvas = document.createElement('canvas');
        canvas.width = image.width;
        canvas.height = image.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return file;

        // Draw original image
        ctx.drawImage(image, 0, 0);

        // Pixelate faces
        faces.forEach(face => {
            const { xMin, yMin, width, height } = face.box;
            
            // Calculate size of pixelation blocks
            const pixelatedWidth = Math.max(1, Math.floor(width * PIXELATION_FACTOR));
            const pixelatedHeight = Math.max(1, Math.floor(height * PIXELATION_FACTOR));

            // Draw a small version of the face area onto the canvas
            ctx.drawImage(canvas, xMin, yMin, width, height, xMin, yMin, pixelatedWidth, pixelatedHeight);

            // Stretch the small version back to the original size, creating the pixelation effect
            ctx.imageSmoothingEnabled = false;
            ctx.drawImage(canvas, xMin, yMin, pixelatedWidth, pixelatedHeight, xMin, yMin, width, height);
            ctx.imageSmoothingEnabled = true;
        });

        // Clean up memory
        image.close();

        return await canvasToFile(canvas, file);

    } catch (error) {
        console.error("Failed to anonymize image, returning original:", error);
        return file; // Return original file on error
    }
};

export const resizeImageToDataUrl = async (file: File, maxSize = 512, quality = 0.85): Promise<string> => {
    const img = await createImageBitmap(file);
    const canvas = document.createElement('canvas');
    const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
    canvas.width = Math.max(1, Math.floor(img.width * scale));
    canvas.height = Math.max(1, Math.floor(img.height * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return await fileToDataUrl(file);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    img.close();
    return dataUrl;
};

const fileToDataUrl = (file: File): Promise<string> => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
});

export async function dataUrlToWebP(dataUrl: string, targetWidth: number, targetHeight: number, quality = 0.9): Promise<string> {
    // Draw input to canvas then export as WebP at desired size
    const blob = await (await fetch(dataUrl)).blob();
    const bmp = await createImageBitmap(blob);
    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
        bmp.close();
        return dataUrl; // fallback
    }
    // Fit image within target bounds, preserving aspect ratio and centering
    const scale = Math.min(targetWidth / bmp.width, targetHeight / bmp.height);
    const drawW = Math.floor(bmp.width * scale);
    const drawH = Math.floor(bmp.height * scale);
    const dx = Math.floor((targetWidth - drawW) / 2);
    const dy = Math.floor((targetHeight - drawH) / 2);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, targetWidth, targetHeight);
    ctx.drawImage(bmp, dx, dy, drawW, drawH);
    const out = canvas.toDataURL('image/webp', quality);
    bmp.close();
    return out;
}

// Crop to upper body for top-only try-on preview.
// Strategy: Attempt face detection to anchor the crop; fallback to cropping the top ~60% of the image.
export async function cropToUpperBody(dataUrl: string): Promise<string> {
    try {
        const blob = await (await fetch(dataUrl)).blob();
        const bmp = await createImageBitmap(blob);
        let x = 0, y = 0, w = bmp.width, h = Math.floor(bmp.height * 0.6);
        try {
            const detector = await getModel();
            const faces = await detector.estimateFaces(bmp as any, { flipHorizontal: false });
            if (faces && faces.length > 0) {
                // Use the largest face (closest subject)
                const face = faces.sort((a,b) => (b.box.width*b.box.height) - (a.box.width*a.box.height))[0];
                const fx = Math.max(0, Math.floor(face.box.xMin));
                const fy = Math.max(0, Math.floor(face.box.yMin));
                const fw = Math.floor(face.box.width);
                const fh = Math.floor(face.box.height);
                // Define an upper-body crop window based on face box
                const top = Math.max(0, fy - Math.floor(fh * 0.6));
                const left = Math.max(0, fx - Math.floor(fw * 1.0));
                const right = Math.min(bmp.width, fx + Math.floor(fw * 2.0));
                const bottom = Math.min(bmp.height, fy + Math.floor(fh * 4.0));
                x = left;
                y = top;
                w = Math.max(1, right - left);
                h = Math.max(1, bottom - top);
            }
        } catch {
            // fall back to default crop defined above
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            bmp.close();
            return dataUrl;
        }
        ctx.drawImage(bmp, x, y, w, h, 0, 0, w, h);
        const out = canvas.toDataURL('image/webp', 0.92);
        bmp.close();
        return out;
    } catch {
        return dataUrl;
    }
}

// Crop to lower body for bottom-only try-on preview.
export async function cropToLowerBody(dataUrl: string): Promise<string> {
    try {
        const blob = await (await fetch(dataUrl)).blob();
        const bmp = await createImageBitmap(blob);
        let x = 0, y = Math.floor(bmp.height * 0.35), w = bmp.width, h = Math.floor(bmp.height * 0.65);
        try {
            const detector = await getModel();
            const faces = await detector.estimateFaces(bmp as any, { flipHorizontal: false });
            if (faces && faces.length > 0) {
                // Use face position to infer torso start; crop from just below torso to feet
                const face = faces.sort((a,b) => (b.box.width*b.box.height) - (a.box.width*a.box.height))[0];
                const fy = Math.max(0, Math.floor(face.box.yMin));
                const fh = Math.floor(face.box.height);
                const top = Math.min(bmp.height - 1, fy + Math.floor(fh * 3.0));
                y = Math.max(0, top);
                x = 0;
                w = bmp.width;
                h = Math.max(1, bmp.height - y);
            }
        } catch {
            // fallback keeps defaults
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            bmp.close();
            return dataUrl;
        }
        ctx.drawImage(bmp, x, y, w, h, 0, 0, w, h);
        const out = canvas.toDataURL('image/webp', 0.92);
        bmp.close();
        return out;
    } catch {
        return dataUrl;
    }
}

// Convert any input data URL to a PNG base64 (no data URL prefix) for chat compatibility
export async function dataUrlToPNGBase64(dataUrl: string): Promise<string> {
    try {
        const blob = await (await fetch(dataUrl)).blob();
        const bmp = await createImageBitmap(blob);
        const canvas = document.createElement('canvas');
        canvas.width = bmp.width;
        canvas.height = bmp.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            bmp.close();
            return dataUrl.split(',')[1] || '';
        }
        ctx.drawImage(bmp, 0, 0);
        const pngDataUrl = canvas.toDataURL('image/png');
        bmp.close();
        return pngDataUrl.split(',')[1] || '';
    } catch {
        return dataUrl.split(',')[1] || '';
    }
}