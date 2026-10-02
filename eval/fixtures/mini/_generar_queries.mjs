import fs from 'node:fs';

const queries = [
  {
    // Relevante SOLO semánticamente a DOC-FAC-001/002: parafrasea sin usar
    // los términos literales "cobro inoportuno" ni "facturación vencida".
    qid: 'Q-FAC-SEM',
    texto: 'Señor Juez:\nEl pasado mes la empresa de energía me incluyó en el recibo varios meses atrasados que nunca me habían cobrado antes, y que ya habían pasado hace bastante tiempo. No entiendo por qué me cobran ahora algo tan viejo si nunca me avisaron a tiempo.',
    derecho_vulnerado: 'FACTURACION_TEST',
    comprension: {
      tema_central: 'Cobro retroactivo de consumos antiguos nunca facturados a tiempo',
      peticiones: ['Explicar por qué se cobran periodos tan antiguos', 'Anular el cobro si no corresponde'],
    },
    spec: { categoria: 'FACTURACION_TEST', subtema: 'cobro_inoportuno', base_normativa: ['Ley 142 de 1994 Art. 150'] },
  },
  {
    // Relevante SOLO léxicamente: repite literalmente "cobro inoportuno" y
    // "facturación", maximizando solapamiento de palabras con DOC-FAC-001.
    qid: 'Q-FAC-LEX',
    texto: 'Solicito revisión por cobro inoportuno de facturación. Considero que el cobro inoportuno de facturación de periodos antiguos de facturación es improcedente y pido que se revise el cobro inoportuno aplicado en mi facturación más reciente.',
    derecho_vulnerado: 'FACTURACION_TEST',
    comprension: null,
    spec: { categoria: 'FACTURACION_TEST', subtema: 'cobro_inoportuno', base_normativa: ['Ley 142 de 1994 Art. 150'] },
  },
  {
    // Relevante a CORTE_SERVICIO_TEST (grado 2 con DOC-CORTE-001/002), y
    // grado 0 con todo lo de FACTURACION_TEST/SERVIDUMBRE_TEST/PRESCRIPCION_TEST
    // (categoría distinta).
    qid: 'Q-CORTE-DIST',
    texto: 'El servicio de energía eléctrica de mi vivienda fue suspendido la semana pasada sin que me llegara ningún aviso previo de la empresa. Quiero saber si esto es legal y que se me restablezca el servicio.',
    derecho_vulnerado: 'CORTE_SERVICIO_TEST',
    comprension: {
      tema_central: 'Suspensión del servicio eléctrico sin aviso previo',
      peticiones: ['Restablecer el servicio', 'Explicar si la suspensión sin aviso es legal'],
    },
    spec: { categoria: 'CORTE_SERVICIO_TEST', subtema: 'suspension_sin_aviso', base_normativa: ['Ley 142 de 1994 Art. 140'] },
  },
  {
    // Fuera de dominio — no debería extraer ninguna categoría del fixture.
    // spec.categoria usa un valor que no existe en el corpus (grado 0 con todo).
    qid: 'Q-CAT-VACIA',
    texto: 'Solicito respetuosamente copia de mi hoja de vida laboral y de los certificados de capacitación que reposan en los archivos de recursos humanos de la empresa, para trámites personales ante otra entidad.',
    derecho_vulnerado: 'RECURSOS_HUMANOS_TEST',
    comprension: null,
    spec: { categoria: 'RECURSOS_HUMANOS_TEST', subtema: 'certificacion_laboral', base_normativa: ['Ley 1437 de 2011 Art. 14'] },
  },
];

const out = queries.map(q => JSON.stringify(q)).join('\n') + '\n';
fs.writeFileSync(new URL('./queries.jsonl', import.meta.url), out);
console.error('queries escritas:', queries.length);
