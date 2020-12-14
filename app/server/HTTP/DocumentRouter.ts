import * as express from 'express';
import getFile from "../getFile";
import {verifyUser} from "../User";

const router = express.Router();

router.get('/circuit/:circuit', async function (req, res) {
    const userId = req.cookies.userId ?? req.header("userId");

    if (!userId)
        res.redirect('/user/login');
    else if (await verifyUser(userId)) {
        const file = await getFile(userId, req.params.circuit);

        await file?.fetchInfo();

        if (file)
            res.json(file?.info);
        else {
            res.status(403);
            res.end('The provided user does not have access to this document');
        }

    } else
        res.redirect('/user/login');
});

router.put('/circuit/:circuit', async function (req, res) {

});

export default router;