import {stopVideoStream} from "./Utilities";

async function getVideoDevices() {
    console.log('[VD] Enumerating video devices');
    let defaultStream: MediaStream | null = null;
    try {
        defaultStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices
            .filter(mdi => {
                const isInputDevice = typeof InputDeviceInfo !== 'undefined' && mdi instanceof InputDeviceInfo;
                console.log(`[VD]   >> Found Media Device: ${JSON.stringify(mdi)} (${isInputDevice ? 'InputDeviceInfo' : 'MediaDeviceInfo'})`);
                return mdi.kind === 'videoinput';
            });
    } finally {
        console.log('[VD] Finished enumerating video devices; stopping default stream');
        stopVideoStream(defaultStream);
    }
}

type VideoDeviceState = 'none' | 'initializing' | 'ready';

let state: VideoDeviceState = 'none';
let devicesPromise: Promise<MediaDeviceInfo[]> | null = null;
let isWatchingDeviceChanges = false;
const deviceChangeListeners = new Set<() => void>();

function loadDevices(): Promise<MediaDeviceInfo[]> {
    console.log('[VD] VideoDevices initializing...');
    state = 'initializing';

    const pendingDevices = getVideoDevices()
        .then((devices) => {
            if (devicesPromise === pendingDevices) {
                state = 'ready';
                console.log('[VD] VideoDevices initialized');
            }
            return devices;
        }, (reason: unknown) => {
            if (devicesPromise === pendingDevices) {
                state = 'none';
                devicesPromise = null;
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

    navigator.mediaDevices.addEventListener('devicechange', () => {
        devicesPromise = null;
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

    if (devicesPromise !== null) {
        console.log(`[VD] VideoDevices is already ${state}`);
    }

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
    refreshDevices,
    subscribe,
    get state() {
        return state;
    },
};
