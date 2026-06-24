export interface FileWithDataUrl {
    file: File;
    dataUrl: string;
}

export function fileToDataUrl(file: File): Promise<FileWithDataUrl | null> {
    const fr = new FileReader();
    return new Promise((resolve, reject) => {
        fr.addEventListener('loadend', () => {
            if (fr.error) {
                reject(fr.error);
                return;
            }

            resolve((fr.result == null || fr.result instanceof ArrayBuffer)
                ? null
                : { file, dataUrl: fr.result });
        }, { once: true });
        fr.readAsDataURL(file);
    });
}

export function fileReadToUrl(file: File): Promise<FileWithDataUrl> {
    const fr = new FileReader();

    let loadEndHandler: () => void;
    const loadHandlerProvider = (resolve: (value: FileWithDataUrl | PromiseLike<FileWithDataUrl>) => void, reject: (reason?: unknown) => void) => {
        loadEndHandler = () => {
            if (fr.error) {
                reject(fr.error);
                return;
            }

            if (typeof fr.result === 'string') {
                resolve({file, dataUrl: fr.result});
            } else {
                reject(new Error('File read result is null or an ArrayBuffer'));
            }
        };
        return loadEndHandler;
    }

    return new Promise<FileWithDataUrl>((resolve, reject) => {
        fr.addEventListener('loadend', loadHandlerProvider(resolve, reject), { once: true });
        fr.readAsDataURL(file);
    }).finally(() => { fr.removeEventListener('loadend', loadEndHandler); });
}
