interface SanitisedComponent {
    readonly inputNames: string[];
    readonly outputNames: string[];
    readonly token: string;
    label: string;
    readonly getInputList: () => {
        [terminal: string]: [SanitisedComponent, string];
    };
    readonly getOutputList: () => {
        [terminal: string]: [SanitisedComponent, string][];
    };
    out: boolean[];
    compute(inputs: boolean[]): boolean[];
    getInputs(): boolean[];
    update(): void;
}

interface Wire {
    coords: [number, number][],
    startComponent: SanitisedRenderComponent,
    endComponent: SanitisedRenderComponent,
    startIndex: number,
    endIndex: number,
}

interface RenderProps {
    pos: [number, number];
    direction: 0 | 1 | 2 | 3;
    flip: boolean;
    label: string;
}

interface SanitisedRenderComponent {
    component: SanitisedComponent,
    wires: Wire[],
    props: RenderProps,
    pos: [number, number],
    size: [number, number],
    isSelected: boolean,
    isHovering(mouse: [number, number]): boolean,
    getTerminal(mouse: [number, number]): [boolean, number] | null
}

declare var component: {
    onClick: (callback: (renderObj: SanitisedRenderComponent) => void) => void;
    setComputeFn: (computeFn: ((inputs: boolean[]) => boolean[])) => void;
    update: () => void,
    component: SanitisedComponent
};

declare var dialog: {
    pickFile: (options?: OpenFilePickerOptions & { multiple?: false }) => Promise<[FileSystemFileHandle]>
}

declare var storage: {
    saveData(key: string, data: any): Promise<void>,
    fetchData(key: string): Promise<any>
}