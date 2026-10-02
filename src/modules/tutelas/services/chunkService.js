export const dividirEnChunks = (texto, size = 1500, overlap = null) => {
  if (!texto) return [];
  const effectiveOverlap = overlap !== null ? overlap : Math.floor(size * 0.2);
  if (size <= effectiveOverlap) throw new Error('size debe ser mayor que overlap');

  const parrafos = texto.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const unidades = [];

  for (const parrafo of parrafos) {
    if (parrafo.length > size) {
      // Párrafo gigante: intentar cortar por oración antes de cortar por carácter.
      // La segunda alternativa captura el remanente final sin punto/!/? — sin
      // ella, match() descarta ese remanente por completo (no queda ni en un
      // "temp" a medio llenar: nunca entra al loop de oraciones).
      const oraciones = parrafo.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [parrafo];
      let temp = '';
      for (const oracion of oraciones) {
        if ((temp + oracion).length <= size) {
          temp += oracion;
        } else {
          if (temp) unidades.push(temp.trim());
          // Si la oración sola supera el size, cortar por caracteres
          if (oracion.length > size) {
            for (let i = 0; i < oracion.length; i += size) {
              unidades.push(oracion.substring(i, i + size).trim());
            }
            temp = '';
          } else {
            temp = oracion;
          }
        }
      }
      if (temp) unidades.push(temp.trim());
    } else {
      unidades.push(parrafo.trim());
    }
  }

  // Agrupar unidades en chunks con overlap real
  const chunks = [];
  let current = '';

  for (let i = 0; i < unidades.length; i++) {
    const unidad = unidades[i];

    if ((current + '\n\n' + unidad).length <= size) {
      current += (current ? '\n\n' : '') + unidad;
    } else {
      if (current) chunks.push(current);

      // El overlap toma los últimos `overlap` caracteres del chunk anterior
      // para preservar contexto entre chunks — pero si tail + unidad excede
      // size (unidad por sí sola siempre cabe, ver arriba), se descarta el
      // overlap para ese chunk en vez de superar el límite declarado.
      const tail = current.slice(-effectiveOverlap);
      const conTail = tail ? tail + '\n\n' + unidad : unidad;
      current = conTail.length <= size ? conTail : unidad;
    }
  }

  if (current) chunks.push(current);

  return chunks;
};
