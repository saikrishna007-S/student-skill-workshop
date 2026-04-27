import express from "express";
import cors from "cors";
import multer from "multer";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import {
  initStore,
  saveState,
  createWorkshop,
  addMaterial,
  addRegistration,
  getRegistrationsByEmail,
  getAllRegistrationsWithWorkshops
} from "./store.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 4010;

function resolveAdminPassword() {
  const raw = process.env.ADMIN_PASSWORD;
  if (raw === undefined || raw === null) return { password: "admin123", fromEnv: false };
  const trimmed = String(raw).trim();
  if (trimmed === "") return { password: "admin123", fromEnv: false };
  return { password: trimmed, fromEnv: true };
}

const { password: ADMIN_PASSWORD, fromEnv: adminPasswordFromEnv } = resolveAdminPassword();
const UPLOAD_DIR = join(__dirname, "uploads");

mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safe = String(file.originalname).replace(/[^\w.\-()+ ]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }
});

const app = express();

app.use(
  cors({
    origin: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use("/uploads", express.static(UPLOAD_DIR));

let state = await initStore();

function adminAuth(req, res, next) {
  const pw = String(req.headers["x-admin-password"] ?? "").trim();
  if (pw !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Invalid or missing admin password" });
  }
  next();
}

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/api/admin/login", (req, res) => {
  const password = String(req.body?.password ?? "").trim();
  if (!password) {
    return res.status(400).json({ error: "Password is required" });
  }
  if (password === ADMIN_PASSWORD) {
    return res.json({ ok: true });
  }
  res.status(401).json({ error: "Wrong password" });
});

app.get("/api/workshops", (_req, res) => {
  res.json(state.workshops);
});

app.post("/api/workshops", adminAuth, async (req, res) => {
  const result = createWorkshop(state, req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  await saveState(state);
  res.status(201).json(result.workshop);
});

app.get("/api/materials", (_req, res) => {
  res.json(state.materials);
});

app.post("/api/materials", adminAuth, async (req, res) => {
  const result = addMaterial(state, req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  await saveState(state);
  res.status(201).json(result.material);
});

app.post(
  "/api/materials/upload",
  adminAuth,
  upload.single("file"),
  async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "Choose a file to upload" });
    }
    const workshopId = Number(req.body.workshopId);
    const result = addMaterial(state, {
      workshopId,
      name: req.body.name,
      uploadedFile: {
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        publicPath: `/uploads/${req.file.filename}`,
        storedFilename: req.file.filename
      }
    });
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    await saveState(state);
    res.status(201).json(result.material);
  }
);

app.get("/api/post-training-resources", (_req, res) => {
  res.json(state.postTrainingResources);
});

app.post("/api/registrations", async (req, res) => {
  const result = addRegistration(state, req.body);
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  await saveState(state);
  res.status(201).json(result.registration);
});

app.get("/api/registrations", (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: "Query parameter email is required" });
  }
  res.json(getRegistrationsByEmail(state, String(email)));
});

app.get("/api/registrations/all", adminAuth, (_req, res) => {
  res.json(getAllRegistrationsWithWorkshops(state));
});

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message || "Upload error" });
  }
  console.error(err);
  res.status(500).json({ error: "Server error" });
});

const server = app.listen(PORT, () => {
  console.log(`Workshop API listening on http://localhost:${PORT}`);
  if (adminPasswordFromEnv) {
    console.log("Admin password: taken from ADMIN_PASSWORD environment variable.");
  } else {
    console.log('Admin password (sign-in): admin123  — set ADMIN_PASSWORD to use your own.');
  }
});

server.on("error", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Close the other terminal running the server, or use another port.\n` +
        `PowerShell: $env:PORT=4020; npm start\n` +
        "Then in frontend `vite.config.js` set `proxy.\"/api\".target` to `http://127.0.0.1:4020` (or the port you picked)."
    );
  } else {
    console.error(err);
  }
  process.exit(1);
});
