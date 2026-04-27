import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { seedWorkshops, seedMaterials, seedPostTrainingResources } from "./data/seedData.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "data");
const DB_PATH = join(DATA_DIR, "database.json");

function nextId(list) {
  if (!list.length) return 1;
  return Math.max(...list.map((item) => item.id)) + 1;
}

export async function loadState() {
  try {
    const raw = await readFile(DB_PATH, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function initStore() {
  await mkdir(DATA_DIR, { recursive: true });
  let state = await loadState();
  if (!state) {
    const registrations = [];
    const workshops = seedWorkshops.map((w) => {
      const count = registrations.filter((r) => r.workshopId === w.id).length;
      return { ...w, registered: w.registered ?? count };
    });
    state = {
      workshops,
      materials: seedMaterials,
      registrations,
      postTrainingResources: seedPostTrainingResources
    };
    await saveState(state);
  }
  return state;
}

export async function saveState(state) {
  const json = JSON.stringify(state, null, 2);
  await writeFile(DB_PATH, json, "utf8");
  return state;
}

export function createWorkshop(state, body) {
  const {
    title,
    trainer,
    date,
    time,
    duration,
    level = "Beginner",
    capacity = 20,
    description
  } = body;

  if (!title || !trainer || !date || !time || !duration || !description) {
    return { error: "Missing required workshop fields" };
  }

  const workshop = {
    id: nextId(state.workshops),
    title: String(title),
    trainer: String(trainer),
    date: String(date),
    time: String(time),
    duration: String(duration),
    level: String(level),
    description: String(description),
    capacity: Math.max(1, Number(capacity) || 20),
    registered: 0
  };
  state.workshops.push(workshop);
  return { workshop };
}

export function addMaterial(state, body) {
  const {
    workshopId,
    name,
    type = "PDF",
    link = "#",
    uploadedFile
  } = body;
  const wid = Number(workshopId);
  const workshop = state.workshops.find((w) => w.id === wid);
  if (!workshop) return { error: "Workshop not found" };

  const displayName =
    String(name || "").trim() ||
    (uploadedFile?.originalName ? String(uploadedFile.originalName) : "");
  if (!displayName) return { error: "Material name is required" };

  const material = {
    id: nextId(state.materials),
    workshopId: wid,
    name: displayName,
    type: uploadedFile?.mimetype
      ? String(uploadedFile.mimetype.split("/")[1] || type).slice(0, 32)
      : String(type),
    link:
      uploadedFile?.publicPath != null
        ? String(uploadedFile.publicPath)
        : String(link || "#"),
    ...(uploadedFile?.storedFilename
      ? { storedFilename: uploadedFile.storedFilename }
      : {})
  };
  state.materials.push(material);
  return { material };
}

export function addRegistration(state, body) {
  const { name, email, workshopId } = body;
  const wid = Number(workshopId);
  if (!name || !email) return { error: "Name and email are required" };

  const emailNorm = String(email).trim().toLowerCase();
  const workshop = state.workshops.find((w) => w.id === wid);
  if (!workshop) return { error: "Workshop not found" };

  const duplicate = state.registrations.some(
    (r) => r.workshopId === wid && r.email.toLowerCase() === emailNorm
  );
  if (duplicate) return { error: "Already registered for this workshop" };

  if (workshop.registered >= workshop.capacity) {
    return { error: "Workshop is full" };
  }

  const registration = {
    id: nextId(state.registrations),
    name: String(name).trim(),
    email: emailNorm,
    workshopId: wid
  };
  state.registrations.push(registration);
  workshop.registered += 1;
  return { registration };
}

export function getRegistrationsByEmail(state, email) {
  const e = String(email).trim().toLowerCase();
  if (!e) return [];
  return state.registrations.filter((r) => r.email === e);
}

export function getAllRegistrationsWithWorkshops(state) {
  return state.registrations
    .slice()
    .sort((a, b) => b.id - a.id)
    .map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      workshopId: r.workshopId,
      workshopTitle:
        state.workshops.find((w) => w.id === r.workshopId)?.title || "Unknown"
    }));
}
