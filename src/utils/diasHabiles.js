import Holidays from 'date-holidays';

const hd = new Holidays('CO');

export const sumarDiasHabiles = (fecha, dias) => {
  const result = new Date(fecha);
  let contador = 0;
  while (contador < dias) {
    result.setDate(result.getDate() + 1);
    const dia = result.getDay();
    if (dia !== 0 && dia !== 6 && !hd.isHoliday(result)) {
      contador++;
    }
  }
  return result;
};

// Extrae el número de días hábiles de strings como "10 días hábiles desde la notificación"
export const extraerDiasHabiles = (texto) => {
  if (!texto) return null;
  const match = texto.match(/(\d+)\s*d[íi]as?\s*h[áa]bile[s]?/i);
  return match ? parseInt(match[1], 10) : null;
};
