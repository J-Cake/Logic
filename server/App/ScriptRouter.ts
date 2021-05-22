import path from 'path';
import express from 'express';

import {rootFn} from '../util/utils';
import * as FS from '../util/files';
import respond, {Action, Status} from "../API/lib/Api";

const router: express.Router = express.Router();

router.get('/:script', async function (req, res) {
    res.json(await respond(Action.Script_Get, async function(props, error): Promise<string> {
        props.res = res;

        const scriptLocation = encodeURIComponent(req.params['script']);

        const file = path.join(await rootFn(), 'lib/component-scripts', scriptLocation);
        if (await FS.exists(file))
            return await FS.readFile(file);
        else
            error(Status.Component_Not_Exists, 'The script wasn\'t found');

        return '';
    }));
});

export default router;