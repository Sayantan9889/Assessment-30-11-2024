import multer, { StorageEngine, diskStorage, Multer } from "multer";
import { existsSync, mkdirSync } from "fs";
import { extname } from "path";
import { Request } from "express";

// Checking if the uploads folder exists or no, if not then create one
const uploadDir:string = './uploads';
if (!existsSync(uploadDir)) {
  mkdirSync(uploadDir);
}

const storage:StorageEngine = diskStorage({
  destination: function (req:Request, file:Express.Multer.File, cb) {
    cb(null, uploadDir);
  },
  filename: function (req:Request, file:Express.Multer.File, cb) {
    const uniqueSuffix:string = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext:string = extname(file.originalname);
    cb(null, uniqueSuffix+ext);
  }
})

const fileFilter = (req:Request, file:Express.Multer.File, cb:any) => {
  if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/jpg' || file.mimetype === 'image/gif'  || file.mimetype === 'image/svg+xml') {
    cb(null, true)
  } else {
    cb(new Error('Only images are allowed!'));
  }
}

const upload:Multer = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 10 }, fileFilter: fileFilter });  // limit 10MB

export default upload;