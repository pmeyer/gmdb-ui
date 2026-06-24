import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {fileReadToUrl, AspectRatios, CapturedImage} from "../imageCapture";
import type {FileWithDataUrl, AspectRatioNames} from "../imageCapture";
import {Box, CardContent, CardMedia, SpeedDial, SpeedDialAction, SpeedDialIcon} from "@mui/material";
import {CameraAltTwoTone, DeleteTwoTone, UploadFileTwoTone} from "@mui/icons-material";
import {ImageCapture} from "./image/ImageCapture";
import _ from "lodash";

export interface ImageInputProps {
    width: number;
    aspectRatioName: AspectRatioNames;
    fileBaseName: string;
    emptyImagePoster?: string;
    existingImage?: string | FileWithDataUrl | null;
    image: FileWithDataUrl | null | undefined;
    onImageChange?: (image: FileWithDataUrl | null) => void;
    disabled?: boolean;
}

type InputSource = "none" | "camera" | "file";
type ImageActionKey = "upload" | "capture" | "clear";

interface ImageAction {
    icon: React.ReactNode;
    name: string;
    key: ImageActionKey;
    show: (hasImage: boolean) => boolean;
}

const actions: ImageAction[] = [
    { icon: <UploadFileTwoTone />, name: 'Upload Image', key: 'upload', show: () => true },
    { icon: <CameraAltTwoTone />, name: 'Capture Image', key: 'capture', show: () => true },
    { icon: <DeleteTwoTone />, name: 'Clear Image', key: 'clear', show: (hasImage: boolean) => hasImage }
];

export function ImageInput({width, aspectRatioName, fileBaseName, emptyImagePoster, existingImage,  image, onImageChange, disabled}: ImageInputProps) {
    const [speedDialOpen, setSpeedDialOpen] = useState(false);
    //const [selectedImage, setSelectedImage] = useState<FileWithDataUrl|null>(null);
    const [inputSource, setInputSource] = useState<InputSource>("none");

    useEffect(() => {
        if (disabled === true) {
            queueMicrotask(() => {
                setSpeedDialOpen(false);
                setInputSource("none");
            });
        }
    }, [disabled]);

    const aspectRatio = useMemo(() => AspectRatios[aspectRatioName], [aspectRatioName]);
    const height = useMemo(() => aspectRatio.calcHeight(width), [aspectRatio, width]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const existingImageUrl = useMemo(
        () => typeof existingImage === "string" ? existingImage : existingImage?.dataUrl,
        [existingImage],
    );

    const selectedImageUrl = useMemo(
        () => (image === undefined ? existingImageUrl : image?.dataUrl) ?? emptyImagePoster,
        [emptyImagePoster, existingImageUrl, image],
    );

    const hasImage = image === undefined ? existingImageUrl !== undefined : image !== null;
    const activeInputSource = disabled === true ? "none" : inputSource;
    const activeSpeedDialOpen = disabled === true ? false : speedDialOpen;

    const handleActionClick = useCallback((action: string) => {
        if (disabled === true) {
            return;
        }

        setSpeedDialOpen(false);
        switch (action) {
            case 'capture':
                setInputSource("camera");
                break;
            case 'upload':
                setInputSource("file");
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                    fileInputRef.current.click();
                }
                break;
            case 'clear':
               // setSelectedImage(null);
                onImageChange?.(null);
                break;
        }
    }, [disabled, onImageChange]);

    const handleCapture = useCallback(async (capturedImage: CapturedImage) => {
        try {
            const imageFile = await capturedImage.toFile(fileBaseName, aspectRatio);
            //setSelectedImage(imageFile);
            onImageChange?.(imageFile);
        } catch(err) {
            console.error(err);
        } finally {
            capturedImage.close();
            setInputSource('none');
        }
    }, [aspectRatio, fileBaseName, onImageChange]);

    const handleUploadImageChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('[II] Image Change from Upload: ', e);
        const file = _(e.currentTarget.files).first();
        if (!file) {
            return;
        }
        try {
            const imageFile = await fileReadToUrl(file);
            //setSelectedImage(imageFile);
            onImageChange?.(imageFile);
        } catch(err) {
            console.error(err);
        } finally {
            setInputSource('none')
        }
    }, [onImageChange]);

    return (
        <Box sx={{height: 'min-content', borderWidth: '1px', borderStyle: 'solid', borderColor: t => t.palette.divider  }}>
            {activeInputSource !== 'camera' &&
                <CardContent sx={{width: `${width.toString()}px`, height: `${height.toString()}px`, p: '0!important', position: 'relative'}}>
                    <CardMedia component="img" image={selectedImageUrl} alt="Current Image"
                               sx={{ objectFit: 'cover', width: '100%', height: '100%', filter: disabled ? 'grayscale(100%)' : 'none', opacity: disabled ? 0.25 : 1 }} />
                    <SpeedDial ariaLabel="Image Actions"
                               sx={{ position: 'absolute', bottom: 16, right: 16 }}
                               icon={<SpeedDialIcon />}
                               open={activeSpeedDialOpen}
                               FabProps={{ size: 'medium', color: 'default', disabled: disabled  }}
                               onOpen={() => {setSpeedDialOpen(true);}}
                               onClose={() => {setSpeedDialOpen(false);}}
                    >
                        {actions.filter(a => a.show(hasImage)).map((action) => (
                            <SpeedDialAction
                                key={action.name}
                                icon={action.icon}
                                slotProps={{
                                    tooltip: {
                                        title: action.name,
                                    },
                                    fab: {
                                        size: 'small'
                                    }
                                }}
                                onClick={() => {handleActionClick(action.key);}}
                            />
                        ))}
                    </SpeedDial>
                </CardContent>}
            <input id="img-upload"
                   ref={fileInputRef}
                   name="img-upload"
                   type="file"
                   accept="image/*"
                   capture="environment"
                   hidden
                   onChange={e => {void handleUploadImageChange(e);}} />
            {activeInputSource === 'camera' &&
                <ImageCapture width={width} initialAspectRatio={aspectRatioName}
                                       onCapture={i => {void handleCapture(i);}} allowCameraNone
                                        onClose={() => {setInputSource("none");}}/>}
        </Box>
    );
}
