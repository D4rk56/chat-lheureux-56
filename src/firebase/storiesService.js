import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
} from "firebase/firestore";
import { db } from "./config.js";

const TESTIMONIALS_COLLECTION = "testimonials";

/**
 * Récupère le cache local des témoignages (hydratation 0ms).
 */
export function getCachedStories() {
  try {
    const raw = localStorage.getItem('cached_testimonials');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
}

/**
 * Récupère tous les témoignages depuis Firestore et met à jour le cache local.
 */
export async function fetchStories() {
  const snapshot = await getDocs(collection(db, TESTIMONIALS_COLLECTION));
  const list = [];
  snapshot.forEach(d => {
    const data = d.data();
    if (data && (data.catName || data.content)) {
      list.push({
        id: d.id,
        ...data,
        tag: data.tag || 'Heureux au foyer'
      });
    }
  });

  try {
    localStorage.setItem('cached_testimonials', JSON.stringify(list));
  } catch (e) {
    console.warn("Impossible d'écrire cached_testimonials :", e);
  }

  return list;
}

/**
 * Sauvegarde (création ou mise à jour) d'un témoignage.
 */
export async function saveStory(storyData, id = null) {
  const payload = {
    ...storyData,
    updatedAt: new Date().toISOString()
  };

  if (id) {
    await updateDoc(doc(db, TESTIMONIALS_COLLECTION, id), payload);
    return id;
  } else {
    payload.createdAt = new Date().toISOString();
    const ref = await addDoc(collection(db, TESTIMONIALS_COLLECTION), payload);
    return ref.id;
  }
}

/**
 * Supprime un témoignage.
 */
export async function deleteStory(id) {
  if (!id) return;
  await deleteDoc(doc(db, TESTIMONIALS_COLLECTION, id));
}
