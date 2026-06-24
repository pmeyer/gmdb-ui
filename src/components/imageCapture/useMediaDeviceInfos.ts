import { useEffect, useState } from "react";
import { VideoDevices } from "./support/VideoDevices";

export interface UseMediaDeviceInfosReturn {
    status: 'loading' | 'complete' | 'error'
    message: string
    cameraDevices: MediaDeviceInfo[]
}

export function useMediaDeviceInfos(): UseMediaDeviceInfosReturn {
    const [state, setState] = useState<UseMediaDeviceInfosReturn>({
        status: 'loading',
        message: '',
        cameraDevices: [],
    });

    useEffect(() => {
        let currentController: AbortController | null = null;

        const loadDevices = () => {
            currentController?.abort();
            const controller = new AbortController();
            currentController = controller;
            setState({ status: 'loading', message: '', cameraDevices: [] });

            void VideoDevices.getDevices(controller.signal)
                .then((devices) => {
                    if (controller.signal.aborted) {
                        return;
                    }

                    setState({
                        status: 'complete',
                        message: devices.length === 0
                            ? 'No cameras available'
                            : `Found ${devices.length.toString()} camera(s)`,
                        cameraDevices: devices,
                    });
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
