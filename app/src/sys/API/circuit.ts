import {authToken} from "./index";
import type {CircuitObj} from "../../../../server/App/Document/Document";

// TODO: Link Return types to API return types.

export function makeDocument(docName: string) {
    return new Promise(resolve => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/make?name=${docName}`, {
            method: 'post',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => resolve(res));
    });
}

export function renameDocument(circuitToken: string, name: string) {
    return new Promise(resolve => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}?name=${name}`, {
            method: 'post',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => resolve(res));
    });
}

export function leaveDocument(circuitToken: string) {
    return new Promise(resolve => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}/leave`, {
            method: 'delete',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => resolve(res));
    });
}

export function getDocument(circuitToken: string) {
    return new Promise(resolve => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}`, {
            method: 'get',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => resolve(res));
    });
}

export function saveDocument(circuitToken: string, document: CircuitObj) {
    return new Promise(resolve => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}`, {
            method: 'put',
            headers: {
                'auth-token': authToken,
                'Content-type': 'application/json'
            },
            body: JSON.stringify(document)
        }).then(res => res.json()).then(res => resolve(res));
    });
}

export function addCollaborator(circuitToken: string, userToken: string) {
    return new Promise(resolve => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}/collaborator?user=${userToken}`, {
            method: 'put',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => resolve(res));
    });
}

export function removeCollaborator(circuitToken: string, userToken: string) {
    return new Promise(resolve => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}/collaborator?user=${userToken}`, {
            method: 'delete',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => resolve(res));
    });
}

export function allowEdit(circuitToken: string, userToken: string, canEdit: boolean) {
    return new Promise(resolve => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}/collaborator?user=${userToken}&can-edit=${canEdit ? 'true' : 'false'}`, {
            method: 'put',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => resolve(res));
    });
}

export function addComponent(circuitToken: string, componentToken: string) {
    return new Promise(resolve => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}/add-component?component${componentToken}`, {
            method: 'put',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => resolve(res));
    });
}