import { useEffect, useState } from "react";
import { VideoDevices } from "./support/VideoDevices";

export interface UseMediaDeviceInfosReturn {
    status: 'loading' | 'complete' | 'error'
    message: string
    cameraDevices: MediaDeviceInfo[]
}

function completeState(devices: MediaDeviceInfo[]): UseMediaDeviceInfosReturn {
    return {
        status: 'complete',
        message: devices.length === 0
            ? 'No cameras available'
            : `Found ${devices.length.toString()} camera(s)`,
        cameraDevices: devices,
    };
}

function loadingState(): UseMediaDeviceInfosReturn {
    return { status: 'loading', message: '', cameraDevices: [] };
}

export function useMediaDeviceInfos(): UseMediaDeviceInfosReturn {
    const [state, setState] = useState<UseMediaDeviceInfosReturn>(() => {
        const cachedDevices = VideoDevices.getCachedDevices();
        return cachedDevices === null ? loadingState() : completeState(cachedDevices);
    });

    useEffect(() => {
        let currentController: AbortController | null = null;

        const loadDevices = () => {
            currentController?.abort();
            const controller = new AbortController();
            currentController = controller;

            const cachedDevices = VideoDevices.getCachedDevices();
            setState(cachedDevices === null ? loadingState() : completeState(cachedDevices));

            void VideoDevices.getDevices(controller.signal)
                .then((devices) => {
                    if (controller.signal.aborted) {
                        return;
                    }

                    setState(completeState(devices));
                })
                .catch((reason: unknown) => {
                    if (controller.signal.aborted) {
                        return;
                    }

                    const message = reason instanceof Error
                        ? reason.message
                        : 'Unable to enumerate camera devices';
                    setState({ status: 'error', message: `Error: ${message}`, cameraDevices: [] });
                });
        };

        const unsubscribe = VideoDevices.subscribe(loadDevices);
        loadDevices();

        return () => {
            unsubscribe();
            currentController?.abort();
        };
    }, []);

    return state;
}
