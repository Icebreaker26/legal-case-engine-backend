import { z } from 'zod';

// #197 (épica #199) — contrato del banco de pruebas ambiental. Un expediente
// sintético con los mismos campos que usa la app (expedientes_ambientales +
// último analisis_ambiental). Las consultas son expedientes completos (la
// búsqueda de similares es documento contra documento), en un archivo aparte
// y con id distinto: nunca forman parte del corpus de búsqueda.
//
// `spec` es la especificación latente con la que se generó el expediente
// (tema, subtema). Nunca se carga en la base ni se muestra a los anotadores:
// solo sirve para auditar la composición del corpus.

export const TEMAS_AMBIENTAL = [
  'COMPENSACION_FORESTAL',
  'LICENCIA_AMBIENTAL_LT',
  'VERTIMIENTOS',
  'OCUPACION_CAUCE',
  'SANCIONATORIO',
  'LEVANTAMIENTO_VEDA',
  'RUIDO_SUBESTACION',
  'RESIDUOS_PELIGROSOS',
  'CONCESION_AGUAS',
];

const expedienteBase = {
  titulo: z.string().min(10).max(200),
  tipo_instrumento: z.enum(['Resolución', 'Auto', 'Oficio', 'Concepto técnico', 'Requerimiento']),
  numero_expediente: z.string().regex(/^SINT-AMB-\d{4}$/, 'numero_expediente debe ser SINT-AMB-NNNN (sintético)'),
  contenido_texto: z.string().min(2500).max(9000),
  que_ordena: z.string().min(20).max(600),
  resumen: z.string().min(150).max(1200).nullable(),
  nivel_riesgo: z.enum(['Alto', 'Medio', 'Bajo']).nullable(),
  spec: z.object({
    tema: z.enum(TEMAS_AMBIENTAL),
    subtema: z.string().min(3),
    base_normativa: z.array(z.string()).min(1),
  }),
};

export const ExpedienteSchema = z.object({
  id: z.string().regex(/^AMB-[A-Z]{3}-\d{3}$/, 'id debe ser AMB-XXX-NNN'),
  ...expedienteBase,
}).refine((e) => (e.resumen === null) === (e.nivel_riesgo === null), {
  message: 'resumen y nivel_riesgo van juntos (los dos vienen del análisis)',
});

export const ConsultaSchema = z.object({
  qid: z.string().regex(/^QAMB-[A-Z]{3}-\d{3}$/, 'qid debe ser QAMB-XXX-NNN'),
  ...expedienteBase,
}).refine((e) => (e.resumen === null) === (e.nivel_riesgo === null), {
  message: 'resumen y nivel_riesgo van juntos (los dos vienen del análisis)',
});
