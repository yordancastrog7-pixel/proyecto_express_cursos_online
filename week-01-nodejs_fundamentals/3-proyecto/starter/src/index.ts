// ============================================
// ENTRY POINT — Orquesta todo el flujo
// ============================================
import { readCourses } from './reader.js';
import { filterByCategory, calculateSummary } from './processor.js';
import { writeReport } from './writer.js';
import type { Report } from './types.js';

function parseCategoryArg(): string | null {
  const args = process.argv.slice(2);
  const categoryIndex = args.indexOf('--category');
  return categoryIndex !== -1 ? args[categoryIndex + 1] ?? null : null;
}

async function main(): Promise<void> {
  try {
    const categoryFilter = parseCategoryArg();

    const courses = await readCourses();
    const filteredCourses = filterByCategory(courses, categoryFilter);
    const summary = calculateSummary(filteredCourses);

    const report: Report = {
      generatedAt: new Date().toISOString(),
      appliedFilter: categoryFilter,
      summary,
      courses: filteredCourses,
    };

    console.log('\n📚 Resumen del catálogo de cursos');
    console.log('----------------------------------');
    console.log(`Filtro aplicado:      ${categoryFilter ?? '(ninguno)'}`);
    console.log(`Total de cursos:      ${summary.total}`);
    console.log(`Activos:              ${summary.active}`);
    console.log(`Inactivos:            ${summary.inactive}`);
    console.log(`Precio promedio:      $${summary.averagePrice}`);
    console.log(`Curso más caro:       ${summary.mostExpensive.title} ($${summary.mostExpensive.price})`);
    console.log(`Curso más barato:     ${summary.cheapest.title} ($${summary.cheapest.price})`);
    console.log(`Categorías:           ${summary.categories.join(', ')}`);

    await writeReport(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`\n❌ Error: ${message}`);
    process.exit(1);
  }
}

main();

