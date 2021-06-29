import {authToken} from "./index";
import {Action, ApiResponse_Success} from "../../../../server/API/lib/Api";
import {ApiComponent} from "../../Logic/io/ComponentFetcher";

/**
 * Fetches the component source
 * @param componentToken componentIdentifier
 */
export function getComponent(componentToken: string): Promise<ApiResponse_Success<ApiComponent, Action.Component_Get>> {
    return new Promise((resolve, reject) => {
        fetch(`${window.location.protocol}//api.${window.location.host}/component/${componentToken}`, {
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => 'error' in res ? reject(res) : resolve(res)).catch(err => reject(err));
    });
}

/**
 * Fetches the script
 * @param scriptUrl the URL to the script.
 */
export function fetchScript(scriptUrl: string): Promise<ApiResponse_Success<string, Action.Script_Get>> {
    return new Promise((resolve, reject) => {
        fetch(scriptUrl, {
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => 'error' in res ? reject(res) : resolve(res)).catch(err => reject(err));
    });
}