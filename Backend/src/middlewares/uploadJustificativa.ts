import crypto from "crypto";
import path from "path";

import multer from "multer";

const tiposPermitidos = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
];

const storage = multer.diskStorage({
  destination: (_req, _arquivo, callback) => {
    callback(
      null,
      path.resolve(
        process.cwd(),
        "uploads",
        "justificativas"
      )
    );
  },

  filename: (_req, arquivo, callback) => {
    const extensao = path
      .extname(arquivo.originalname)
      .toLowerCase();

    callback(
      null,
      `${Date.now()}-${crypto.randomUUID()}${extensao}`
    );
  },
});

export const uploadJustificativa = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (_req, arquivo, callback) => {
    if (!tiposPermitidos.includes(arquivo.mimetype)) {
      callback(
        new Error(
          "Envie apenas PDF, JPG, PNG ou WEBP."
        )
      );

      return;
    }

    callback(null, true);
  },
});