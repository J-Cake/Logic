import {ApiComponent} from '../Logic/io/ComponentFetcher';
import * as sanitiser from './sanitiser';
import type {showModal} from './DialogManager';
import type {pickFile} from './API';

export interface Plugin {
    computeFn: (inputs: boolean[]) => boolean[],
    onClick: (renderObj: sanitiser.SanitisedRenderer) => void,
}

export type onClick = (renderObj: sanitiser.SanitisedRenderer) => void;
export type setComputeFn = (inputs: boolean[]) => boolean[];

export interface API {
    component: {
        onClick: (callback: onClick) => onClick,
        setComputeFn: (callback: setComputeFn) => setComputeFn,
        update: () => void,
        component: SanitisedComponent
    },
    dialog: {
        showModal: typeof showModal,
        pickFile: typeof pickFile
    },
    storage: {
        saveData: (key: string, data: any) => Promise<void>,
        fetchData: (key: string) => Promise<any>
    }
}

export default function sanitiseFunction(script: string, apiComponent: ApiComponent, API: API): Partial<Plugin> {
    const keys: (keyof API)[] = Object.keys(API) as (keyof API)[];
    const fn = Function.constructor.apply(null, keys.concat(`const window=void 0,document=void 0,Function=void 0,eval=void 0;${script}` as keyof API));
    return fn.apply(apiComponent, keys.map(i => API[i]))
}