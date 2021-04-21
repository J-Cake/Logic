import path from 'path';
import express from 'express';

import {rootFn} from '../util/utils';
import * as FS from '../util/files';

const router: express.Router = express.Router();

router.get('/:script', async function (req, res) {
    const scriptLocation = encodeURIComponent(req.params['script']);

    const file = path.join(await rootFn(), 'lib/component-scripts', scriptLocation);
    if (await FS.exists(file)) {
        res.contentType('text/javascript');
        res.end(await FS.readFile(file));
    } else {
        res.status(404);
        res.end('script doesn\'t exist');
    }
});

export default router;