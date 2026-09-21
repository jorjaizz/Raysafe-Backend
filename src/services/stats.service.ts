/**
 * @file stats.service.ts
 * @capa Service (Lógica de negocio)
 * @descripcion Lógica de negocio del módulo "estadísticas/dashboard".
 *               Agrupa los tipos de abuso en categorías amplias, calcula
 *               totales y porcentajes. No conoce MySQL ni HTTP.
 */
import * as statsRepository from '../repositories/stats.repository';

/**
 * Mapeo de abuse_type_id a categorías amplias del dashboard.
 * (1-15 humanos, 16-29 abuso animal según el seed).
 */
const GROUP_OF_ABUSE_TYPE: Record<number, string> = Object.freeze({
  1: 'VIOLENCIA GÉNERO/FAMILIAR',
  2: 'VIOLENCIA GÉNERO/FAMILIAR',
  3: 'ABUSO SEXUAL',
  4: 'VIOLENCIA GÉNERO/FAMILIAR',
  5: 'ABUSO INFANTIL',
  6: 'ABUSO INFANTIL',
  7: 'TRATA Y EXPLOTACIÓN',
  8: 'TRATA Y EXPLOTACIÓN',
  9: 'ABUSO SEXUAL',
  10: 'VIOLENCIA GÉNERO/FAMILIAR',
  11: 'ADULTO MAYOR/DISCRIMINACIÓN',
  12: 'ADULTO MAYOR/DISCRIMINACIÓN',
  13: 'VIOLENCIA GÉNERO/FAMILIAR',
  14: 'TRATA Y EXPLOTACIÓN',
  15: 'VIOLENCIA GÉNERO/FAMILIAR',
  16: 'ABUSO ANIMAL',
  17: 'ABUSO ANIMAL',
  18: 'ABUSO ANIMAL',
  19: 'ABUSO ANIMAL',
  20: 'ABUSO ANIMAL',
  21: 'ABUSO ANIMAL',
  22: 'ABUSO ANIMAL',
  23: 'ABUSO ANIMAL',
  24: 'ABUSO ANIMAL',
  25: 'ABUSO ANIMAL',
  26: 'ABUSO ANIMAL',
  27: 'ABUSO ANIMAL',
  28: 'ABUSO ANIMAL',
  29: 'ABUSO ANIMAL',
});

interface CategorySlice {
  categoria: string;
  cantidad: number;
  porcentaje: number;
}

interface DepartmentStats {
  departamento_id: string;
  nombre_departamento: string;
  total_denuncias: number;
  desglose_por_categoria: CategorySlice[];
}

export interface Dashboard {
  total_denuncias_nacional: number;
  total_departamentos: number;
  departamentos: DepartmentStats[];
}

const roundTo1 = (value: number): number => Math.round(value * 10) / 10;

export const getDashboard = async (): Promise<Dashboard> => {
  const [totalNacional, totalDepartamentos, departments, counts] = await Promise.all([
    statsRepository.countAllReports(),
    statsRepository.countDepartments(),
    statsRepository.listDepartments(),
    statsRepository.departmentCountsByAbuseType(),
  ]);

  const countsByDepartment = new Map<string, Map<string, number>>();
  for (const row of counts) {
    const category = GROUP_OF_ABUSE_TYPE[row.abuse_type_id];
    if (!category) continue;

    let byCategory = countsByDepartment.get(row.department);
    if (!byCategory) {
      byCategory = new Map<string, number>();
      countsByDepartment.set(row.department, byCategory);
    }
    byCategory.set(category, (byCategory.get(category) ?? 0) + row.cantidad);
  }

  const departamentos: DepartmentStats[] = departments.map((department) => {
    const byCategory = countsByDepartment.get(department);
    let total = 0;
    let desglose: CategorySlice[] = [];

    if (byCategory) {
      total = [...byCategory.values()].reduce((acc, cantidad) => acc + cantidad, 0);
      desglose = [...byCategory.entries()]
        .map(([categoria, cantidad]) => ({
          categoria,
          cantidad,
          porcentaje: roundTo1((cantidad / total) * 100),
        }))
        .sort((a, b) => b.cantidad - a.cantidad);
    }

    return {
      departamento_id: department,
      nombre_departamento: department,
      total_denuncias: total,
      desglose_por_categoria: desglose,
    };
  });

  return {
    total_denuncias_nacional: totalNacional,
    total_departamentos: totalDepartamentos,
    departamentos,
  };
};