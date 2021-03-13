import * as path from 'path';
import * as express from 'express';
import * as eva from 'eva-icons';

import {rootFn} from "../utils";

const router = express.Router();

router.get('/icon/:icon', async function (req, res) {
    res.contentType("image/svg+xml");
    res.end(eva);
});

router.get('/eva.min.js', async function (req, res) {
    res.contentType('text/javascript');
    res.sendFile(path.join(await rootFn(), 'node_modules', 'eva-icons', 'eva.min.js'));
});
router.get('/eva.min.js.map', async function (req, res) {
    res.contentType('text/javascript');
    res.sendFile(path.join(await rootFn(), 'node_modules', 'eva-icons', 'eva.min.js.map'));
});

export default router;