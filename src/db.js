import { db } from "./firebase";
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  onSnapshot,
  serverTimestamp,
  query,
  orderBy,
  where,
} from "firebase/firestore";

// ── Collection references ──────────────────────────────────────────────────

export const emergenciesCol = collection(db, "emergencies");
export const campsCol       = collection(db, "camps");
export const distressCol    = collection(db, "distress_signals");


// ── EMERGENCIES ────────────────────────────────────────────────────────────

export const addEmergency = (data) =>
  addDoc(emergenciesCol, {
    title:          data.title,
    description:    data.description,
    severity:       data.severity,       // "low" | "medium" | "high"
    status:         "open",
    lat:            data.lat,
    lng:            data.lng,
    requiredSkills: data.requiredSkills, // e.g. ["first-aid", "rescue"]
    assignedCamp:   null,
    createdBy:      data.createdBy,      // auth.currentUser.uid
    createdAt:      serverTimestamp(),
    updatedAt:      serverTimestamp(),
  });

export const getEmergencies = () =>
  getDocs(query(emergenciesCol, orderBy("createdAt", "desc")));

export const updateEmergency = (id, data) =>
  updateDoc(doc(db, "emergencies", id), {
    ...data,
    updatedAt: serverTimestamp(),
  });

// Live listener — call this in useEffect, pass a setState callback
export const listenEmergencies = (callback) =>
  onSnapshot(
    query(emergenciesCol, orderBy("createdAt", "desc")),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );


// ── CAMPS ──────────────────────────────────────────────────────────────────

export const addCamp = (data) =>
  addDoc(campsCol, {
    name:             data.name,
    lat:              data.lat,
    lng:              data.lng,
    capacity:         data.capacity,
    currentOccupancy: data.currentOccupancy ?? 0,
    status:           "active",           // "active" | "full" | "closed"
    resources: {
      food:    data.resources?.food    ?? 0,  // units
      water:   data.resources?.water   ?? 0,  // litres
      medkits: data.resources?.medkits ?? 0,  // count
    },
    createdAt: serverTimestamp(),
  });

export const getCamps = () => getDocs(campsCol);

export const updateCamp = (id, data) =>
  updateDoc(doc(db, "camps", id), data);

export const listenCamps = (callback) =>
  onSnapshot(campsCol, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );


// ── DISTRESS SIGNALS ───────────────────────────────────────────────────────

export const addDistressSignal = (data) =>
  addDoc(distressCol, {
    reporterName:    data.reporterName,
    reporterPhone:   data.reporterPhone,
    lat:             data.lat,
    lng:             data.lng,
    affectedCount:   data.affectedCount,
    needType:        data.needType,      // "medical"|"food"|"rescue"|"shelter"
    severity:        data.severity,      // 1 to 5
    nearestCamp:     null,
    linkedEmergency: null,
    resolved:        false,
    createdAt:       serverTimestamp(),
  });

export const listenDistressSignals = (callback) =>
  onSnapshot(
    query(distressCol, where("resolved", "==", false)),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );

export const resolveDistressSignal = (id) =>
  updateDoc(doc(db, "distress_signals", id), { resolved: true });

// ── VOLUNTEERS ─────────────────────────────────────────────────────────────

export const volunteersCol = collection(db, "volunteers");

export const addVolunteer = (data) =>
  addDoc(volunteersCol, {
    name:       data.name,
    skills:     data.skills,     // ["medical", "rescue", "food", etc]
    lat:        data.lat,
    lng:        data.lng,
    status:     "available",     // "available" | "dispatched"
    createdAt:  serverTimestamp(),
  });

export const listenVolunteers = (callback) =>
  onSnapshot(
    query(volunteersCol, where("status", "==", "available")),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );

export const updateVolunteer = (id, data) =>
  updateDoc(doc(db, "volunteers", id), data);

// ── AI MATCHES ─────────────────────────────────────────────────────────────

export const saveAiMatch = (emergencyId, matches) =>
  addDoc(collection(db, "ai_matches"), {
    emergencyId,
    matches,
    createdAt: serverTimestamp(),
  });

export const listenAiMatches = (emergencyId, callback) =>
  onSnapshot(
    query(
      collection(db, "ai_matches"),
      where("emergencyId", "==", emergencyId),
      orderBy("createdAt", "desc")
    ),
    (snap) => callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );