import {fileReadToUrl, type FileWithDataUrl} from "./FileUtils";

export const stopVideoStream = (stream?: MediaStream | null) => {
    if (!stream) {
        return;
    }
    stream.getVideoTracks().forEach(t => { t.stop(); });
}

export const canvasToBlob = (canvas: OffscreenCanvas | HTMLCanvasElement, options?: ImageEncodeOptions): Promise<Blob> => {
    if ('convertToBlob' in canvas) {
        return canvas.convertToBlob(options);
    }

    return new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob === null) {
                reject(new Error("Canvas.toBlob returned null blob"));
            } else {
                resolve(blob);
            }
        }, options?.type, options?.quality);
    });
}

export const canvasToFile = async (canvas: OffscreenCanvas | HTMLCanvasElement, name = "imageCapture"): Promise<FileWithDataUrl> => {
    const blob = await canvasToBlob(canvas, {type: 'image/jpeg', quality: 1});
    return fileReadToUrl(new File([blob], `${name}.jpg`, {type: blob.type, lastModified: Date.now()}));
}

export type CanvasProvider = (w: number, h:number) => OffscreenCanvas;
export const CanvasProviderDefault: CanvasProvider = (w, h) => new OffscreenCanvas(w, h);
