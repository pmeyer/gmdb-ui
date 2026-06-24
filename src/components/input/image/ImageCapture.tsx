import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select from "@mui/material/Select";
import Slide from "@mui/material/Slide";
import Stack from "@mui/material/Stack";
import {styled} from "@mui/material/styles";
import {ReactEventHandler, useCallback, useEffect, useId, useMemo, useRef, useState} from "react";
import _ from "lodash";
import CameraAltTwoTone from "@mui/icons-material/CameraAltTwoTone";
import CheckTwoTone from "@mui/icons-material/CheckTwoTone";
import Clear from "@mui/icons-material/Clear";
import RedoTwoTone from "@mui/icons-material/RedoTwoTone";
import VideoSettingsTwoTone from "@mui/icons-material/VideoSettingsTwoTone";
import {ZoomFab, SemiTransparentZoomFab} from "../util/ZoomFab";
import {useImageCapture, useMediaDeviceInfos, AspectRatio, AspectRatioNames, AspectRatios, CapturedImage, VideoStream} from "../../imageCapture";
import {MiniControlDrawer} from "../util/MiniControlDrawer";
import {VideoDeviceDropDown} from "./VideoDeviceDropDown";
import type {VideoDeviceChangeHandler} from "./VideoDeviceDropDown"; 

interface ImageCaptureProps {
    width: number;
    initialAspectRatio: AspectRatioNames;
    initialCamera?: string | MediaDeviceInfo;
    allowAspectRatioChange?: boolean;
    allowCameraNone?: boolean;
    onCapture: (capture: CapturedImage) => void;
    onCameraSelected?: (deviceId: string) => void;
    onClose?: () => void;
    onError?: (error: Error) => void;
}

const StyledVideo = styled('video')(() => ({
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover'
}));

export function ImageCapture({width, initialAspectRatio, initialCamera, allowAspectRatioChange, allowCameraNone, onCapture, onCameraSelected, onClose, onError}: ImageCaptureProps) {
    const aspectRatioLabelId = useId();
    const {cameraDevices, message: cameraDevicesMessage, status: cameraDevicesStatus} = useMediaDeviceInfos();
    const [videoStream, setVideoStream] = useState<VideoStream|null>(null);
    const {takePhoto, takeResult, status: captureState, error: captureError} = useImageCapture(videoStream);

    const [aspectRatioKey, setAspectRatioKey] = useState<AspectRatioNames>(initialAspectRatio);
    const [videoState, setVideoState] = useState<'idle' | 'loading' | 'playing'>('idle');

    const aspectRatio = useMemo(() => AspectRatios[aspectRatioKey], [aspectRatioKey]);
    const [drawerOpen, setDrawerOpen] = useState(false);

    const [mode, setMode] = useState<'capture' | 'preview'>('capture');
    const [capturedImage, setCapturedImage] = useState<CapturedImage|null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);

    const setVideoElementSource = useCallback((vs: VideoStream | null) => {
        const mediaStream = vs?.stream ?? null;
        if (videoRef.current && videoRef.current.srcObject !== mediaStream) {
            videoRef.current.srcObject = mediaStream;
            setVideoState(mediaStream ? 'loading' : 'idle');
        }
    }, []);

    const handleCameraDeviceChange = useCallback<VideoDeviceChangeHandler>(async (device, selectionKind ) => {
        let vs: VideoStream | null = null;
        if (device) {
            setVideoState('loading');
            try {
                vs = await VideoStream.forDevice(device);
                await vs.setMaxWidth(aspectRatio);
                await vs.getImageCapture().takePhoto();
            } catch(reason: unknown) {
                const error = reason instanceof Error
                    ? reason
                    : new Error('Unable to initialize video stream');
                vs?.stop();
                setVideoState(videoStream ? 'playing' : 'idle');
                onError?.(error);
                throw error;
            }
        }
        setVideoElementSource(vs);
        setVideoStream(vs);
        if (device?.deviceId) {
            onCameraSelected?.(device.deviceId);
        }
        setDrawerOpen(selectionKind === 'initial' && device === null);
    }, [aspectRatio, onCameraSelected, onError, setVideoElementSource, videoStream]);

    const handleAspectRatioChange = useCallback(async (newAspectRatio: AspectRatioNames) => {
        const nextAspectRatio = AspectRatios[newAspectRatio];
        setDrawerOpen(false);

        if (videoStream === null) {
            setAspectRatioKey(newAspectRatio);
            return;
        }

        const previousVideoState = videoState;
        setVideoState('loading');

        try {
            await videoStream.setMaxWidth(nextAspectRatio);
            setAspectRatioKey(newAspectRatio);
        } catch (reason: unknown) {
            const error = reason instanceof Error
                ? reason
                : new Error('Unable to change camera aspect ratio');
            onError?.(error);
        } finally {
            setVideoState(previousVideoState);
        }
    }, [onError, videoState, videoStream]);

    const handleVideoPlay = useCallback<ReactEventHandler<HTMLVideoElement>>(() => {
        setVideoState('playing');
    }, []);

    const handleCameraClick = useCallback(async () => {
        const capture = await takePhoto();
        if (capture !== null) {
            setCapturedImage(capture);
            setMode('preview');
        }
    }, [takePhoto]);

    const handleCaptureAccepted = useCallback(() => {
        const acceptedCapture = takeResult();

        if (acceptedCapture !== null) {
            onCapture(acceptedCapture);
        }
    }, [onCapture, takeResult]);

    useEffect(() => {
        return () => {
            videoStream?.stop();
        }
    }, [videoStream]);

    useEffect(() => {
        if (cameraDevicesStatus === 'error') {
            onError?.(new Error(cameraDevicesMessage || 'Unable to access camera devices'));
            return;
        }

        if (cameraDevicesStatus === 'complete' && cameraDevices.length === 0) {
            onError?.(new Error('No camera devices are available'));
        }
    }, [cameraDevices.length, cameraDevicesMessage, cameraDevicesStatus, onError]);

    useEffect(() => {
        if (captureState === 'error' && captureError !== null) {
            onError?.(captureError);
        }
    }, [captureError, captureState, onError]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) {
            return;
        }

        if (mode === 'preview') {
            video.pause();
            return;
        }

        if (video.srcObject !== null) {
            void video.play()
                .catch((reason: unknown) => {
                    const error = reason instanceof Error
                        ? reason
                        : new Error('Unable to resume camera preview');
                    onError?.(error);
                });
        }
    }, [mode, onError])

    const [container, setContainer] = useState<HTMLDivElement | null>(null);

    return (
        <Box ref={setContainer} sx={{overflow: 'hidden', position: 'relative', width: '100%', aspectRatio: aspectRatio.ratio}}>
            <Slide in={mode=='capture'} direction="right" container={container} appear={false}>
                <Box sx={{p: '0!important', position: 'absolute', inset: 0}}>
                    <Box sx={{width: '100%', height: '100%', lineHeight: 0}}>
                        <StyledVideo ref={videoRef} autoPlay playsInline muted sx={{backgroundColor: t => t.palette.grey[300]}}
                                     onPlay={handleVideoPlay} />
                    </Box>
                    <Stack direction="column" 
                        sx={{ 
                            alignItems: 'center', 
                            justifyContent: 'space-between', 
                            position: 'absolute', 
                            left: 0, top: 0, right: 0, bottom: 0, p: 1
                        }}>
                        <Stack direction="row" spacing={0} sx={{width: '100%', alignItems: 'flex-start'}}>
                            <MiniControlDrawer
                                spacing={2}
                                open={drawerOpen}
                                keepMounted
                                toggleIcon={<VideoSettingsTwoTone />}
                                toggleTooltip={!drawerOpen ? (<>
                                    <div>Camera: {(videoStream?.label ?? 'None')}</div>
                                    {allowAspectRatioChange && <div>Aspect Ratio: {aspectRatio.commonName}</div>}
                                </>) : undefined}
                                toggleLabel="Image Capture Settings"
                                onToggle={() => {setDrawerOpen(p => !p);}}>

                                <VideoDeviceDropDown cameraDevices={cameraDevices}
                                                     allowCameraNone={allowCameraNone}
                                                     initialCamera={initialCamera}
                                                     disabled={videoState === 'loading' || cameraDevicesStatus !== 'complete' || captureState === 'busy'}
                                                     onCameraChange={handleCameraDeviceChange}
                                                     />

                                {allowAspectRatioChange &&
                                    <FormControl size="small" sx={{minWidth: '175px'}}>
                                        <InputLabel id={aspectRatioLabelId}>Aspect Ratio</InputLabel>
                                        <Select
                                            label="Aspect Ratio"
                                            labelId={aspectRatioLabelId}
                                            disabled={videoState === 'loading' || cameraDevicesStatus !== 'complete' || captureState === 'busy'}
                                            sx={{minWidth: '150px'}}
                                            size="small"
                                            value={aspectRatioKey}
                                            onChange={e => {void handleAspectRatioChange(e.target.value);}}
                                        >
                                            {_.map(AspectRatios, (ratio, key) => (
                                                <MenuItem key={key} value={key}>{ratio.commonName}</MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>}
                            </MiniControlDrawer>
                            {onClose && !drawerOpen && <Box sx={{pt: 1, pr: 1}}>
                                <SemiTransparentZoomFab aria-label="Close image capture" show={!drawerOpen} size="small" onClick={onClose} color="error.dark">
                                    <Clear/>
                                </SemiTransparentZoomFab>
                            </Box>
                            }
                        </Stack>
                        <Stack sx={{flexGrow: 1, width: '100%', alignItems: 'center', justifyContent: 'center'}}>
                            {videoState === 'loading' && <CircularProgress size={width/4} enableTrackSlot thickness={5} color="info"/>}
                        </Stack>
                        <Stack direction="row" sx={{width: '100%', justifyContent: 'center'}}>
                            <ZoomFab aria-label="Capture image"
                                     show
                                     disabled={captureState === 'busy' || videoState !== 'playing'}
                                     size="medium"
                                     color="error"
                                     variant="extended"
                                     onClick={() => {void handleCameraClick();}}
                                     sx={{
                                         "&.Mui-disabled": {
                                             backgroundColor: t => captureState === 'busy' ? t.palette.error.dark : undefined,
                                             color: t => captureState === 'busy' ? t.palette.error.contrastText : undefined,
                                         }
                                     }}
                            >
                                {captureState !== 'busy' &&
                                    <CameraAltTwoTone fontSize="large" sx={{mr: 1, ml: 1}} />}
                                {captureState === 'busy' &&
                                    <Box sx={{display: 'flex', mr: 1, ml: 1}}>
                                        <CircularProgress color="inherit" thickness={5} enableTrackSlot size="2rem" />
                                    </Box>}
                            </ZoomFab>
                        </Stack>
                    </Stack>
                </Box>
            </Slide>
            {capturedImage !== null &&
                <Slide in={mode=='preview'} direction="left" container={container}>
                    <Box sx={{ position: 'absolute', inset: 0}}>
                        <ImageCapturePreview capture={capturedImage} aspectRatio={aspectRatio}/>
                        <Stack direction="column-reverse" 
                            sx={{
                                alignItems: 'center', 
                                justifyContent: 'space-between', 
                                position: 'absolute', 
                                left: 0, top: 0, right: 0, bottom: 0, p: 1
                            }}>
                            <Stack direction="row" spacing={2} sx={{width: '100%'}}>
                                <ZoomFab aria-label="Use captured image" show size="medium" color="success" onClick={handleCaptureAccepted}>
                                    <CheckTwoTone/>
                                </ZoomFab>
                                <ZoomFab aria-label="Retake image" show size="medium" color="warning" onClick={() => {setMode('capture');}}>
                                    <RedoTwoTone/>
                                </ZoomFab>
                            </Stack>
                        </Stack>
                    </Box>
                </Slide>}
        </Box>
    );
}

const StyledCanvas = styled('canvas')(() => ({
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover'
}));

interface ImageCapturePreviewProps {
    capture: CapturedImage;
    aspectRatio: AspectRatio;
}

function ImageCapturePreview({capture, aspectRatio}: ImageCapturePreviewProps) {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        if (!canvasRef.current) {
            return;
        }
        capture.drawToCanvas(canvasRef.current,{ autoCropAspectRation: aspectRatio});
    }, [capture, aspectRatio]);

    return (
      <Box sx={{width: '100%', height: '100%', aspectRatio: aspectRatio.ratio}}>
          <StyledCanvas ref={canvasRef} sx={{objectFit: 'cover'}}/>
      </Box>
    );
}
