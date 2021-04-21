import path from 'path';
import express from 'express';

import {rootFn} from '../util/utils';

const router: express.Router = express.Router();

router.get('/svg/:file', async function (req, res) {
    res.sendFile(path.join(await rootFn(), 'lib', 'res', req.params.file));
})

router.get('/folio.html', function (req, res) {

});

export default router;