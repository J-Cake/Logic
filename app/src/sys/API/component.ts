import {authToken} from "./index";

export function getComponent(componentToken: string) {
    return new Promise(resolve => {
        fetch(`${window.location.protocol}//api.${window.location.host}/component/${componentToken}`, {
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.json()).then(res => resolve(res));
    });
}

export function fetchScript(scriptUrl: string) {
    return new Promise(resolve => {
        fetch(scriptUrl, {
            headers: {
                'auth-token': authToken
            }
        }).then(res => res.text()).then(script => resolve(script));
    });
}