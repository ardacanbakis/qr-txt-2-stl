import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  Timestamp,
  type DocumentData,
} from 'firebase/firestore';
import { getFirebaseApp } from './config';
import type { ModelConfig } from '../types/model';

export interface SavedProject {
  id: string;
  name: string;
  generator: string;
  config: ModelConfig;
  createdAt: Date;
  updatedAt: Date;
}

function getDb() {
  const app = getFirebaseApp();
  if (!app) return null;
  return getFirestore(app);
}

export async function saveProject(
  userId: string,
  name: string,
  config: ModelConfig,
): Promise<string | null> {
  const db = getDb();
  if (!db) return null;

  const ref = await addDoc(collection(db, 'projects'), {
    userId,
    name,
    generator: config.generator,
    config,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
}

export async function loadProjects(userId: string): Promise<SavedProject[]> {
  const db = getDb();
  if (!db) return [];

  const q = query(
    collection(db, 'projects'),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(d => docToProject(d.id, d.data()));
}

export async function deleteProject(projectId: string): Promise<void> {
  const db = getDb();
  if (!db) return;
  await deleteDoc(doc(db, 'projects', projectId));
}

function docToProject(id: string, data: DocumentData): SavedProject {
  return {
    id,
    name: data.name ?? 'Untitled',
    generator: data.generator ?? 'qr',
    config: data.config as ModelConfig,
    createdAt: (data.createdAt as Timestamp).toDate(),
    updatedAt: (data.updatedAt as Timestamp).toDate(),
  };
}
