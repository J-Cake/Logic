import * as $ from 'jquery';

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

export type Dialogs = Record<Dialog, [JQuery, Window | null]>;

const dialogManager: StateManager<Dialogs> = new StateManager<Dialogs>({});

declare global {
    interface Window {
        connect: () => void;
    }
}

export function setVisible(dialog: Dialog, visibility: boolean): Window | null {
    const [button, dialogObj] = dialogManager.setState()[dialog];

    if (visibility)
        if (dialogObj)
            dialogObj.focus();
        else {
            const win: Window | null = window
                .open(dialogFiles[dialog](manager.setState().documentIdentifier), '_blank', 'location=no,height=450,width=450,scrollbars=no,status=no');

            if (win) // Thanks SO
                window.connect = function () {
                    dialogManager.dispatch('windowChange', () => ({[dialog]: [button, win]}));
                    $(win).on("beforeunload", () => dialogManager.dispatch('windowChange', () => ({[dialog]: [button, null]})));
                };
        }
    else if (dialogObj) {
        dialogObj.close();
        dialogManager.dispatch('close', {
            [dialog]: dialogObj.closed ? null : dialogObj
        });
    }

    return dialogManager.setState()[dialog][1];
}

export default dialogManager;

export function closeAll() {
    for (const [, i] of Object.values(dialogManager.setState()))
        if (i)
            i.close();
}

dialogManager.on('toggleDialog', function (state) { // This event is called when the buttons change
    for (const [dialog, [button]] of Object.entries(state))
        if (button.prop('checked'))
            setVisible(Number(dialog), true)
        else
            setVisible(Number(dialog), false)
});

dialogManager.on('windowChange', function (state) { // This event is called when the windows change
    console.log("Updating Buttons");
    for (const [button, win] of Object.values(state))
        button.prop('checked', !!win);
})

export function link(dialog: Dialog, el: JQuery, onOpen: (window: Window) => void) {
    if (!el.is(`input[type="checkbox"]`))
        throw {err: "Please link a checkbox"};

    dialogManager.setState((prev: Dialogs) => ({
        [dialog]: prev[dialog] ? [el, prev[dialog][1]] : [el, null]
    }));

    el.on('change', () => dialogManager.broadcast('toggleDialog'));
}