import type {AspectRatio} from "./AspectRatio";
import {CanvasProvider, CanvasProviderDefault, canvasToFile} from "./Utilities";

export interface Rect { x: number, y: number, w: number, h: number };
export interface CanvasDrawOptions {
    autoCropAspectRation?: AspectRatio,
}

export class CapturedImage {
    private _bitmap: ImageBitmap | null;

    constructor(bitmap: ImageBitmap) {
        this._bitmap = bitmap;
    }

    private getBitmap(): ImageBitmap {
        if (this._bitmap === null) {
            throw new Error('Captured image no longer owns an ImageBitmap');
        }
        return this._bitmap;
    }

    async toFile(name?: string, ar?: AspectRatio) {
        const canvas = this.drawToCanvas(CanvasProviderDefault, { autoCropAspectRation: ar });
        return canvasToFile(canvas, name);
    }

    getCropRect(ar: AspectRatio): Rect {
        const bitmap = this.getBitmap();
        const bmpAr = bitmap.width / bitmap.height;
        if (bmpAr > ar.ratio) {
            // Original is wider, crop sides
            const newWidth = ar.calcWidth(bitmap.height)
            return {
                x: (bitmap.width - newWidth) / 2,
                y: 0,
                w: newWidth,
                h: bitmap.height
            } satisfies Rect;
        } else {
            // Original is taller, crop top and bottom
            const newHeight = ar.calcHeight(bitmap.width);
            return {
                x: 0,
                y: (bitmap.height - newHeight) / 2,
                w: bitmap.width,
                h: newHeight
            } satisfies Rect;
        }
    }

    drawToCanvas(canvas: OffscreenCanvas | HTMLCanvasElement | CanvasProvider = CanvasProviderDefault, {autoCropAspectRation}: CanvasDrawOptions = { }): OffscreenCanvas | HTMLCanvasElement {
        const bitmap = this.getBitmap();
        const { x, y, w, h } = autoCropAspectRation
            ? this.getCropRect(autoCropAspectRation)
            : { x: 0, y: 0, w: bitmap.width, h: bitmap.height };

        const cnv = typeof canvas === 'function'
            ? canvas(w, h)
            : canvas;
        cnv.width = w;
        cnv.height = h;

        const ctx = 'convertToBlob' in cnv
            ? cnv.getContext('2d')
            : cnv.getContext('2d');
        if (ctx === null) {
            throw new Error("Cannot get Canvas Context for OffscreenCanvas");
        }
        this.render(ctx, x, y, w, h, 0, 0, w, h);
        return cnv;
    }

    render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, dx: number, dy: number): void;
    render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, dx: number, dy: number, dw: number, dh: number): void;
    render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number): void;
    render(ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D, sx = 0, sy = 0, sw: number = this.getBitmap().width, sh: number = this.getBitmap().height, dx = 0, dy = 0, dw: number = ctx.canvas.width, dh: number = ctx.canvas.height) {
        ctx.drawImage(this.getBitmap(), sx, sy, sw, sh, dx, dy, dw, dh);
    }

    transferTo(ctx: ImageBitmapRenderingContext): void {
        ctx.transferFromImageBitmap(this.getBitmap());
        this._bitmap = null;
    }

    close() {
        this._bitmap?.close();
        this._bitmap = null;
    }
}
