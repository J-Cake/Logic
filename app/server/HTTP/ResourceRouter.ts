import * as path from 'path';
import * as express from 'express';

import {rootFn} from "../utils";

const router = express.Router();

router.get('/svg/:file', async function (req, res) {
    res.sendFile(path.join(await rootFn(), 'lib', 'res', req.params.file));
})

router.get('/folio.html', function (req, res) {

});

export default router;