import {type AspectRatio, AspectRatioNames, resolveAspectRatio} from "./AspectRatio";
import {stopVideoStream} from "./Utilities";

async function getVideoStream(deviceId?: string): Promise<MediaStream> {
    const constraints: MediaStreamConstraints = {
        video: {
            deviceId
        }
    };
    console.log(`Getting Video Stream [${deviceId ?? 'default'}] with constraints: ${JSON.stringify(constraints)}`);
    return navigator.mediaDevices.getUserMedia(constraints);
}

export class VideoStream {
    public static DEFAULT_WIDTH = 1280;

    private _stream: MediaStream | null = null;
    private _videoTrack: MediaStreamTrack | null = null;
    private _capabilities: MediaTrackCapabilities | null = null;
    private _constraints: MediaTrackConstraints | null = null;
    private _settings: MediaTrackSettings | null = null;
    private readonly _label: string;
    private readonly _handleTrackEnded = () => { this.stop(); };

    private constructor(stream: MediaStream, label?: string) {
        this._stream = stream;
        if (this._stream.getVideoTracks().length === 0) {
            this._stream.getTracks().forEach(track => { track.stop(); });
            this._stream = null;
            throw new Error('No video tracks found in stream');
        }
        this._videoTrack = this._stream.getVideoTracks()[0];
        this._videoTrack.addEventListener('ended', this._handleTrackEnded, { once: true });
        this._label = label ?? this._videoTrack.label;
        this._capabilities = this._videoTrack.getCapabilities();
        this._constraints = this._videoTrack.getConstraints();
        this._settings = this._videoTrack.getSettings();
    }

    get stream(): MediaStream | null {
        return this._stream;
    }

    get capabilities(): MediaTrackCapabilities | null {
        return this._capabilities;
    }

    get constraints(): MediaTrackConstraints | null {
        return this._constraints;
    }

    set constraints(c: MediaTrackConstraints | null ) {
        this._constraints = c;
    }

    get settings(): MediaTrackSettings | null {
        return this._settings;
    }

    get trackId(): string | null {
        return this._videoTrack?.id ?? null;
    }

    get label(): string {
        return this._label;
    }

    getImageCapture(): ImageCapture {
        if (this._videoTrack === null) {
            throw new Error(`[VS] Cannot get ImageCapture from stream without video track: ${this.toString()}`);
        }
        return new ImageCapture(this._videoTrack);
    }

    async applyTrackConstraints(constraints: MediaTrackConstraints): Promise<void> {
        if (!this._videoTrack) {
            return Promise.resolve();
        }
        try {
            console.log(`[VS] Setting Video Track constraints: ${JSON.stringify(constraints)}`);
            await this._videoTrack.applyConstraints(constraints);
            console.log(`[VS] Track constraints applied successfully.`);
        } finally {
            this._constraints = this._videoTrack.getConstraints();
            this._settings = this._videoTrack.getSettings();
        }
    }

    setAspectRatio(aspectRatio: AspectRatio | AspectRatioNames | ""): Promise<void> {
        const ar = resolveAspectRatio(aspectRatio);
        return this.applyTrackConstraints({aspectRatio: {ideal: ar?.ratio}});
    }

    setWidth(width: number, aspectRatio?: AspectRatio | AspectRatioNames | ""): Promise<void> {
        const ar = resolveAspectRatio(aspectRatio);
        return this.applyTrackConstraints({width: {ideal: width}, aspectRatio: {ideal: ar?.ratio}})
    }

    setMaxWidth(aspectRatio?: AspectRatio | AspectRatioNames | ""): Promise<void> {
        const maxWidth = this._capabilities?.width?.max ?? VideoStream.DEFAULT_WIDTH;
        return this.setWidth(maxWidth, aspectRatio);
    }

    pause() {
        if (this._videoTrack) {
            this._videoTrack.enabled = false;
        }
    }

    resume() {
        if (this._videoTrack) {
            this._videoTrack.enabled = true;
        }
    }

    isValid() {
        return this._stream !== null && this._videoTrack !== null;
    }

    stop() {
        console.log(`[VS] Stopping Video Stream: ${this.toString()}`);
        this._videoTrack?.removeEventListener('ended', this._handleTrackEnded);
        stopVideoStream(this._stream);
        this._stream = null;
        this._videoTrack = null;
        this._capabilities = null;
        this._constraints = null;
        this._settings = null;
    }

    toString() {
        if (!this.isValid()) {
            return 'VideoStream [INVALID]';
        }
        return `VideoStream ${this._label} [SID: ${this._stream?.id ?? 'unknown'} | TID: ${this._videoTrack?.id ?? 'unknown'}]`;
    }

    static async forDevice(device: MediaDeviceInfo | string): Promise<VideoStream> {
        const s = await getVideoStream(typeof device === 'string' ? device : device.deviceId);
        return new VideoStream(s, typeof device === 'string' ? undefined : device.label);
    }
}
