const { Router } = require("express");
// const FileEntry = require("../models/file");
const multer = require("multer");
const upload = multer({dest: './uploads/'});

const router = Router();

router.post("/", upload.single('avatar'), async (req, res) => {
    console.log("Trying to store file " + req.file);
    // const file = new FileEntry(req.body);
    // const createdFile = await file.save();
    return res.json(req.file);
})


router.get("/:id", async (req, res) => {
    const file = `${__dirname}/../uploads/${req.params.id}`
    res.download(file);
})

module.exports = router;