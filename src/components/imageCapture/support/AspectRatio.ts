
export interface AspectRatio {
    width: number;
    height: number;
    units: 'in' | 'mm' | 'px';
    ratio: number;
    commonName: string;
    calcHeight: (width:number) => number;
    calcWidth: (height:number) => number;
}

type AspectRatioData = Omit<AspectRatio, 'calcHeight' | 'calcWidth'>;

class AspectRatioImpl implements AspectRatio {
    width: AspectRatio['width'];
    height: AspectRatio['height'];
    units: AspectRatio['units'];
    commonName: AspectRatio['commonName'];
    ratio: AspectRatio['ratio'];

    private constructor(props: AspectRatioData) {
        this.width = props.width;
        this.height = props.height;
        this.units = props.units;
        this.commonName = props.commonName;
        this.ratio = props.ratio;
    }

    calcHeight(width: number): number {
        return width / this.ratio;
    }

    calcWidth(height: number): number {
        return height * this.ratio;
    }

    static of(props: Omit<AspectRatioData, 'ratio'> & Partial<Pick<AspectRatio, 'ratio'>>): AspectRatio {
        const ratio = props.ratio ?? (props.width / props.height);
        return new AspectRatioImpl({...props, ratio});
    }

    toString(): string {
        return `${this.width.toString()} ${this.units} x ${this.height.toString()} ${this.units} (${this.ratio.toString()}) [${this.commonName}]`;
    }
}

export type AspectRatioNames = 'US_LETTER' | 'A4' | 'LARGE_FORMAT' | 'SQUARE' | 'SIXTEEN_NINE';

export const AspectRatios: Record<AspectRatioNames, AspectRatio> = {
    US_LETTER: AspectRatioImpl.of({ width: 8.5, height: 11, units: 'in', commonName: 'US Letter' }),
    A4: AspectRatioImpl.of({ width: 210, height: 297, units: 'mm', commonName: 'A4' }),
    LARGE_FORMAT: AspectRatioImpl.of({ width: 9, height: 11.875, units: 'in', commonName: 'Arch A (9" x 12")' }),
    SQUARE: AspectRatioImpl.of({width: 9, height: 9, units: 'in', commonName: 'Square'}),
    SIXTEEN_NINE: AspectRatioImpl.of({width: 1920, height: 1080, units: 'px', commonName: '16:9'}),
} as const;

export const resolveAspectRatio = (aspectRatio?: AspectRatio | AspectRatioNames | ""): AspectRatio | undefined => {
    return aspectRatio === ""
        ? undefined
        : (typeof aspectRatio === "string"
            ? AspectRatios[aspectRatio]
            : aspectRatio);
}
