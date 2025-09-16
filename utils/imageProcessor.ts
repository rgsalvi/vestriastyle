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
            faceDetection.SupportedModels.BlazeFace,
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