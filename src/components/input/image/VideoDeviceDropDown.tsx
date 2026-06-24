import {useCallback, useEffect, useId, useMemo, useRef, useState} from "react";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";

export type VideoDeviceChangeHandler = (camera: MediaDeviceInfo | null, selectionKind?: 'initial' | 'user' | 'system') => void | Promise<void>;

export interface VideoDeviceDropDownProps {
    cameraDevices: MediaDeviceInfo[];
    initialCamera?: string | MediaDeviceInfo;
    allowCameraNone?: boolean;
    disabled?: boolean;
    onCameraChange?: VideoDeviceChangeHandler;
}

type CameraChangeResult =
    | {succeeded: true; camera: MediaDeviceInfo | null}
    | {succeeded: false};

export function VideoDeviceDropDown({cameraDevices, initialCamera, disabled, allowCameraNone, onCameraChange}:VideoDeviceDropDownProps) {
    const cameraMap = useMemo(() => {
        return new Map<string, MediaDeviceInfo>(
            cameraDevices.map((device): [string, MediaDeviceInfo] => [device.deviceId, device]),
        );
    }, [cameraDevices]);
    const labelId = useId();

    const initCameraSelected = useRef(false);
    const [selectedCamera, setSelectedCamera] = useState<MediaDeviceInfo | null>(null);

    const requestCameraChange = useCallback(async (id: string, selectionKind?: 'initial' | 'user' | 'system'): Promise<CameraChangeResult> => {
        const selCam = cameraMap.get(id) ?? null;

        try {
            if (onCameraChange) {
                await onCameraChange(selCam, selectionKind);
            }
            return {succeeded: true, camera: selCam};
        } catch (reason: unknown) {
            console.error(`[VDDD] Camera Selection Failed (${selectionKind ?? 'unknown'}):`, reason);
            return {succeeded: false};
        }
    }, [cameraMap, onCameraChange]);

    const handleCameraChange = useCallback(async (id: string, selectionKind?: 'initial' | 'user' | 'system') => {
        const result = await requestCameraChange(id, selectionKind);
        if (result.succeeded) {
            setSelectedCamera(result.camera);
        }
    }, [requestCameraChange]);

    useEffect(() => {
        if (!initCameraSelected.current) {
            if (cameraDevices.length === 0) {
                console.warn('[VDDD] No Camera Devices Found');
                return;
            }

            const initCameraId = (typeof initialCamera === 'string')
                ? initialCamera
                : initialCamera?.deviceId;

            const initCamera = initCameraId && cameraMap.has(initCameraId)
                ? initCameraId
                : (allowCameraNone ? '' : cameraDevices[0].deviceId);

            initCameraSelected.current = true;
            void requestCameraChange(initCamera, 'initial')
                .then((result) => {
                    if (!result.succeeded) {
                        initCameraSelected.current = false;
                        return;
                    }
                    setSelectedCamera(result.camera);
                    console.log(`[VDDD] Initial Camera Selection Complete: ${cameraMap.get(initCamera)?.label ?? 'None'}`);
                });
            return;
        }

        const selectedCameraId = selectedCamera?.deviceId ?? '';
        const selectionIsValid = selectedCameraId === ''
            ? allowCameraNone === true || cameraDevices.length === 0
            : cameraMap.has(selectedCameraId);

        if (selectionIsValid) {
            return;
        }

        const fallbackCameraId = allowCameraNone || cameraDevices.length === 0
            ? ''
            : cameraDevices[0].deviceId;

        void requestCameraChange(fallbackCameraId, 'system')
            .then((result) => {
                if (result.succeeded) {
                    setSelectedCamera(result.camera);
                }
            });
    }, [cameraDevices, cameraMap, initialCamera, allowCameraNone, requestCameraChange, selectedCamera])

    return (
        <FormControl size="small" sx={{flexGrow: 1, minWidth: '175px', width: '100%'}}>
            <InputLabel id={labelId} shrink>Camera</InputLabel>
            <Select
                label="Camera"
                labelId={labelId}
                disabled={disabled === true || cameraDevices.length === 0}
                displayEmpty={allowCameraNone}
                size="small"
                renderValue={selected => selected === ''
                    ? 'Select a Camera'
                    : cameraMap.get(selected)?.label ?? 'Select a Camera'}
                value={selectedCamera?.deviceId ?? ''}
                onChange={e => {void handleCameraChange(e.target.value, 'user');}}>
                {allowCameraNone && <MenuItem key="" value="">None</MenuItem>}
                {cameraDevices.map(device => (
                    <MenuItem key={device.deviceId} value={device.deviceId}>{device.label}</MenuItem>
                ))}
            </Select>
        </FormControl>
    );
}
