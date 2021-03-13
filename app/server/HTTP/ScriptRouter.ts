import * as path from 'path';
import * as express from 'express';

import {rootFn} from "../utils";
import * as FS from '../FS';

const router = express.Router();

router.get('/src/:script', async function (req, res) {
    const scriptLocation = encodeURIComponent(req.params['script']);

    const file = path.join(await rootFn(), 'lib/component-scripts', scriptLocation);
    if (await FS.exists(file)) {
        res.contentType('text/javascript');
        res.end(`return apiComponent=>(function component(component){window=void 0;document=void 0;${await FS.readFile(file)}}).bind(apiComponent)`);
    } else {
        res.status(404);
        res.end('script doesn\'t exist');
    }
});

export default router;