// ============================================
// READER — Lee el archivo de datos JSON
// ============================================
import { readFile } from 'fs/promises';
import { join } from 'path';
import type { Course } from './types.js';

export async function readCourses(): Promise<Course[]> {
  const filePath = join(import.meta.dirname, '..', 'data', 'items.json');

  try {
    const raw = await readFile(filePath, 'utf-8');
    return JSON.parse(raw) as Course[];
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err);
    throw new Error(
      `No se pudo leer el archivo de datos en "${filePath}". Verifica que exista y sea un JSON válido. Detalle: ${reason}`
    );
  }
}