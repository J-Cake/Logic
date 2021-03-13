import StateManager from "../sys/util/stateManager";
import {manager} from "../index";

export enum Dialog {
    ComponentView,
    ComponentFinder
}

export const dialogFiles: Record<Dialog, (docId: string) => string> = {
    [Dialog.ComponentView]: (doc: string) => `/components/${doc}`,
    [Dialog.ComponentFinder]: (doc: string) => `/find/${doc}`
}

export type Dialogs = Record<Dialog, Window | null>;

const dialogManager: StateManager<Dialogs> = new StateManager<Dialogs>({});

export function setVisible(dialog: Dialog, visibility: boolean, onClose?: (isClosed: boolean) => void): Window | null {
    const dialogObj = dialogManager.setState()[dialog];

    if (visibility)
        if (dialogObj)
            dialogObj.focus();
        else {
            const win: Window | null = window
                .open(dialogFiles[dialog](manager.setState().documentIdentifier), '_blank', 'location=no,height=450,width=450,scrollbars=no,status=no')

            if (onClose && win)
                win.addEventListener('load', function () {
                    win.window.addEventListener("beforeunload", () => {
                        dialogManager.setState({
                            [dialog]: null
                        });
                        onClose(true);
                    });
                });


            dialogManager.dispatch('open', {[dialog]: win});
        }
    else if (dialogObj) {
        dialogObj.close();
        dialogManager.dispatch('close', {
            [dialog]: dialogObj.closed ? null : dialogObj
        });
    }

    return dialogManager.setState()[dialog];
}

export default dialogManager;

export function closeAll() {
    console.log('closing all');
    for (const i of Object.values(dialogManager.setState()))
        if (i)
            i.close();
}