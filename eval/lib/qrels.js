// Deriva relevancia graduada (qrels) a partir de la especificación latente
// de cada documento y consulta — nunca del juicio de un sistema de
// retrieval, para que la verdad de referencia no dependa de lo que se está
// evaluando.
//
// Regla:
//   2 = misma categoría + mismo subtema + al menos una base normativa compartida
//   1 = misma categoría, subtema distinto
//   0 = cualquier otro caso (categoría distinta)
const compartenNormativa = (a, b) => a.some(n => b.includes(n));

export const gradoRelevancia = (query, doc) => {
  if (query.spec.categoria !== doc.categoria) return 0;
  if (query.spec.subtema === doc.spec.subtema && compartenNormativa(query.spec.base_normativa, doc.spec.base_normativa)) return 2;
  return 1;
};

// Construye las líneas qrels en formato TREC (qid 0 doc_id grado) para
// TODAS las combinaciones query×documento del corpus — no solo las que
// devuelve algún sistema (eso es lo que hace válido el pooling en #75:
// la verdad de referencia ya existe antes de correr cualquier experimento).
export const construirQrelsTrec = (queries, corpus) => {
  const lineas = [];
  for (const q of queries) {
    for (const d of corpus) {
      const grado = gradoRelevancia(q, d);
      if (grado > 0) lineas.push(`${q.qid} 0 ${d.id} ${grado}`);
    }
  }
  return lineas.join('\n') + '\n';
};
