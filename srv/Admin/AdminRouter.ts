import express from 'express';

const router: express.Router = express.Router();

router.post('/update-docs', async function (req, res) {
    console.log("--- Unimplemented --- [Updating `lib` is not implemented yet]");
    res.status(200);
    res.end('')
});

export default router;