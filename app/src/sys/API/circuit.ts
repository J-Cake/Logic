import {authToken} from "./index";
import type {CircuitObj} from "../../../../server/App/Document/Document";
import {Action, ApiResponse_Success} from "../../../../server/API/lib/Api";

/**
 * # Circuit.ts
 * *RESTful* wrapper for the document API.
 *
 * TODO: Link Return types to API return types.
 */

/**
 * Create a document
 * @param docName the name given to the document
 */
export function makeDocument(docName: string): Promise<ApiResponse_Success<string, Action.Document_Create>> {
    return new Promise((resolve, reject) => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/make?name=${docName}`, {
            method: 'post',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => 'error' in res ? reject(res) : resolve(res)).catch(err => reject(err));
    });
}

/**
 * Rename the document
 * @param circuitToken document identifier
 * @param name new name of the document
 */
export function renameDocument(circuitToken: string, name: string): Promise<ApiResponse_Success<string, Action.Document_Rename>> {
    return new Promise((resolve, reject) => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}?name=${name}`, {
            method: 'post',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => 'error' in res ? reject(res) : resolve(res)).catch(err => reject(err));
    });
}

/**
 * Remove user from document
 * @param circuitToken document identifier
 */
export function leaveDocument(circuitToken: string): Promise<ApiResponse_Success<void, Action.Document_Collaborator_Leave>> {
    return new Promise((resolve, reject) => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}/leave`, {
            method: 'delete',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => 'error' in res ? reject(res) : resolve(res)).catch(err => reject(err));
    });
}

/**
 * Get the JSON representation of the document
 * @param circuitToken document identifier
 */
export function getDocument(circuitToken: string): Promise<ApiResponse_Success<CircuitObj, Action.Document_Read>> {
    return new Promise((resolve, reject) => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}`, {
            method: 'get',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => 'error' in res ? reject(res) : resolve(res)).catch(err => reject(err));
    });
}

/**
 * Save the document
 * @param circuitToken document identifier
 * @param document JSON encoded document
 */
export function saveDocument(circuitToken: string, document: CircuitObj): Promise<ApiResponse_Success<void, Action.Document_Write>> {
    return new Promise((resolve, reject) => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}`, {
            method: 'put',
            headers: {
                'auth-token': authToken,
                'Content-type': 'application/json'
            },
            body: JSON.stringify(document)
        }).then(res => res.json()).then(res => 'error' in res ? reject(res) : resolve(res)).catch(err => reject(err));
    });
}

/**
 * Grant user view access to a document
 * @param circuitToken document identifier
 * @param userToken user identifier
 */
export function addCollaborator(circuitToken: string, userToken: string): Promise<ApiResponse_Success<boolean, Action.Document_Collaborator_Add>> {
    return new Promise((resolve, reject) => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}/collaborator?user=${userToken}`, {
            method: 'put',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => 'error' in res ? reject(res) : resolve(res)).catch(err => reject(err));
    });
}

/**
 * Revoke view/edit access to a user to a document
 * @param circuitToken document identifier
 * @param userToken user identifier
 */
export function removeCollaborator(circuitToken: string, userToken: string): Promise<ApiResponse_Success<void, Action.Document_Collaborator_Remove>> {
    return new Promise((resolve, reject) => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}/collaborator?user=${userToken}`, {
            method: 'delete',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => 'error' in res ? reject(res) : resolve(res)).catch(err => reject(err));
    });
}

/**
 * Allow the user to edit the document
 * @param circuitToken document identifier
 * @param userToken user identifier
 * @param canEdit can the user edit
 */
export function allowEdit(circuitToken: string, userToken: string, canEdit: boolean): Promise<ApiResponse_Success<boolean, Action.Document_Collaborator_CanEdit>> {
    return new Promise((resolve, reject) => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}/collaborator?user=${userToken}&can-edit=${canEdit ? 'true' : 'false'}`, {
            method: 'put',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => 'error' in res ? reject(res) : resolve(res)).catch(err => reject(err));
    });
}

/**
 * Add a component to the document
 * @param circuitToken document identifier
 * @param componentToken component identifier
 */
export function addComponent(circuitToken: string, componentToken: string): Promise<ApiResponse_Success<void, Action.Document_Component_Add>> {
    return new Promise((resolve, reject) => {
        fetch(`${window.location.protocol}//api.${window.location.host}/document/${circuitToken}/add-component?component=${componentToken}`, {
            method: 'put',
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => 'error' in res ? reject(res) : resolve(res)).catch(err => reject(err));
    });
}
