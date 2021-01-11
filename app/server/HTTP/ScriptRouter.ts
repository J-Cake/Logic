import * as fs from 'fs';
import * as path from 'path';

import * as express from 'express';
import {rootFn} from "../utils";

const router = express.Router();

router.get('/src/:script', function (req, res) {
    const scriptLocation = encodeURIComponent(req.params['script']);

    const file = path.join(rootFn(__dirname), 'Data', 'scripts', scriptLocation);
    if (fs.existsSync(file)) {
        res.contentType('text/javascript');
        res.end(`return apiComponent=>(function component(component){window=void 0;document=void 0;${fs.readFileSync(file, 'utf8')}}).bind(apiComponent)`);
    } else {
        res.status(404);
        res.end('script doesn\'t exist');
    }
});

export default router;