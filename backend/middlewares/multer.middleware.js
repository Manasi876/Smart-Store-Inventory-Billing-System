import multer from "multer";

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        // Original filenames collide easily (e.g. "IMG_2024.jpg" from two
        // different phones uploaded around the same time), which can
        // overwrite another user's in-flight upload on disk before either
        // gets pushed to Cloudinary. A unique prefix removes that risk.
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}-${file.originalname}`);
    },
});

export const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB cap per file
    },
    fileFilter: (req, file, cb) => {
        const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
        if (!allowed.includes(file.mimetype)) {
            return cb(new Error("Only JPG, PNG, WEBP, or PDF files are allowed"));
        }
        cb(null, true);
    },
});