import {stopVideoStream} from "./Utilities";

export function isCameraCaptureSupported(): boolean {
    const { mediaDevices } = globalThis.navigator as Partial<Pick<Navigator, 'mediaDevices'>>;

    return mediaDevices !== undefined &&
        typeof mediaDevices.getUserMedia === 'function' &&
        typeof mediaDevices.enumerateDevices === 'function' &&
        typeof globalThis.ImageCapture === 'function' &&
        typeof globalThis.createImageBitmap === 'function';
}

function getMediaDevices(): MediaDevices {
    const { mediaDevices } = globalThis.navigator as Partial<Pick<Navigator, 'mediaDevices'>>;

    if (!isCameraCaptureSupported() || mediaDevices === undefined) {
        throw new Error('Camera capture is not supported by this browser');
    }

    return mediaDevices;
}

async function getVideoDevices() {
    const mediaDevices = getMediaDevices();
    let defaultStream: MediaStream | null = null;
    try {
        defaultStream = await mediaDevices.getUserMedia({ video: true });
        const devices = await mediaDevices.enumerateDevices();
        return devices
            .filter(mdi => {
                return mdi.kind === 'videoinput';
            });
    } finally {
        stopVideoStream(defaultStream);
    }
}

type VideoDeviceState = 'none' | 'initializing' | 'ready';

let state: VideoDeviceState = 'none';
let devicesPromise: Promise<MediaDeviceInfo[]> | null = null;
let cachedDevices: MediaDeviceInfo[] | null = null;
let isWatchingDeviceChanges = false;
const deviceChangeListeners = new Set<() => void>();

function loadDevices(): Promise<MediaDeviceInfo[]> {
    state = 'initializing';

    const pendingDevices = getVideoDevices()
        .then((devices) => {
            if (devicesPromise === pendingDevices) {
                state = 'ready';
                cachedDevices = devices;
            }
            return devices;
        }, (reason: unknown) => {
            if (devicesPromise === pendingDevices) {
                state = 'none';
                devicesPromise = null;
                cachedDevices = null;
            }
            throw reason instanceof Error
                ? reason
                : new Error('Unable to initialize video devices', { cause: reason });
        });

    devicesPromise = pendingDevices;
    return pendingDevices;
}

function waitForDevices(pendingDevices: Promise<MediaDeviceInfo[]>, abortSignal?: AbortSignal): Promise<MediaDeviceInfo[]> {
    if (abortSignal?.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }

    let abortHandler: () => void;
    const abortHandlerProvider = (reject: (reason?: unknown) => void) => {
        abortHandler = () => { reject(new DOMException('Aborted', 'AbortError')); };
        return abortHandler;
    };

    return new Promise<MediaDeviceInfo[]>((resolve, reject) => {
        abortSignal?.addEventListener('abort', abortHandlerProvider(reject));

        pendingDevices.then(resolve, reject);
    }).finally(() => abortSignal?.removeEventListener('abort', abortHandler));
}

function watchDeviceChanges() {
    if (isWatchingDeviceChanges) {
        return;
    }

    const { mediaDevices } = globalThis.navigator as Partial<Pick<Navigator, 'mediaDevices'>>;
    if (mediaDevices === undefined || typeof mediaDevices.addEventListener !== 'function') {
        isWatchingDeviceChanges = true;
        return;
    }

    mediaDevices.addEventListener('devicechange', () => {
        devicesPromise = null;
        cachedDevices = null;
        state = 'none';
        deviceChangeListeners.forEach(listener => { listener(); });
    });
    isWatchingDeviceChanges = true;
}

function getDevices(abortSignal?: AbortSignal): Promise<MediaDeviceInfo[]> {
    if (abortSignal?.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }

    watchDeviceChanges();

    return waitForDevices(devicesPromise ?? loadDevices(), abortSignal);
}

function refreshDevices(abortSignal?: AbortSignal): Promise<MediaDeviceInfo[]> {
    if (abortSignal?.aborted) {
        return Promise.reject(new DOMException('Aborted', 'AbortError'));
    }

    watchDeviceChanges();
    return waitForDevices(loadDevices(), abortSignal);
}

function subscribe(listener: () => void): () => void {
    deviceChangeListeners.add(listener);
    return () => { deviceChangeListeners.delete(listener); };
}

export const VideoDevices = {
    getDevices,
    getCachedDevices: () => cachedDevices,
    refreshDevices,
    subscribe,
    get state() {
        return state;
    },
};
