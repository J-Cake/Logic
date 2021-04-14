export async function pickFile(options?: Partial<{
    multiple: boolean,
    excludeAcceptAllOption: boolean,
    types: FilePickerAcceptType[]
}>): Promise<FileSystemFileHandle[]> {
    return await showOpenFilePicker(options);
}

export async function saveData(key: string, data: any): Promise<void> {
    window.localStorage.setItem(key, JSON.stringify(data));
}

export async function fetchData(key: string): Promise<any> {
    const data = window.localStorage.getItem(key);
    if (data) return JSON.parse(data);
}