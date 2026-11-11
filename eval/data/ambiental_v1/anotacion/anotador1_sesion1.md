# Etiquetado de relevancia — expedientes ambientales

Eres un abogado ambiental en Colombia. Para cada **expediente consulta** debes juzgar qué tan útil es cada **expediente candidato** como precedente para atenderlo. Juzga cada par por separado, solo con el contenido de los expedientes.

Escala (entero de 0 a 3):
- **3** = misma obligación o situación, directamente aplicable como precedente.
- **2** = mismo tema con diferencias relevantes, útil como referencia.
- **1** = relación tangencial.
- **0** = no relacionado.

Escribe el resultado en `C:\Users\aleja\Documents\Projects\tutelas\tutelas_backend\eval\data\ambiental_v1\anotacion\anotador1_sesion1_resultado.csv`: un CSV en UTF-8 con encabezado exacto `qid,doc_id,relevancia_0a3,razon_breve` y **una fila por cada par listado abajo** (ni más ni menos). La razón breve va entre comillas dobles, en español y con máximo 20 palabras. No leas ningún otro archivo. Al terminar, responde solo cuántas filas escribiste.

Pares a juzgar: **151** (10 consultas, 39 candidatos distintos).

## Expedientes candidatos

### AMB-CAG-001

- **Título:** Resolución que otorga concesión temporal de captación superficial para campamento de obra
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Cumplir la concesión de 0,8 l/s en la quebrada La Esperanza por dieciocho meses, mantener caudal ecológico de 6 l/s, instalar medidor y reportar consumos trimestrales.
- **Resumen del análisis:** Concesión temporal para campamento con caudal bajo frente al mínimo de la fuente. Las condiciones de caudal ecológico y la vigilancia del humedal son el punto de control. El riesgo es moderado y se centra en el seguimiento.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa solicitó concesión de aguas superficiales para abastecer el campamento de obra de la Línea Oriente 500 kV, en un tramo ubicado en un municipio del departamento de Huila. La solicitud comprende una captación en la quebrada La Esperanza, con un caudal de 0,8 litros por segundo y un plazo de dieciocho meses, durante el cual se ejecutarán las fundaciones de torres en el sector.
  > 
  > El trámite se surtió con visita técnica, publicación de la solicitud y concepto favorable de la oficina de planeación municipal sobre la compatibilidad del uso con el ordenamiento territorial.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > La visita técnica verificó que la quebrada presenta caudal mínimo en época seca de 15 litros por segundo, y que el caudal solicitado representa menos del 6 por ciento de ese valor. La Empresa propuso un sistema de captación con rejilla y cámara de sedimentación, así como un medidor de caudal calibrado. El estudio hidrológico aportado es suficiente para el análisis de disponibilidad, aunque no contempla el efecto de la captación sobre las especies acuáticas de la zona.
  > 
  > El caudal ecológico calculado por el método aplicable es de 6 litros por segundo, valor que se respeta en las condiciones de la solicitud. No obstante, la quebrada alimenta un humedal en su tramo bajo, de modo que la verificación de caudal debe realizarse en la época de transición. El cálculo de demanda del campamento considera un consumo por persona para la fase de obra, pero no contempla el consumo […]

### AMB-CAG-002

- **Título:** Auto que suspende captación de hecho de agua de río para campamento sin concesión
- **Tipo de instrumento:** Auto
- **Qué ordena:** Suspender en veinticuatro horas la captación de hecho del río Cravo Sur, retirar la motobomba, abastecer el campamento con agua autorizada y presentar documentación de concesión en diez días.
- **Resumen del análisis:** Captación de hecho en río con caudal significativo frente al estiaje y presencia de peces migratorios. La solicitud de concesión pendiente no ampara el uso. Es un caso de medida preventiva con inicio de sancionatorio para la Empresa y el contratista.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > Una vigilancia de la autoridad ambiental detectó una motobomba instalada sobre el río Cravo Sur, en un municipio del departamento de Casanare, que succionaba agua para un campamento de obra vinculado a la Subestación S-61. El equipo tomaba aproximadamente 3 litros por segundo mediante una manguera de 4 pulgadas, sin que existiera concesión ni permiso de captación a nombre de la Empresa ni del contratista de obra.
  > 
  > El contratista manifestó que la captación se hizo para atender una emergencia sanitaria del personal y que no sabía que requería trámite. La Empresa informó que tiene una solicitud de concesión en trámite desde hace cuatro meses, sin resolución.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El caudal captado representa una porción significativa del caudal de estiaje del río en el tramo, que la autoridad estima en 20 litros por segundo. La captación se realizó en un sector con presencia de peces migratorios reportados en estudios regionales. No se instalaron mallas ni dispositivos de protección de fauna, y el punto de succión se encontraba en una zona de remanso con vegetación ribereña intervenida.
  > 
  > La solicitud de concesión en trámite no se ha resuelto y no ampara la captación observada. La condición de solicitud pendiente no habilita el uso del recurso. Además, la vegetación ribereña intervenida en el punto de succión sugiere remoción de cobertura para instalar el equipo, actividad que no fue incluida en la solicitud ni en el plan de manejo de la obra.
  > 
  > CONSIDERACIONES […]

### AMB-CAG-003

- **Título:** Concepto técnico hidrogeológico sobre pozo para subestación en acuífero confinado
- **Tipo de instrumento:** Concepto técnico
- **Qué ordena:** No otorgar el caudal de 2 l/s sin prueba de bombeo escalonada, prueba de recuperación de setenta y dos horas, piezómetros, modelo de interferencia con pozos vecinos y justificación del uso para lavado.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > El presente concepto se emite en el trámite de concesión de aguas subterráneas solicitada para la Subestación S-40, ubicada en un municipio del departamento de Córdoba. La Empresa propone un pozo perforado a 110 metros de profundidad, con un caudal de explotación de 2 litros por segundo, para el consumo de la estación y el lavado de equipos durante la operación.
  > 
  > La Empresa aportó el informe de perforación, el registro litológico del pozo y una prueba de bombeo de cuatro horas realizada en la fase de construcción.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El registro litológico identifica un acuífero confinado en arenas medias, limitado superior e inferiormente por arcillas. La prueba de bombeo de cuatro horas resulta insuficiente para caracterizar la transmisividad y el coeficiente de almacenamiento del acuífero, dado que la recuperación del nivel no se midió durante el tiempo necesario. Con los datos disponibles no es posible estimar la interferencia con pozos vecinos, de los cuales existen al menos tres en un radio de 800 metros.
  > 
  > La zona presenta una condición de sobreexplotación parcial de acuíferos, según el diagnóstico de la corporación autónoma regional. La extracción propuesta puede generar un descenso acumulado del nivel, con afectación para los usuarios existentes. El caudal de lavado de equipos no está diferenciado del consumo humano en la solicitud, lo que impide verificar si el volumen total es compatible con la capacidad del acuífero.
  > 
  > CONCEPTO
  > 
  > El caudal de 2 l […]

### AMB-CAG-004

- **Título:** Resolución que concede aprovechamiento de pozo subterráneo para construcción de subestación
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Cumplir la concesión de 1,0 l/s del pozo por veinticuatro meses, reubicar o contener el tanque de combustible a treinta metros, instalar sello sanitario, presentar plano de drenaje y registrar niveles mensualmente.
- **Resumen del análisis:** Concesión de pozo en acuífero libre con prueba de bombeo aceptable. La proximidad del tanque de combustible es el riesgo principal y el acto la condiciona a reubicación o contención. Caso de riesgo medio con control técnico.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa solicitó concesión de aguas subterráneas mediante un pozo ubicado en el predio de la Subestación S-66, en un municipio del departamento de Meta, para abastecer el consumo de la obra durante la fase de construcción, con un caudal de 1,2 litros por segundo y un plazo de veinticuatro meses. El pozo fue perforado con equipo rotativo a 70 metros de profundidad y capta un acuífero libre en gravas.
  > 
  > Se realizó visita técnica, se verificó la ausencia de pozos con concesión en un radio de 500 metros y se recibió concepto favorable sobre el uso del suelo.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > La prueba de bombeo de veinticuatro horas arrojó un nivel dinámico estable a 1,5 litros por segundo, con un descenso acumulado inferior al límite de referencia del acuífero. El análisis de interferencia con los pozos vecinos registrados concluye que el efecto sobre ellos es mínimo.
  > 
  > La Empresa propone instalar una caseta de bombeo con contención para el almacenamiento de combustibles, así como un sello sanitario en la boca del pozo. Sin embargo, el plano del área no muestra la distancia entre el pozo y el tanque de combustible de la planta eléctrica de obra, que la visita estimó en menos de quince metros. Tampoco se describe el sistema de drenaje del predio, que podría dirigir aguas de escorrentía contaminadas hacia la zona de recarga del pozo.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > El Decreto 1076 de 2015 regula el otorgamiento de concesiones de aguas subterráneas y exige la protección del acu […]

### AMB-CAG-005

- **Título:** Requerimiento por vertimiento de aguas de lavado de cimentaciones sin permiso en zona andina
- **Tipo de instrumento:** Requerimiento
- **Qué ordena:** Suspender de inmediato el vertimiento de aguas de lavado de la torre 14, instalar sedimentador y trampa de grasas en cinco días, presentar solicitud de permiso de vertimiento en veinte días y caracterizar la quebrada.
- **Resumen del análisis:** Vertimiento sin permiso y sin tratamiento de aguas con alto contenido de sólidos y pH elevado hacia una quebrada usada por ganado y cultivos de consumo. La medida de suspensión inmediata y el sancionatorio son los instrumentos centrales.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La autoridad ambiental recibió reporte de la comunidad sobre agua turbia de color gris que descargaba desde la obra de cimentación de la torre 14 de la Línea Oriente 500 kV, en un municipio del departamento de Tolima, hacia una quebrada que atraviesa la vereda El Roble. Durante la visita se constató que el agua provenía del lavado de equipos de concreto y de la limpieza de excavaciones, y que se vertía sin tratamiento sobre el talud, a unos veinte metros del cauce.
  > 
  > La Empresa no tiene permiso de vertimiento para la obra ni ha presentado solicitud. El contratista de obras civiles manifestó que la descarga se realizaba desde hace seis semanas.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > Las muestras tomadas en el punto de descarga presentan sólidos suspendidos muy superiores a los valores de referencia para aguas superficiales, valores elevados de pH asociados al cemento y presencia de aceites y grasas. La quebrada es fuente de agua para abrevaderos de ganado y aguas abajo se encuentra un cultivo de hortalizas de autoconsumo.
  > 
  > El sistema de manejo de aguas de la obra carecía de sedimentador, trampa de grasas y área de lavado impermeabilizada. El plan de manejo ambiental de la obra prevé estas instalaciones, pero no fueron implementadas. La visita constató además que el talud presenta surcos de erosión por donde el agua de lavado se infiltra y llega al cauce sin pasar por ningún elemento de control.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > El Decreto 1076 de 2015 exige permiso de vertimiento p […]

### AMB-CFO-001

- **Título:** Resolución que otorga aprovechamiento forestal y fija compensación por bosque intervenido en servidumbre de Línea Norte 230 kV en Antioquia
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Otorga permiso de aprovechamiento para 412 árboles, exige compensación 1:4 con restauración de 6,8 hectáreas en seis meses y prohíbe intervenir dos nacimientos.
- **Resumen del análisis:** Caso de alto riesgo por intervención de bosque secundario avanzado y nacimientos en servidumbre. La relación de compensación pasó de 1:3 a 1:4 y se prohibió intervenir dos torres. El riesgo de sanción aumenta si no se entregan los informes semestrales con coordenadas de siembra.
- **Texto (inicio):**

  > La autoridad ambiental competente, en ejercicio de las funciones de control y aprovechamiento de los recursos naturales renovables que le asigna la Ley 99 de 1993 y el Decreto 1076 de 2015, procede a resolver la solicitud de aprovechamiento forestal y compensación presentada por la Empresa para la ejecución del proyecto Línea Norte 230 kV, tramo comprendido entre los municipios de Yarumal y Angostura, en el departamento de Antioquia. El expediente SINT-AMB-0001 reúne el concepto técnico de la subdirección de gestión ambiental, el inventario forestal del predio La Esperanza, la cartografía de las torres proyectadas y el plan de compensación radicado por el titular, cuyo contenido se evalúa en el presente acto.
  > 
  > ANTECEDENTES. Mediante radicado presentado el 12 de marzo de 2026, la Empresa solicitó autorización para el aprovechamiento de 412 individuos arbóreos ubicados dentro de la franja de servidumbre de 30 metros a cada lado del eje de la línea, con un volumen estimado de 186 metros cúbicos. La visita técnica del 19 de abril de 2026 verificó la presencia de especies nativas del bosque andino, entre ellas cedro, laurel y roble, y constató que tres de las torres proyectadas se ubican sobre zonas de nacimiento de agua que requieren un tratamiento diferencial. Adicionalmente, el titular aportó un listado de propietarios colindantes y las constancias de publicación del aviso en la cartelera de la alcaldía.
  > 
  > CONSIDERACIONES TÉCNICAS. El inventario forestal presenta un error de mue […]

### AMB-CFO-002

- **Título:** Concepto técnico que valida compensación por remoción de cobertura vegetal en franja de servidumbre de Línea Centro 115 kV en Tolima
- **Tipo de instrumento:** Concepto técnico
- **Qué ordena:** Recomienda aprobar la compensación de 3,1 hectáreas y condicionarla a la georreferenciación de los sitios de siembra y al ajuste del cronograma al periodo de lluvias.
- **Resumen del análisis:** Concepto que valida un plan de compensación de 3,1 hectáreas con especies nativas, pero observa falta de georreferenciación en dos sitios de siembra. El riesgo es medio porque el cumplimiento depende de la entrega de coordenadas corregidas y de un contrato de uso vigente.
- **Texto (inicio):**

  > El presente concepto técnico se rinde dentro del trámite de compensación por remoción de cobertura vegetal asociada a la Línea Centro 115 kV, en el municipio de Ibagué, departamento del Tolima. Se evalúa la información entregada por la Empresa en el expediente SINT-AMB-0002, que incluye el censo de cobertura en la franja de servidumbre, el mapa de uso del suelo, la propuesta de compensación y el cronograma de siembra. La evaluación se hace con base en la visita de campo realizada por el equipo técnico de la corporación autónoma regional y en los datos de la plataforma de seguimiento de compensaciones.
  > 
  > ANTECEDENTES. La Empresa informó la intervención de 3,1 hectáreas de cobertura compuesta por rastrojo y pastos enmalezados dentro de la servidumbre, a lo largo de 4,7 kilómetros de trazado. El titular propone compensar esa área mediante siembra de especies nativas en el predio El Mirador, de propiedad de un tercero con contrato de uso firmado, con una densidad de 1.100 individuos por hectárea. Se aportó además un acta de concertación con la comunidad vecina sobre las labores de limpieza y el manejo de residuos de poda.
  > 
  > ANÁLISIS TÉCNICO. El censo de cobertura es consistente con la cartografía entregada y no se detectaron individuos de especies vedadas. Sin embargo, dos de los cuatro sitios de siembra propuestos carecen de coordenadas georreferenciadas en el sistema oficial, lo cual impide verificar su ubicación y su relación con la cuenca de la quebrada Santa Bárbara. La densid […]

### AMB-CFO-003

- **Título:** Requerimiento por tala de árboles para torres de Línea Caribe 110 kV sin permiso de aprovechamiento vigente en Cesar
- **Tipo de instrumento:** Requerimiento
- **Qué ordena:** Exige suspender la tala no autorizada, presentar en quince días el inventario de individuos retirados y proponer una reposición de al menos el doble de individuos.
- **Resumen del análisis:** Tala de 58 árboles en apertura de accesos sin permiso vigente y con solicitud aún en trámite. Riesgo alto por posible procedimiento sancionatorio y medida de suspensión del tramo, además de la reposición exigida.
- **Texto (inicio):**

  > La autoridad ambiental competente requiere a la Empresa en relación con la intervención de vegetación arbórea realizada en el marco de la construcción de la Línea Caribe 110 kV, en el municipio de Valledupar, departamento del Cesar. El requerimiento se origina en un reporte de la comunidad y en una visita de control realizada por el equipo de seguimiento, que constató la tala de individuos arbóreos en la base de dos torres sin que existiera permiso de aprovechamiento forestal vigente. El caso queda consignado en el expediente SINT-AMB-0003.
  > 
  > ANTECEDENTES. La Empresa había radicado una solicitud de aprovechamiento para 74 árboles, la cual se encontraba en trámite y no había sido resuelta. Según el informe de la visita, al menos 58 individuos de especies como ceiba, guácimo y algarrobo fueron retirados antes de la expedición de acto alguno que autorizara la intervención. El titular alegó que la tala correspondió a la apertura de accesos de emergencia para el izaje de estructuras, situación que debió ser comunicada con antelación a la autoridad y no fue reportada.
  > 
  > CONSIDERACIONES. El aprovechamiento forestal sin permiso es una conducta que afecta los recursos naturales renovables y que configura un hecho susceptible de procedimiento sancionatorio, de acuerdo con lo dispuesto en la Ley 1333 de 2009. Aunque la obra es de interés público, la normatividad exige que toda intervención de bosque o de árboles aislados cuente con autorización previa. La alegación de urgencia no exime de […]

### AMB-CFO-004

- **Título:** Auto que decreta visita técnica y suspende solicitud de aprovechamiento forestal para apertura de accesos a torres en Santander
- **Tipo de instrumento:** Auto
- **Qué ordena:** Ordena visita técnica en veinte días hábiles y suspende la evaluación del aprovechamiento hasta contar con inventario completo, plano corregido y listado de especies del guadual.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > La autoridad ambiental competente, mediante el presente auto, dispone practicar visita técnica de verificación dentro del trámite de aprovechamiento forestal solicitado por la Empresa para la apertura de accesos a las torres de la Línea Río Sogamoso 115 kV, en jurisdicción del municipio de Barrancabermeja, departamento de Santander. El trámite se identifica con el número SINT-AMB-0004 y se encuentra en la etapa de evaluación técnica del inventario y de la propuesta de manejo.
  > 
  > ANTECEDENTES. La solicitud pretende el aprovechamiento de 96 individuos dispersos y de un fragmento de guadual de 0,4 hectáreas, ubicados en tres predios distintos. El inventario presentado no incluye las coordenadas de los individuos del predio tercero ni la identificación de las especies del guadual, y el plano de accesos no coincide con la ubicación de las torres T-5 y T-6 del trazado aprobado.
  > 
  > CONSIDERACIONES. Antes de emitir pronunciamiento sobre el fondo de la solicitud, la autoridad requiere verificar en campo la presencia de especies con algún grado de amenaza, la existencia de fuentes de agua en el trayecto de los accesos y la correspondencia entre el plano y la realidad del terreno. El Decreto 1076 de 2015 exige que el solicitante presente un inventario completo y debidamente georreferenciado, de manera que la verificación no puede limitarse a la documentación aportada.
  > 
  > DECIDE. Primero. Decretar visita técnica de verificación en los predios identificados, a realizarse en un plazo no mayor a […]

### AMB-CFO-005

- **Título:** Resolución que impone seguimiento reforzado por incumplimiento parcial del plan de compensación forestal en Caldas
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Declara incumplimiento parcial, ordena reponer el 40 % de individuos muertos en cuatro meses, impone seguimiento trimestral y exige ajuste técnico con control de gramíneas.
- **Resumen del análisis:** Supervivencia del 58 % frente al 80 % exigido, con tres sitios por debajo del 40 % y dos informes omitidos. Riesgo medio porque la reposición es viable, pero obliga a un presupuesto adicional y a informes trimestrales durante dos años.
- **Texto (inicio):**

  > La autoridad ambiental competente, en ejercicio de sus funciones de seguimiento a los permisos ambientales, resuelve el resultado de la evaluación del plan de compensación forestal asociado a la Línea Occidente 230 kV, en el municipio de Manizales, departamento de Caldas. El expediente SINT-AMB-0005 contiene el informe de seguimiento del segundo año, la caracterización de supervivencia por sitio y la respuesta de la Empresa a la comunicación previa de incumplimiento.
  > 
  > ANTECEDENTES. El plan aprobado preveía la siembra de 2.300 individuos de especies nativas en 4,2 hectáreas, con una supervivencia mínima del 80 % al cabo de dos años. El informe de seguimiento reporta una supervivencia promedio del 58 %, con tres sitios por debajo del 40 %, y la falta de dos informes trimestrales en el periodo evaluado. La Empresa atribuyó la mortalidad a una sequía prolongada y a la invasión de gramíneas, y comunicó la contratación de un operador adicional para el mantenimiento.
  > 
  > CONSIDERACIONES. La sequía es un evento que la Empresa debía contemplar en el plan, y la invasión de gramíneas era un riesgo previsible que el plan no abordó con medidas de control específicas. La reposición de individuos y el mantenimiento intensivo son las medidas adecuadas para corregir el incumplimiento, pero el plan requiere un ajuste técnico que considere riego de auxilio y control mecánico de gramíneas durante la fase de establecimiento. Los incumplimientos documentales deben corregirse en el corto plazo.
  > 
  > RESUE […]

### AMB-LIC-001

- **Título:** Resolución que decide modificación de licencia ambiental de Línea Sur 115 kV por cambio de trazado en Huila
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Aprueba el cambio de trazado de 9,4 kilómetros, suspende obras en el cruce de la quebrada El Recreo y exige estudio de avifauna y nuevo estudio de impacto en sesenta días.
- **Resumen del análisis:** Modificación de licencia por cambio de trazado que cruza zona de reserva hídrica y bosque de galería. Riesgo alto por la necesidad de un nuevo estudio de impacto, la suspensión de obras en el cruce y la posible caducidad parcial si no se cumplen los plazos.
- **Texto (inicio):**

  > La autoridad ambiental competente decide la solicitud de modificación de la licencia ambiental otorgada para la Línea Sur 115 kV, con ocasión del cambio de trazado propuesto por la Empresa en el municipio de Neiva, departamento del Huila. El expediente SINT-AMB-0006 contiene la solicitud de modificación, el estudio de impacto ambiental complementario, el concepto técnico del equipo evaluador y las observaciones presentadas durante el periodo de publicación del aviso.
  > 
  > ANTECEDENTES. La licencia original autorizó un trazado de 38 kilómetros, con dos cruces de cuerpos de agua y un área de servidumbre de 22 metros de ancho. Por razones de ordenamiento territorial, la Empresa propone desplazar 9,4 kilómetros del trazado hacia el oriente, lo que implica el cruce de la quebrada El Recreo, que hace parte de una zona de reserva hídrica declarada por el municipio, y la intervención de 14 hectáreas adicionales de bosque de galería.
  > 
  > CONSIDERACIONES TÉCNICAS. El estudio complementario no caracteriza la avifauna asociada al bosque de galería, ni precisa la distancia entre los puntos de anclaje de las torres y el cauce. La modificación cambia de manera sustancial el componente de medio biótico y, por ello, no puede tramitarse como un simple ajuste de cartografía. El concepto técnico concluye que el cambio de trazado es ambientalmente viable solo si se incorporan un estudio de avifauna en dos temporadas, un diseño de cruce subterráneo o elevado sobre la quebrada y un plan de restauración de […]

### AMB-LIC-002

- **Título:** Oficio que solicita información adicional para tramitar modificación de licencia de línea de transmisión en Meta
- **Tipo de instrumento:** Oficio
- **Qué ordena:** Solicita cartografía del nuevo trazado, censo de usuarios, cronograma por frente de obra y acuerdo escrito del predio ganadero en treinta días calendario.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > La autoridad ambiental competente se dirige a la Empresa en el marco de la solicitud de modificación de la licencia ambiental de la Línea Llanos 230 kV, en el municipio de Villavicencio, departamento del Meta. La solicitud se identifica en el expediente SINT-AMB-0007 y se encuentra en evaluación preliminar, por lo que se hace necesario completar la información antes de iniciar el análisis de fondo.
  > 
  > ANTECEDENTES. La Empresa radicó una solicitud para ajustar el trazado en un tramo de 6 kilómetros, con el fin de evitar una zona de inundación identificada en la revisión del plan de ordenamiento. La solicitud menciona la necesidad de reubicar cuatro torres y de ampliar el área de servidumbre en un predio de uso ganadero, pero no contiene la información mínima exigida para la modificación.
  > 
  > INFORMACIÓN REQUERIDA. Para continuar el trámite, la autoridad solicita a la Empresa: primero, la cartografía actualizada del nuevo trazado en el sistema de referencia oficial, con la identificación de las torres reubicadas y de los predios afectados; segundo, el censo de usuarios del predio, incluyendo la identificación de las viviendas y de las fuentes de agua de uso doméstico ubicadas a menos de cien metros de la servidumbre; tercero, el cronograma de obra por frente de trabajo, con la indicación de los periodos de intervención de cauces y de movimientos de tierra.
  > 
  > ADICIONALMENTE. Se solicita precisar si el nuevo trazado requiere aprovechamiento forestal, remoción de cobertura o captación d […]

### AMB-LIC-003

- **Título:** Resolución que otorga licencia ambiental para construcción de Subestación S-14 en Bolívar
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Otorga licencia para la Subestación S-14 con foso de contención de aceites, monitoreo semestral de ruido, compensación de 2,0 hectáreas en nueve meses y plan de contingencia.
- **Resumen del análisis:** Licencia nueva para subestación en zona agrícola con viviendas a menos de 400 metros. Riesgo medio por la cercanía a viviendas, el manejo de aceites aislantes y la exigencia de monitoreo de ruido en plena carga.
- **Texto (inicio):**

  > La autoridad ambiental competente resuelve la solicitud de licencia ambiental para la construcción y operación de la Subestación S-14, de 115/34,5 kV, en el municipio de Magangué, departamento de Bolívar. El expediente SINT-AMB-0008 contiene el estudio de impacto ambiental, el plan de manejo, el concepto técnico del grupo evaluador, la constancia de la visita de viabilidad y las observaciones de los vecinos del predio.
  > 
  > ANTECEDENTES. La subestación se ubicará en un predio de 3,6 hectáreas, de uso agrícola, a unos 180 metros de la vía terciaria que comunica con el casco urbano, y a menos de 400 metros de un conjunto de viviendas rurales. La obra incluye el movimiento de tierras para la plataforma, la instalación de transformadores con aceite aislante, un sistema de drenajes pluviales y la compensación por la remoción de 2,0 hectáreas de vegetación de rastrojo bajo.
  > 
  > CONSIDERACIONES. Desde el punto de vista técnico, la subestación es viable siempre que se garanticen las medidas de manejo de suelos, la contención de aceites en caso de falla de los transformadores y el control de ruido durante la operación. El estudio de ruido proyecta niveles de 52 decibeles en el límite del predio, por debajo del máximo permitido para la zona rural, pero el monitoreo debe realizarse con la subestación en plena carga. La compensación por la vegetación removida es proporcional a la afectación y se considera adecuada.
  > 
  > La normatividad vigente permite otorgar la licencia para proyectos de infraestr […]

### AMB-LIC-004

- **Título:** Concepto técnico sobre condiciones ambientales para subestación nueva en zona de sabanas de Córdoba
- **Tipo de instrumento:** Concepto técnico
- **Qué ordena:** Concluye que el proyecto es viable y recomienda incluir monitoreo de ruido, control de escorrentía con trampa de sedimentos y registro de consumo de agua de servicio.
- **Resumen del análisis:** Concepto favorable con recomendaciones de monitoreo y control de sedimentos. Riesgo bajo porque no hay intervención de cuerpos de agua permanentes ni de bosque, aunque el canal temporal requiere vigilancia durante la obra.
- **Texto (inicio):**

  > El presente concepto técnico analiza la viabilidad ambiental de la Subestación Sabanas Norte 115 kV, proyectada en el municipio de Montería, departamento de Córdoba, dentro del trámite de licencia ambiental que se identifica con el expediente SINT-AMB-0009. El documento fue elaborado por el grupo de evaluación de proyectos de infraestructura eléctrica, con base en el estudio de impacto presentado por la Empresa y en la visita de viabilidad realizada en el sitio propuesto.
  > 
  > ANTECEDENTES. La subestación ocupará un lote de 2,4 hectáreas en zona de sabana intervenida, con uso ganadero extensivo y cultivos de pasto. El proyecto contempla la construcción de una caseta de control, dos bahías de transformación, un tanque para el manejo de agua de servicio y un sistema de drenajes que descarga a un canal natural temporal que desemboca en un humedal estacional de la zona.
  > 
  > ANÁLISIS TÉCNICO. El área no presenta ecosistemas boscosos ni especies vedadas en el censo, por lo que no se requiere aprovechamiento forestal. El principal componente de atención es el drenaje hacia el canal natural, el cual puede arrastrar sedimentos durante la construcción. El estudio propone una trampa de sedimentos y un control de escorrentía, medidas que se consideran suficientes siempre que se implementen antes del inicio del movimiento de tierras y se mantengan durante toda la fase constructiva.
  > 
  > CONCLUSIÓN. El proyecto es ambientalmente viable. Se recomienda incluir en las obligaciones de la licencia un moni […]

### AMB-LIC-005

- **Título:** Requerimiento por incumplimiento de obligaciones de seguimiento en obras de Línea Oriente 230 kV en Casanare
- **Tipo de instrumento:** Requerimiento
- **Qué ordena:** Exige en diez días calendario remitir informes atrasados y bitácora de cauces, retirar el acopio de la margen, instalar bandejas de contención y presentar el plan de contingencia.
- **Resumen del análisis:** Obligaciones de seguimiento incumplidas durante tres meses de obra, con intervenciones en drenajes sin bitácora y manejo inadecuado de aceites. Riesgo alto por posible procedimiento sancionatorio y medidas preventivas sobre la obra.
- **Texto (inicio):**

  > La autoridad ambiental competente requiere a la Empresa por el incumplimiento de las obligaciones de seguimiento impuestas en la licencia ambiental de la Línea Oriente 230 kV, cuyas obras se ejecutan en jurisdicción del municipio de Yopal, departamento de Casanare. El requerimiento se consigna en el expediente SINT-AMB-0010 y se origina en la revisión documental y en una visita de control realizada durante la fase de construcción de torres y tendido.
  > 
  > ANTECEDENTES. La licencia impone la presentación de informes mensuales de seguimiento, la bitácora de manejo de cauces con los registros de cada intervención, y el plan de contingencia por derrame de hidrocarburos asociado al uso de maquinaria. Durante los últimos tres meses de obra, la Empresa presentó dos de los seis informes exigidos y no ha entregado la bitácora de cauces, pese a que se registraron intervenciones en tres drenajes.
  > 
  > HECHOS CONSTATADOS. En la visita de control se observó un acopio de material sobre la margen de un drenaje sin cobertura, así como una zona de cambio de aceite de maquinaria a menos de cincuenta metros del cauce, sin bandeja de contención. El titular informó que el personal de campo no había recibido la instrucción sobre el procedimiento de registro, y que el plan de contingencia se encontraba en revisión interna.
  > 
  > CONSIDERACIONES. Las obligaciones de seguimiento son parte integral de la licencia y su incumplimiento constituye una conducta que afecta el ejercicio del control ambiental, de acuerdo […]

### AMB-OCC-001

- **Título:** Permiso de ocupación de cauce para cruce aéreo de Línea Sur 115 kV sobre la quebrada El Silencio
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Otorgar permiso de ocupación de cauce para el cruce aéreo de la Línea Sur 115 kV sobre la quebrada El Silencio, con altura libre mínima de dos metros sobre la cota de avenida, prohibición de depósitos en la ronda, compensación forestal en sesenta días y aviso previo de obras.
- **Resumen del análisis:** Permiso favorable para un cruce aéreo que no interviene el lecho, pero condicionado. El riesgo está en la verificación de la altura libre con caudal de avenida, que el modelo hidrológico no contempla de forma completa, y en la compensación de la tala dentro de la franja protectora. Conviene revisar que el plan de compensación tenga cronograma y que la topografía posterior al tendido quede en el expediente antes de la energización.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa, titular de la Línea Sur 115 kV, radicó solicitud de permiso de ocupación de cauce para el cruce aéreo del conductor sobre la quebrada El Silencio, en jurisdicción de un municipio del Oriente antioqueño. La solicitud se acompañó de la memoria técnica del proyecto, planos de planta y perfil del cruce, el estudio hidrológico de la quebrada con período de retorno de cien años y el plan de manejo ambiental del tramo.
  > 
  > En visita técnica practicada por el equipo de la corporación autónoma regional se verificó la existencia de la quebrada, su ronda hídrica y dos apoyos existentes a ambas márgenes. Se constató que el cruce proyectado afecta un tramo aproximado de cuarenta metros del cauce y que no existe intervención del lecho siempre que los apoyos se mantengan fuera de la ronda.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El estudio hidrológico demuestra que la altura libre entre el conductor más bajo y el nivel de aguas máximas es suficiente, pero el modelo utilizado no incluye el efecto de la vegetación arrastrada en crecientes súbitas. Por ello se exige una verificación adicional con caudal de avenida y un margen de seguridad de dos metros sobre la cota de inundación calculada.
  > 
  > La servidumbre de paso se encuentra en la franja de protección de la quebrada, donde el Decreto 1076 de 2015 restringe la tala de vegetación protectora. La Empresa propone retirar únicamente los individuos que interfieran con la distancia de seguridad eléctrica, lo cual resulta razonable si se co […]

### AMB-OCC-002

- **Título:** Requerimiento de información técnica para cruce de línea sobre el río Negro del Sur
- **Tipo de instrumento:** Requerimiento
- **Qué ordena:** Requerir la complementación de la solicitud de ocupación de cauce en noventa días, con modelación hidráulica bidimensional, estudio de socavación en dos torres cercanas a la orilla y plano con predios y captaciones; no iniciar obras en la ronda mientras el trámite esté pendiente.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa radicó solicitud de permiso de ocupación de cauce para el cruce de la Línea Sur 115 kV sobre el río Negro del Sur, en un tramo de la cuenca media en jurisdicción de un municipio del Tolima. La solicitud se radicó sin el estudio de socavación en pilas ni el concepto de la autoridad de gestión del riesgo del municipio.
  > 
  > La corporación revisó el expediente y encontró que la documentación aportada es insuficiente para emitir una decisión de fondo. Se advierte que el proyecto contempla dos torres a menos de treinta metros de la orilla, cuya cimentación podría verse afectada por la dinámica de migración lateral del cauce.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > La modelación hidráulica presentada utiliza una sección transversal única y no incorpora los registros de crecientes de los últimos cinco años, pese a que el río presenta episodios de desbordamiento documentados en la zona. La corporación requiere una modelación bidimensional con caudales de diseño y un análisis de socavación general y local en las dos torres próximas a la orilla.
  > 
  > Asimismo, el plano de implantación no identifica los predios colindantes ni la ubicación de las captaciones de agua para uso doméstico que operan aguas abajo del cruce.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > De conformidad con el artículo 17 de la Ley 1437 de 2011, la autoridad puede requerir la complementación de la solicitud cuando la información presentada no permite adoptar una decisión. La solicitud se encuentra suspendida hasta que se aport […]

### AMB-OCC-003

- **Título:** Auto de inicio de evaluación para acceso vial temporal que ocupa cauce de quebrada La Arenosa
- **Tipo de instrumento:** Auto
- **Qué ordena:** Iniciar la evaluación del permiso de ocupación de cauce para un acceso vial temporal sobre la quebrada La Arenosa; presentar en treinta días el diseño hidráulico de los box culverts y el plan de manejo de sedimentos, y suspender el relleno de la margen.
- **Resumen del análisis:** Solicitud de ocupación de cauce para un acceso vial temporal con box culverts y relleno en la margen de una quebrada que abastece acueductos veredales. El aspecto crítico es la falta de diseño hidráulico y de plan de sedimentos, además de la presencia de comunidad aguas abajo que ya manifestó preocupación. El auto no decide el fondo, pero la empresa debe anticipar la documentación para evitar una suspensión prolongada y definir la restauración de la ronda como condición de cierre.
- **Texto (inicio):**

  > CONSIDERANDO
  > 
  > Que la Empresa solicitó permiso de ocupación de cauce para la construcción de un acceso vial temporal de ciento veinte metros, necesario para el transporte de estructuras metálicas hacia la Subestación S-07, sobre la quebrada La Arenosa, en un municipio de Caldas.
  > 
  > Que el acceso proyectado requiere instalar dos box culverts y rellenar parcialmente la margen izquierda de la quebrada, lo cual implica intervención directa del lecho y de la ronda hídrica durante la fase de construcción.
  > 
  > Que la quebrada La Arenosa abastece acueductos veredales aguas abajo, y que la comunidad manifestó en el aviso de publicación su preocupación por el aumento de sedimentos durante las obras.
  > 
  > Que el expediente contiene la descripción del método constructivo, pero no incluye el diseño hidráulico de los box culverts ni el plan de manejo de sedimentos.
  > 
  > CONSIDERACIONES
  > 
  > La intervención de la ronda es procedente sólo de manera temporal y debe ser reversible. La estabilidad de la margen depende del diseño de la protección y de la compactación del relleno, aspectos que no han sido demostrados.
  > 
  > La corporación advierte que la ocupación de cauce sin permiso constituye infracción ambiental, y que el acceso proyectado no puede ejecutarse hasta que se resuelva de fondo la solicitud.
  > 
  > Se observa además que el expediente no define la vida útil del acceso ni el plazo de desmantelamiento. La Empresa indica que el acceso será temporal, pero no describe el cronograma para retirar los box culverts, re […]

### AMB-RES-001

- **Título:** Requerimiento de inventario reconciliado de equipos con PCB en Subestación S-18
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Presentar en sesenta días un inventario de PCB reconciliado con el registro de activos, con muestreo por equipo, plan de eliminación con gestor autorizado y lugar de almacenamiento con contención.
- **Resumen del análisis:** Inventario de PCB con dos métodos de muestreo no homologados y diferencia de doce a dieciséis condensadores frente al registro de activos. El punto crítico es la falta de almacenamiento temporal definido mientras se completa el retiro.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa presentó el inventario de equipos eléctricos de la Subestación S-18, ubicada en zona rural de un municipio del departamento del Valle del Cauca, en cumplimiento de la obligación de identificar bifenilos policlorados en equipos instalados antes de 1990. El inventario lista cuatro transformadores de potencia, siete interruptores en aceite y dieciséis condensadores de compensación, con los resultados de pruebas de laboratorio de muestras de aceite tomadas en campo.
  > 
  > Los resultados indican que dos transformadores y ocho condensadores presentan concentraciones de PCB superiores a 50 partes por millón, lo que los clasifica como equipos contaminados. El inventario no incluye la fecha prevista de retiro ni el gestor autorizado que recibirá los residuos.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > La clasificación técnica se basa en los análisis de laboratorio aportados. Sin embargo, el inventario mezcla dos métodos de muestreo, uno en aceite de transformador y otro en residuos de limpieza de carcasa, sin justificar la equivalencia de resultados. Además, el listado de condensadores no coincide con el registro de activos de la Empresa, que reporta doce unidades en la misma subestación.
  > 
  > El plan de eliminación propuesto contempla el retiro progresivo de los equipos durante el próximo año, pero no define una estrategia de contingencia para el almacenamiento temporal mientras se completa la descontaminación. La Empresa no ha identificado el lugar de almacenamiento ni las condicion […]

### AMB-RES-003

- **Título:** Resolución por derrame de aceite dielectrico que alcanzó quebrada con acueducto veredal
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Remediar suelo y cauce con gestor autorizado, muestrear agua en diez días, ajustar la tina de contención al 110 por ciento en sesenta días y coordinar la notificación con el acueducto.
- **Resumen del análisis:** Derrame de aceite dieléctrico con llegada a una quebrada que abastece un acueducto veredal. Hay incumplimiento del diseño de contención aprobado y se abre sancionatorio. Es prioritario verificar la calidad del agua y la coordinación con el operador.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > El operador del acueducto de la vereda La Cuchilla, en un municipio del departamento de Antioquia, comunicó a la autoridad ambiental un derrame de aceite dieléctrico ocurrido durante una tormenta en la Subestación S-30. Según el reporte de la Empresa, se perdieron aproximadamente 1.500 litros de aceite de un transformador de potencia cuando la tina de contención falló por rebose de agua lluvia y la descarga llegó al canal de drenaje perimetral.
  > 
  > El canal desemboca en una quebrada que abastece el acueducto veredal, situado a 1,2 kilómetros aguas abajo. El operador suspendió la captación durante cuarenta y ocho horas y pidió medidas urgentes.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > La Empresa reportó la emergencia a las seis horas del evento y activó el plan de contingencia con barreras absorbentes y retiro de la capa superficial de suelo. Sin embargo, el reporte inicial no cuantificó el volumen que alcanzó el cauce. Los análisis de agua tomados por el operador en el punto de captación muestran presencia de hidrocarburos totales por encima del valor de referencia, aunque no se detectaron PCB en las muestras analizadas.
  > 
  > La tina de contención del transformador tenía una capacidad inferior al 110 por ciento del volumen de aceite del equipo, lo que incumple el diseño exigido en el plan de manejo aprobado. El mantenimiento de las bocas de drenaje no se encontraba documentado en los últimos dieciocho meses. Según el registro de la cuadrilla, el canal perimetral había sido limpiado […]

### AMB-RES-004

- **Título:** Requerimiento por derrame menor de aceite de transformador de poste en corredor de línea
- **Tipo de instrumento:** Requerimiento
- **Qué ordena:** Retirar en quince días el material impregnado a gestor autorizado con manifiesto, caracterizar el suelo remanente en veinte días y presentar plan de remediación si se supera la referencia.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa reportó un derrame de aproximadamente 80 litros de aceite dieléctrico desde un transformador de poste instalado sobre el corredor de la Línea Oriente 500 kV, en un tramo rural de un municipio del departamento del Cesar. El evento fue detectado por un habitante de la zona, que alertó a la autoridad. La Empresa indica que el equipo presentó una fuga por el sello de la tapa y que el aceite se infiltró en un área de pastos de unos veinte metros cuadrados.
  > 
  > La Empresa aportó un registro fotográfico del sitio, la orden de trabajo de la cuadrilla que realizó la limpieza inicial y el reporte de cambio del transformador.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > La limpieza inicial consistió en retirar con pala la capa superficial de suelo y disponerla en bolsas plásticas, que fueron almacenadas junto al poste. No se cuenta con caracterización del suelo remanente. El registro fotográfico no permite establecer si el aceite alcanzó el nivel freático ni si llegó al cauce de una zanja cercana al predio.
  > 
  > El material retirado no ha sido entregado a un gestor autorizado. Las bolsas permanecen en el sitio sin contención ni señalización, lo que representa un riesgo de dispersión por lluvia. La orden de trabajo indica que el transformador retirado fue llevado al depósito de la Empresa sin registro de su estado ni de su contenido de aceite residual.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > El aceite usado y el suelo impregnado son residuos peligrosos que deben gestionarse con manifiesto de entrega […]

### AMB-RUI-001

- **Título:** Requerimiento por niveles de presión sonora nocturnos en Subestación S-22
- **Tipo de instrumento:** Requerimiento
- **Qué ordena:** Presentar en sesenta días un estudio de ingeniería acústica con medidas para cumplir 45 dB(A) nocturnos en el receptor R2, monitoreo de doce noches y programa de información a la comunidad.
- **Resumen del análisis:** Caso de ruido nocturno de transformadores con excedencia sostenida en un solo receptor. La Empresa tiene una medida de mitigación insuficiente y una línea base débil. Conviene revisar el alcance del estudio acústico y cuidar la trazabilidad del programa comunitario, porque su incumplimiento abre sancionatorio.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa remitió a la autoridad ambiental competente el informe de monitoreo de ruido de la Subestación S-22, ubicada en zona rural de un municipio del departamento de Boyacá y asociada a la Línea Oriente 500 kV. El informe reporta mediciones nocturnas realizadas durante catorce días con sonómetro clase 1, calibrado antes y después de cada campaña, en tres receptores identificados en la vereda El Cerrito.
  > 
  > La autoridad ambiental evaluó el informe frente a los niveles máximos permisibles de la Resolución 627 de 2006 para zonas con uso residencial. Los registros nocturnos del punto R2, el más cercano a la caseta de transformadores, muestran valores promedio de 58 dB(A), por encima del límite de 45 dB(A) previsto para ese horario en la zona de tratamiento. Los puntos R1 y R3 presentan valores inferiores, pero sin cumplir de forma sostenida en todas las campañas.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El análisis técnico identifica como fuente dominante el zumbido de baja frecuencia de los transformadores de potencia, con componentes tonales a 100 Hz y 200 Hz. El informe de la Empresa atribuye el incremento a la carga térmica del equipo durante las horas de mayor demanda, pero no presenta una evaluación del aislamiento acústico de la caseta ni del efecto de la vegetación de borde. La medición de línea base previa a la operación, aportada en el expediente, tiene una duración de solo tres noches y no permite descartar la variación estacional.
  > 
  > La autoridad considera que la Empr […]

### AMB-RUI-004

- **Título:** Concepto técnico sobre zumbido de subestación y comunidad de Santander
- **Tipo de instrumento:** Concepto técnico
- **Qué ordena:** Realizar medición directa de cinco noches en la vivienda más cercana y dos puntos adicionales, recalibrar el modelo de propagación con datos de sitio y no ordenar traslado en esta etapa.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > El presente concepto técnico se emite con ocasión de la queja presentada por habitantes de la vereda Las Palmas, en un municipio del departamento de Santander, frente al zumbido que perciben desde la Subestación S-31, la cual conecta un tramo de la Línea Oriente 500 kV con la red regional. La queja describe molestias al descanso y dolores de cabeza atribuidos al ruido, y solicita el traslado de la estación.
  > 
  > La Empresa aportó un estudio de propagación sonora realizado con modelo de simulación en campo abierto, que estima niveles de 41 dB(A) en la vivienda más cercana durante la noche, por debajo del límite aplicable para zona rural de uso mixto.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El modelo de propagación utilizado no incorpora la topografía del valle ni la temperatura de inversión frecuente en la zona durante las noches, factores que incrementan la propagación del sonido en horas nocturnas. La simulación supone una potencia sonora de los transformadores obtenida de la ficha del fabricante, sin verificación en sitio después de la puesta en servicio.
  > 
  > El concepto considera razonable la solicitud de verificación en campo. El traslado de la estación no es una medida proporcional mientras no se haya demostrado un incumplimiento de los niveles de emisión mediante mediciones directas. Tampoco se encontró en el expediente un registro de quejas previas que permita asociar el malestar con un evento particular de operación, por lo que la evaluación debe apoyarse en la medición de […]

### AMB-RUI-005

- **Título:** Resolución que exige barrera acústica perimetral en subestación de montaña
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Presentar en sesenta días una modelación acústica tridimensional con el desnivel del colegio, diseñar barrera acústica certificada, instalar monitoreo continuo y no energizar el nuevo transformador sin verificación.
- **Resumen del análisis:** Modificación de plan de manejo con ampliación de potencia cerca de un colegio rural. El modelo ignora el desnivel y la barrera propuesta podría desplazar el ruido hacia el aula. El caso exige verificación previa a la energización.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > Se revisa la solicitud de la Empresa de modificar el plan de manejo ambiental de la Subestación S-45, ubicada en un municipio del departamento de Nariño, con el fin de incorporar una ampliación de la bahía de transformación. La ampliación incrementa en un 35 por ciento la capacidad instalada y requiere un nuevo transformador de potencia de 80 MVA.
  > 
  > Durante la evaluación se conoció que la estación se encuentra a 120 metros de un centro educativo rural, y que el crecimiento de la potencia instalada podría aumentar el nivel de emisión en el perímetro.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El estudio de ruido presentado por la Empresa modela la situación de la ampliación con los niveles de emisión del transformador existente más el nuevo equipo, sin considerar la diferencia de altura entre la bahía y el colegio. El modelo arroja un nivel estimado de 49 dB(A) en el límite de la propiedad vecina en horario diurno, valor inferior al límite de 55 dB(A) para zona de tranquilidad pero no evalúa las aulas ubicadas en cota superior.
  > 
  > La Empresa propone un muro de bloque de dos metros de altura. Esta solución no ha sido evaluada en cuanto a su efecto sobre el colegio, ubicado en cota superior, donde la barrera puede resultar insuficiente o incluso desplazar el problema hacia otro punto. El estudio tampoco analiza la operación de la estación en horario de clases con los ventiladores en régimen de carga máxima.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > La modificación del plan de manejo exige que la E […]

### AMB-SAN-001

- **Título:** Auto de medida preventiva de suspensión de actividades en Subestación S-07 por vertimientos sin control
- **Tipo de instrumento:** Auto
- **Qué ordena:** Imponer medida preventiva de suspensión de lavado de transformadores y disposición de aceites en la Subestación S-07, ordenar contención y remoción de suelo contaminado con certificado de gestor en diez días, y registrar residuos peligrosos.
- **Resumen del análisis:** Medida preventiva inmediata por vertimiento de aceites dieléctricos cerca de un drenaje natural. La medida se levanta sólo con verificación en campo de la contención y la trampa de grasas, lo que significa que la operación de la subestación puede verse afectada mientras tanto. Conviene ejecutar de inmediato la limpieza certificada y documentar el registro de residuos, porque el incumplimiento de la medida abre un procedimiento sancionatorio separado.
- **Texto (inicio):**

  > CONSIDERANDO
  > 
  > Que la corporación autónoma regional, en ejercicio de la función de control y vigilancia, realizó visita de inspección a la Subestación S-07, propiedad de la Empresa, ubicada en un municipio del Valle del Cauca, en la que se observó el vertido de aguas de lavado de transformadores y aceites dieléctricos sobre el terreno, en cercanía a un drenaje natural.
  > 
  > Que en el acta de visita consta la presencia de un charco de aceite de aproximadamente quince metros cuadrados, la ausencia de trampa de grasas operativa y la falta de registro de disposición de residuos peligrosos durante los últimos seis meses.
  > 
  > Que de conformidad con el artículo 12 de la Ley 1333 de 2009, la autoridad puede imponer medidas preventivas cuando exista un hecho que atente contra el medio ambiente y se requiera actuación inmediata para evitar la continuación del daño.
  > 
  > CONSIDERACIONES
  > 
  > La situación observada presenta riesgo de contaminación del drenaje y de afectación a especies acuáticas aguas abajo. No existe en el expediente de la Empresa constancia de contención ni de limpieza del suelo impactado.
  > 
  > La medida preventiva no constituye sanción ni declara responsabilidad, y su finalidad es impedir que continúe la conducta que genera el riesgo.
  > 
  > Frente a la posible inminencia del daño, la corporación considera que la continuidad de la actividad agrava el riesgo sobre el drenaje, pues la época de lluvias incrementa la escorrentía que arrastra el aceite desde el patio de transformadores hacia la que […]

### AMB-SAN-002

- **Título:** Resolución de medida preventiva de suspensión de obras por intervención de talud sin permiso
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Suspender de forma preventiva las obras de movimiento de tierra en el talud de la servidumbre, cerrar y cubrir el material suelto en cuarenta y ocho horas, presentar estudio de estabilidad y solicitud de aprovechamiento, y restaurar la superficie excavada.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > Con ocasión de una denuncia ciudadana, la corporación constató que en la servidumbre de la Línea Sur 115 kV, en un municipio de Huila, se adelantaban movimientos de tierra para ampliar una plataforma de montaje de torre sobre un talud de pendiente pronunciada, sin contar con el permiso de aprovechamiento ni con concepto de estabilidad de taludes.
  > 
  > En la visita técnica se observó una excavación de unos ochenta metros de largo, sin protección del talud, con material suelto depositado al pie de la ladera, a escasos metros de un afluente.
  > 
  > CONSIDERACIONES
  > 
  > La intervención de talud sin estudio de estabilidad constituye un riesgo para el suelo, la cobertura vegetal y la calidad del agua del afluente. La obra se desarrolla sin un instrumento ambiental vigente que la ampare, por lo que se estima necesario suspender su ejecución de forma preventiva.
  > 
  > La medida no implica declaratoria de responsabilidad y se adopta para evitar la continuidad del hecho presuntamente infractor, en los términos del artículo 13 de la Ley 1333 de 2009.
  > 
  > La corporación tuvo en cuenta que la excavación se realizó sin señalización ni cerramiento y que, por la pendiente del talud, el material suelto puede movilizarse hacia el afluente con cualquier lluvia intensa. Esta condición, documentada en el registro fotográfico y en el acta de visita, configura un riesgo cierto de arrastre de sedimentos y no una mera posibilidad teórica, lo que justifica la medida inmediata sin esperar la formulación de car […]

### AMB-SAN-003

- **Título:** Formulación de cargos por tala no autorizada de vegetación nativa en franja de servidumbre
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Formular cargo único por tala de cuarenta y un individuos arbóreos nativos sin aprovechamiento forestal, conceder diez días para descargos y pruebas, y exigir inventario completo de intervenciones en la servidumbre con identificación de contratistas.
- **Resumen del análisis:** Formulación de cargos por tala de especies nativas dentro de la servidumbre, con la defensa de que se trató de mantenimiento preventivo. El argumento de la poda eléctrica no cubre la remoción de árboles con diámetro mayor a quince centímetros, y el inventario de la empresa no concuerda con la cubicación de la corporación. El abogado debe revisar el contrato con el contratista, la trazabilidad de la madera y la posibilidad de aportar un inventario conciliado en el término de descargos.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > Mediante acto de apertura se inició procedimiento sancionatorio contra la Empresa por la presunta tala de cuarenta y un individuos arbóreos de especies nativas en la franja de servidumbre de la Línea Sur 115 kV, en un municipio del Quindío, sin contar con el permiso de aprovechamiento forestal.
  > 
  > La inspección técnica identificó tocones recientes, restos de ramas trozadas y dos especies de la familia de los laureles con diámetro superior a quince centímetros, además de una carga de madera apilada en el borde de la vía de acceso.
  > 
  > DESCARGOS Y PRUEBAS
  > 
  > La Empresa presentó escrito de descargos en el que sostiene que la tala se realizó como parte del mantenimiento preventivo para cumplir las distancias de seguridad eléctrica, y que las podas se ejecutaron por contratista. Anexó el contrato de mantenimiento y un inventario parcial de los árboles intervenidos.
  > 
  > El expediente incluye las fotografías de la visita, el informe técnico de cubicación de madera y la copia del contrato. El inventario aportado no coincide con los individuos cuantificados por la corporación.
  > 
  > CONSIDERACIONES
  > 
  > La tala de individuos de especies nativas sin aprovechamiento forestal constituye infracción a las normas de uso de los recursos naturales renovables. La realización de mantenimiento eléctrico no exime del permiso cuando la intervención supera la poda y comprende la remoción de árboles.
  > 
  > En relación con los descargos, la Empresa no logró desvirtuar la cuantificación de la corporación. El in […]

### AMB-SAN-004

- **Título:** Resolución de cargos por poda excesiva y tala de árboles en predio de la Empresa en Caldas
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Formular cargo por tala de catorce árboles y poda excesiva de cuatro sin permiso, desestimar el cargo sobre el nacimiento de agua por falta de prueba, y conceder diez días para alegatos y pruebas adicionales.
- **Resumen del análisis:** Cargos por intervención de árboles en servidumbre con descargos basados en riesgo para la línea. El concepto municipal sólo respalda cuatro de los catorce árboles talados, de modo que la defensa de riesgo tiene alcance parcial. El nivel de riesgo es medio porque la sanción dependería del número de individuos sin soporte; conviene reunir las autorizaciones de los propietarios y evaluar un acuerdo de compensación en el término de alegatos.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La corporación inició proceso sancionatorio contra la Empresa por la intervención de dieciocho árboles en un predio de servidumbre de la Línea Sur 115 kV, ubicado en un municipio de Caldas, de los cuales catorce fueron talados en su totalidad y cuatro sometidos a poda que superó el dos tercios de la copa, según el informe de visita.
  > 
  > El procedimiento se abrió tras una queja presentada por un propietario colindante, quien señaló que los árboles hacían parte de un corredor de conexión para aves y que su tala sin aviso afectó la cobertura de un nacimiento de agua.
  > 
  > DESCARGOS
  > 
  > La Empresa reconoció la intervención de los árboles, pero indicó que se encontraban a menos de tres metros de los conductores y que sus propietarios no dieron autorización para la poda previa. Adjuntó el concepto de la autoridad municipal sobre el riesgo de caída y un registro fotográfico previo.
  > 
  > CONSIDERACIONES
  > 
  > La existencia de riesgo para la línea no justifica la tala sin el trámite de aprovechamiento o de autorización de poda, toda vez que la norma distingue entre la intervención preventiva autorizada y la ejecutada sin permiso. El concepto municipal aporta evidencia de riesgo para cuatro árboles, pero no para los catorce talados.
  > 
  > La afectación del nacimiento de agua se considera posible pero no está demostrada por el expediente, por lo que no se formula cargo sobre ese aspecto.
  > 
  > La corporación analizó la relevancia del corredor de aves señalado por el quejoso. Según la verificación en c […]

### AMB-SAN-005

- **Título:** Resolución que impone multa por incumplimiento del plan de manejo ambiental en Línea Sur 115 kV
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Imponer multa equivalente a cien salarios mínimos mensuales por incumplimiento del plan de manejo ambiental, ordenar monitoreo de ruido en la tercera torre, ejecutar la compensación forestal y señalizar el humedal en sesenta días.
- **Resumen del análisis:** Sanción por incumplimiento del PMA con multa calculada sobre la gravedad de la omisión de compensación en un humedal. La parte de monitoreo de ruido es menor y puede corregirse, pero la compensación sin ejecutar es la infracción que pesa en la multa. La empresa debe presentar pruebas de la compensación en curso y valorar el recurso de reposición dentro de los diez días, pues el cronograma aportado no tiene fecha de inicio verificable.
- **Texto (inicio):**

  > CONSIDERANDO
  > 
  > Que dentro del proceso sancionatorio adelantado contra la Empresa se formularon cargos por el incumplimiento de las obligaciones del plan de manejo ambiental de la Línea Sur 115 kV en un municipio de Cundinamarca, consistentes en la falta de reporte de monitoreo de ruido en tres torres, la omisión de la compensación forestal y la ausencia de señalización de sensibilidad ambiental en la ronda de un humedal.
  > 
  > Que la Empresa presentó descargos y no solicitó pruebas. Aportó los reportes de monitoreo de ruido de dos de las tres torres y un cronograma de compensación con fecha de inicio posterior a la verificación.
  > 
  > Que la corporación verificó que el incumplimiento de la obligación de compensación se mantiene y que el monitoreo de la tercera torre no fue realizado en ninguna de las campañas.
  > 
  > CONSIDERACIONES
  > 
  > La sanción de multa se impone con base en el artículo 40 de la Ley 1333 de 2009, considerando la gravedad de la infracción, el beneficio económico obtenido por no ejecutar el plan y la capacidad económica del infractor. Los incumplimientos de monitoreo se consideran leves, mientras que la omisión de compensación se considera grave por afectar la cobertura del humedal.
  > 
  > La corporación precisa que la graduación de la multa no considera reincidencia, pues no existen antecedentes sancionatorios previos a la Empresa por esta misma obligación en la jurisdicción. Sin embargo, se tuvo en cuenta que el requerimiento de compensación se formuló hace más de un año y que la E […]

### AMB-VED-001

- **Título:** Concepto técnico sobre levantamiento parcial de veda de epífitas para despeje de Línea Sur 115 kV
- **Tipo de instrumento:** Concepto técnico
- **Qué ordena:** Recomendar levantar parcialmente la veda de ocho helechos arborescentes sólo si la base se desplaza y los individuos afectados se trasladan con cepellón, bajo condiciones de rescate y seguimiento de supervivencia.
- **Resumen del análisis:** Concepto favorable condicionado para un levantamiento parcial de veda de epífitas en un bosque andino. La tasa de supervivencia prevista del rescate es baja, y algunas especies están en veda nacional, así que el riesgo para la población local es considerable. La empresa debe asegurar el rescate previo, la poda selectiva en lugar de tala y el seguimiento a doce meses, condiciones que el concepto convierte en requisito de la decisión.
- **Texto (inicio):**

  > OBJETO
  > 
  > El presente concepto evalúa la solicitud de levantamiento parcial de la veda de especies epífitas de la familia de las orquídeas y de bromeliáceas presentes en los forófitos de la servidumbre de la Línea Sur 115 kV, en un tramo de bosque andino de un municipio de Antioquia, con el fin de ejecutar el despeje necesario para la operación del corredor.
  > 
  > INFORMACIÓN REVISADA
  > 
  > Se revisaron el inventario de flora del tramo, el censo de epífitas por forófito, el plan de rescate y reubicación presentado por la Empresa y el informe de la visita de campo practicada por el equipo técnico de la corporación.
  > 
  > ANÁLISIS TÉCNICO
  > 
  > El inventario registra cerca de cuatrocientos individuos de epífitas sobre treinta y dos forófitos que deben intervenirse. Algunas especies se encuentran en veda nacional y su presencia en el tramo es poco frecuente en la región, por lo que la intervención implica un riesgo considerable para la población local.
  > 
  > El plan de rescate propone desprender los individuos con material de forófito, trasladarlos a un vivero de la zona y reubicarlos en árboles de la misma cuenca en un plazo máximo de noventa días. La tasa de supervivencia esperada, según la literatura y la experiencia de proyectos similares, es de alrededor del cincuenta por ciento, lo que resulta insuficiente sin un seguimiento riguroso.
  > 
  > Los forófitos que no puedan ser intervenidos sin riesgo para la línea deben ser objeto de poda selectiva y no de tala.
  > 
  > En relación con la especie, el censo reporta i […]

### AMB-VED-002

- **Título:** Resolución que levanta parcialmente la veda de epífitas en forófitos del corredor de Línea Sur 115 kV
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Levantar parcialmente la veda de una especie vedada en treinta y cinco forófitos, sólo para el despeje de la línea, con rescate previo y traslado a vivero en temporada de lluvias, prohibición de destruir individuos y reportes de supervivencia a seis y doce meses.
- **Resumen del análisis:** Levantamiento parcial de veda con condiciones estrictas de rescate y reubicación. El riesgo es bajo porque la decisión restringe el alcance a los forófitos necesarios y exige reporte de supervivencia, aunque hay una especie en veda con más de cien individuos. Lo relevante para el abogado es verificar la ejecución en temporada de lluvias y la entrega de los informes a los seis y doce meses, pues su omisión habilita la suspensión.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa solicitó el levantamiento parcial de la veda de especies epífitas en el corredor de la Línea Sur 115 kV, en un municipio de Tolima, para despejar treinta y cinco forófitos que interfieren con la distancia de seguridad de los conductores. Se acompañó el censo de epífitas, el plan de rescate y el compromiso de reubicación en la misma cuenca.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El censo identifica dos especies sin veda y una especie que sí se encuentra en veda, de la que se registraron ciento doce individuos. El plan de rescate establece que la totalidad de los individuos de la especie vedada serán desprendidos con su sustrato y trasladados a un vivero registrado, sin que se autorice su destrucción.
  > 
  > La corporación considera adecuado el protocolo de rescate y la propuesta de poda selectiva en los forófitos que pueden conservarse. La tasa de supervivencia esperada es mayor cuando el rescate se hace en época de lluvias, por lo que se fija esa temporada para la ejecución.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > El levantamiento de veda es competencia de la autoridad ambiental y debe ser motivado en la necesidad de la obra y en la inexistencia de alternativa técnica viable. El trámite incluyó la visita técnica y la publicación de la solicitud.
  > 
  > Desde el punto de vista de la especie vedada, el censo registra una distribución agregada en pocos forófitos, lo que incrementa el riesgo de extinción local si el rescate no se ejecuta con cuidado. La corporación considera que el traslado […]

### AMB-VED-003

- **Título:** Auto que requiere ajustar el plan de manejo de helechos arborescentes antes de levantar veda en Línea Norte
- **Tipo de instrumento:** Auto
- **Qué ordena:** Requerir en sesenta días el protocolo de extracción de helechos arborescentes con cepellón mínimo, carta de aceptación del centro de rescate, análisis de alternativas de diseño y no intervenir ningún individuo mientras tanto.
- **Resumen del análisis:** Solicitud de levantamiento de veda de helechos arborescentes sin protocolo técnico suficiente ni receptor acreditado para los sesenta y ocho individuos. El auto no decide, pero deja claro que el trasplante sin cepellón y sin convenio es el punto débil. Alto riesgo porque cualquier intervención anticipada constituye infracción, y la empresa debe presentar el protocolo y el análisis de diseño antes de planear la obra.
- **Texto (inicio):**

  > CONSIDERANDO
  > 
  > Que la Empresa solicitó el levantamiento parcial de la veda de helechos arborescentes presentes en la franja de servidumbre de una línea de transmisión proyectada en un municipio de Santander, denominada para efectos de este expediente Línea Norte 115 kV, con el fin de despejar la zona para la operación de dos apoyos.
  > 
  > Que el inventario presentado registra sesenta y ocho individuos de helechos arborescentes de la familia de los cyatheaceae, todos de altura superior a dos metros y con estado fitosanitario aceptable.
  > 
  > Que la solicitud propone el traslado de los individuos a un jardín botánico sin acreditar convenio de recepción ni protocolo de manejo del sustrato.
  > 
  > CONSIDERANDO TÉCNICO
  > 
  > Los helechos arborescentes presentan tasas de recuperación muy bajas tras el trasplante, especialmente cuando se extrae el tronco sin conservar el sistema radical. El plan no define el método de extracción, ni el tamaño mínimo del cepellón, ni el responsable del seguimiento.
  > 
  > La corporación advierte que la especie está sujeta a veda y que la decisión de levantamiento sólo procede cuando el plan garantice la conservación de los individuos y no existan alternativas de diseño.
  > 
  > La corporación advierte que el inventario presentado no distingue entre individuos adultos y juveniles. Los helechos juveniles, de menos de un metro de altura, suelen tolerar mejor el trasplante, pero su presencia en el área indica el potencial de regeneración de la población. La omisión de este dato impide eva […]

### AMB-VED-004

- **Título:** Requerimiento de información sobre inventario de helechos arborescentes en tramo de Línea Sur 115 kV
- **Tipo de instrumento:** Requerimiento
- **Qué ordena:** Requerir en cuarenta y cinco días el inventario completo y georreferenciado de helechos arborescentes en todo el tramo y el mapa de apoyos superpuesto sobre los individuos, sin intervenir la vegetación protegida mientras tanto.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La corporación recibió la solicitud de la Empresa para intervenir un sector de la Línea Sur 115 kV en un municipio del Cauca, en el que se localizan helechos arborescentes en la franja de servidumbre. La solicitud de levantamiento de veda fue presentada con un inventario parcial que sólo cubre los primeros dos kilómetros del tramo.
  > 
  > CONSIDERACIONES
  > 
  > La corporación requiere un inventario completo del tramo antes de evaluar la solicitud, porque la información disponible no permite determinar el número de individuos, sus alturas ni su estado sanitario en el resto de la servidumbre.
  > 
  > Además, el inventario no incluye la georreferenciación de los individuos, lo cual impide verificar si los apoyos proyectados afectan directamente a las plantas o sólo las zonas de manejo.
  > 
  > La corporación considera que el inventario parcial no es representativo del tramo completo. Los dos primeros kilómetros atraviesan un sector de pendiente moderada con cobertura de bosque secundario, mientras que el resto del corredor presenta laderas más empinadas y mayor densidad de individuos de porte alto. Extrapolar los resultados parciales al total podría subestimar el número de plantas afectadas y el esfuerzo de rescate necesario, por lo que se exige un levantamiento sistemático que cubra toda la longitud de la servidumbre.
  > 
  > El censo debe incluir la medición de la altura del tronco, el número de frondas, la presencia de daño mecánico o fitosanitario y la asociación con otras especies epífitas o […]

### AMB-VED-005

- **Título:** Resolución que impone medidas de manejo para especies vedadas durante el despeje de corredor en Boyacá
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Aprobar el plan de medidas de manejo para especies vedadas en el corredor, con suspensión en época de reproducción, inspección previa de nidos, señalización del fragmento, responsable de fauna e informe final en treinta días.
- **Resumen del análisis:** Aprobación de medidas de manejo para el despeje de un fragmento de bosque seco con especies vedadas. Las medidas son adecuadas, pero el plan debe precisar el número de inspecciones previas y la responsabilidad por hallazgos de fauna, que son puntos de conflicto frecuentes. El riesgo es medio porque la ejecución en época de reproducción o sin bitácora firmada puede dar lugar a sanciones por incumplimiento de la condición de la autorización.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La corporación autorizó mediante acto previo el levantamiento parcial de la veda sobre especies de fauna y flora asociadas a un fragmento de bosque seco en un municipio de Boyacá, para el despeje del corredor de la Línea Sur 115 kV. Dentro del trámite, la Empresa presentó un plan de medidas de manejo que debe ser aprobado antes de iniciar las actividades.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El plan incluye la verificación previa de nidos de aves en los árboles a intervenir, la suspensión de labores durante la época de reproducción, el rescate de individuos de especies vedadas y la instalación de señalización de manejo en el perímetro del fragmento. La corporación considera que estas medidas son adecuadas, aunque se requieren ajustes en los tiempos de suspensión.
  > 
  > El plan no especifica el número de inspecciones previas a la tala ni quién responde por el hallazgo de fauna durante la ejecución, aspectos que deben quedar definidos.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > La autorización de levantamiento de veda está sujeta a la aprobación de las medidas de manejo, que hacen parte de la condición para la ejecución. El incumplimiento de estas medidas constituye infracción a la norma ambiental.
  > 
  > La corporación resalta que la época de reproducción de las aves del fragmento coincide con el periodo de mayor precipitación, por lo que la suspensión de labores debe ser más amplia que la prevista en el cronograma inicial. Se ajusta la suspensión para que comprenda el periodo completo de anidación […]

### AMB-VER-001

- **Título:** Resolución que renueva permiso de vertimientos de Subestación S-22 con sistema de lodos activados en Valle del Cauca
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Renueva el permiso por cinco años con caudal de 1,8 litros por segundo, fija límites de grasas, sólidos y DQO, exige caracterización trimestral y mantenimiento mensual de la trampa de grasas.
- **Resumen del análisis:** Renovación de permiso de vertimientos de subestación con sistema de lodos activados. Riesgo medio por incumplimientos puntuales de grasas y aceites y por la exigencia de caracterización trimestral y de registro de mantenimiento.
- **Texto (inicio):**

  > La autoridad ambiental competente resuelve la solicitud de renovación del permiso de vertimientos otorgado para las aguas residuales no domésticas y domésticas de la Subestación S-22, ubicada en el municipio de Cartago, departamento del Valle del Cauca. El expediente SINT-AMB-0011 contiene la solicitud de renovación, las caracterizaciones de efluentes de los dos últimos años, el informe de operación del sistema de tratamiento y el concepto técnico del grupo de recurso hídrico.
  > 
  > ANTECEDENTES. El permiso anterior autorizó la descarga de efluentes tratados por un sistema de lodos activados hacia un canal de drenaje que desemboca en el río cercano. Las caracterizaciones presentan cumplimiento de la mayoría de parámetros, pero el valor de grasas y aceites en la descarga superó el límite en dos de los ocho muestreos, y la demanda química de oxígeno registró valores cercanos al límite en el último semestre. La Empresa solicita renovar el permiso por cinco años sin modificar el caudal autorizado.
  > 
  > CONSIDERACIONES TÉCNICAS. El sistema de lodos activados es adecuado para la carga contaminante de la subestación, que es de tipo doméstico con aportes ocasionales de aceites de mantenimiento de transformadores. El incumplimiento de grasas y aceites está asociado al mantenimiento deficiente de la trampa de grasas en las jornadas de cambio de aceite, situación que puede corregirse con un programa de mantenimiento y con registro de cada intervención. Se recomienda ajustar el monitoreo para inc […]

### AMB-VER-002

- **Título:** Auto de trámite para renovación de permiso de vertimientos de subestación en Quindío
- **Tipo de instrumento:** Auto
- **Qué ordena:** Admite la solicitud de renovación y requiere en cinco días hábiles el certificado de uso del suelo y el plan de contingencia actualizado con protocolo de sobrecarga.
- **Resumen del análisis:** Trámite de renovación con documentación casi completa, falta el certificado de uso del suelo y un plan de contingencia desactualizado. Riesgo bajo mientras se entregue la documentación en el plazo fijado.
- **Texto (inicio):**

  > La autoridad ambiental competente, mediante el presente auto, admite la solicitud de renovación del permiso de vertimientos presentada por la Empresa para la Subestación Armenia Sur 115 kV, ubicada en el municipio de Calarcá, departamento del Quindío. El trámite se identifica con el expediente SINT-AMB-0012 y se encuentra en fase de verificación de requisitos documentales antes de iniciar la evaluación técnica.
  > 
  > ANTECEDENTES. El permiso vigente autoriza la descarga de aguas residuales domésticas, tratadas en un sistema de filtro anaerobio y humedal artificial, hacia una zanja de drenaje que conduce a una quebrada de la zona. La solicitud de renovación se radicó dentro del término legal, con una antelación de tres meses frente al vencimiento del permiso actual, por lo que el trámite se considera oportuno.
  > 
  > VERIFICACIÓN DOCUMENTAL. Revisado el expediente, se encuentra que la solicitud cuenta con el formulario diligenciado, el certificado de existencia y representación de la Empresa, la descripción del sistema de tratamiento y las caracterizaciones de los últimos dos años. Sin embargo, no se aportó el certificado de uso del suelo expedido por la autoridad municipal, requisito necesario para verificar que la descarga se encuentra en un área compatible con la destinación del predio.
  > 
  > También se observa que el plan de contingencia del sistema de tratamiento corresponde a la versión anterior y no contempla el manejo de un evento de sobrecarga por lluvias intensas, aspecto que debe a […]

### AMB-VER-003

- **Título:** Requerimiento por caracterización de efluentes no entregada en subestación de Risaralda
- **Tipo de instrumento:** Requerimiento
- **Qué ordena:** Requiere en quince días hábiles las caracterizaciones de los dos últimos semestres con cadena de custodia, la justificación de la omisión y un cronograma de muestreo anual.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > La autoridad ambiental competente requiere a la Empresa por la falta de entrega de las caracterizaciones de efluentes correspondientes al permiso de vertimientos de la Subestación Cuba Alta 115 kV, ubicada en el municipio de Pereira, departamento de Risaralda. El requerimiento se soporta en el expediente SINT-AMB-0013, en el que se verificó que el titular no ha presentado las caracterizaciones de los dos últimos semestres dentro del término establecido en el permiso.
  > 
  > ANTECEDENTES. El permiso de vertimientos fue otorgado para una descarga de aguas residuales domésticas y de lavado de equipos, con un sistema de tratamiento compuesto por tanque séptico y filtro percolador. La obligación de caracterización semestral quedó consignada en el acto de otorgamiento. Según el registro del expediente, la última caracterización fue entregada hace catorce meses, y los informes posteriores no se presentaron ni se justificó su ausencia.
  > 
  > CONSIDERACIONES. La caracterización de efluentes es la herramienta que permite a la autoridad verificar el cumplimiento de los límites de descarga y la eficacia del sistema de tratamiento. Su omisión impide evaluar si el vertido supera los parámetros permitidos, por lo que constituye un incumplimiento de la obligación de seguimiento que no puede considerarse subsanado con la mera presentación de un informe de operación. El Decreto 1076 de 2015 establece que el titular debe mantener la información de monitoreo a disposición de la autoridad.
  > 
  > REQUIERE. A la E […]

### AMB-VER-004

- **Título:** Resolución que impone medida preventiva por incumplimiento de caracterización de vertimientos en subestación de Norte de Santander
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Impone suspensión inmediata de la descarga sin tratamiento, ordena caracterización en quince días, limpieza del canal y disposición de residuos aceitosos, e inicia sancionatorio.
- **Resumen del análisis:** Vertido sin caracterización y con evidencia de aceites en el canal, con separador fuera de servicio. Riesgo alto por medida preventiva de suspensión, inicio de procedimiento sancionatorio y necesidad de limpieza con soporte de gestor autorizado.
- **Texto (inicio):**

  > La autoridad ambiental competente resuelve imponer medida preventiva a la Empresa por la descarga de aguas residuales de la Subestación S-31 sin la caracterización exigida en su permiso de vertimientos, en el municipio de Cúcuta, departamento de Norte de Santander. La actuación se adelanta en el expediente SINT-AMB-0014, a partir de una visita de control en la que se observó la descarga de un efluente con presencia de película aceitosa sobre el canal de drenaje.
  > 
  > ANTECEDENTES. El permiso de vertimientos exige la caracterización trimestral del efluente tratado, así como el mantenimiento de un separador de aceites antes de la descarga. La visita de control constató que el separador se encontraba fuera de servicio desde hacía varias semanas, que la descarga se realizaba sin tratamiento previo en el momento de la inspección y que la Empresa no contaba con caracterizaciones del último año.
  > 
  > CONSIDERACIONES. La conducta descrita configura un riesgo cierto para el recurso hídrico, dado que el canal de drenaje desemboca en una quebrada que abastece a comunidades rurales aguas abajo. La medida preventiva tiene carácter transitorio y se impone para evitar la continuidad del hecho mientras se adelanta la investigación. La Ley 1333 de 2009 faculta a la autoridad para imponer medidas preventivas cuando exista evidencia de un hecho que afecte el medio ambiente, sin perjuicio de la sanción que resulte del procedimiento.
  > 
  > RESUELVE
  > 
  > ARTÍCULO PRIMERO. Imponer medida preventiva de suspensión in […]

### AMB-VER-005

- **Título:** Oficio sobre vertimiento de aguas residuales domésticas de campamento de obra en Sucre
- **Tipo de instrumento:** Oficio
- **Qué ordena:** Indica que el tanque séptico con infiltración requiere permiso previo con diseño, memoria de cálculo y distancias a fuentes de agua, o demostrar disposición por gestor autorizado.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > La autoridad ambiental competente se pronuncia mediante el presente oficio sobre el vertimiento de aguas residuales domésticas generado por el campamento de obra de la Línea Sabanas Sucre 110 kV, ubicado en el municipio de Sincelejo, departamento de Sucre. La comunicación se incorpora al expediente SINT-AMB-0015 y responde a la consulta de la Empresa sobre la necesidad de tramitar un permiso de vertimientos para una instalación temporal de aproximadamente sesenta personas.
  > 
  > ANTECEDENTES. El campamento se instalará por un periodo estimado de catorce meses, con una población flotante que oscila entre cuarenta y sesenta trabajadores según el cronograma de obra. Las aguas residuales domésticas se prevén manejar mediante baterías de baños portátiles y un sistema de tanque séptico con infiltración en el terreno, cuyo diseño no ha sido presentado a la autoridad. La Empresa consulta si el vertimiento de un campamento temporal requiere permiso o basta con el manejo de baños portátiles.
  > 
  > CONSIDERACIONES. Las aguas residuales domésticas generadas por una instalación con población permanente de decenas de personas no pueden considerarse de carácter despreciable, y su disposición mediante infiltración en el suelo requiere la evaluación de la autoridad, pues puede afectar aguas subterráneas. El carácter temporal de la instalación no exime de la obligación de contar con permiso cuando exista descarga al suelo o a cuerpos de agua, conforme a lo previsto en el Decreto 1076 de 2015.
  > 
  > RESPUESTA […]

## Expedientes consulta y pares

### QAMB-CAG-001

- **Título:** Resolución que modifica concesión de captación superficial para campamento en Cauca
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Aceptar provisionalmente el caudal de 0,7 l/s, notificar a los dos acueductos rurales para observaciones, mantener caudal ecológico de 4 l/s y verificar el medidor antes de cualquier incremento.
- **Resumen del análisis:** Aumento de captación en una quebrada con caudal real inferior al estudio original y dos acueductos rurales no consultados. La resolución acepta un incremento parcial. El riesgo es medio por la disponibilidad del recurso.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa solicitó la modificación de una concesión de aguas superficiales vigente, con el fin de aumentar el caudal de captación del campamento de obra de la Línea Oriente 500 kV en un municipio del departamento del Cauca, de 0,5 a 0,9 litros por segundo. El incremento obedece a la incorporación de personal adicional y a la necesidad de lavado de equipos de la cuadrilla de topografía.
  > 
  > La captación se realiza sobre la quebrada Los Sauces, con un plazo restante de nueve meses y un informe de cumplimiento de la concesión anterior en el que la Empresa reporta haber cumplido el caudal ecológico.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > La visita técnica reporta un caudal de estiaje de 9 litros por segundo, cifra inferior a la declarada en el estudio hidrológico original, que estimaba 14 litros por segundo para la misma época. El caudal ecológico calculado por el método aplicable es de 4 litros por segundo.
  > 
  > Con la captación aumentada, el caudal disponible aguas abajo se reduciría a 8,1 litros por segundo en estiaje, valor que respeta el caudal ecológico pero reduce el margen para otros usuarios de la quebrada. La quebrada abastece a dos acueductos rurales que no fueron consultados en el trámite.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > La modificación de una concesión exige un nuevo análisis de disponibilidad y la consulta a los demás usuarios de la fuente. El Decreto 1076 de 2015 prioriza el consumo humano sobre otros usos del recurso, por lo que el análisis debe incluir los acueductos rurales. El informe de cumplimiento es favorable en cuanto al caudal ecológico, pero no verifica la variación real del caudal.
  > 
  > RESUELVE
  > 
  > ARTÍCULO PRIMERO. Aceptar la modificación de la concesión solo hasta un caudal de 0,7 litros por segundo, mientras se completa el análisis de disponibilidad con la información de los acueductos.
  > 
  > ARTÍCULO SEGUNDO. Notificar a los operadores de los dos acueductos rurales de la solicitud y otorgarles un plazo de quince días para presentar observaciones.
  > 
  > ARTÍCULO TERCERO. Mantener un caudal ecológico de 4 litros por segundo aguas abajo de la captación y registrar el caudal de la quebrada en la estación de medición cada quince días.
  > 
  > ARTÍCULO CUARTO. Presentar el medidor de caudal calibrado para verificación antes de incrementar el caudal captado.
  > 
  > ARTÍCULO SEXTO. Presentar el plan de compensación por la reducción del caudal disponible en el tramo bajo, en caso de que el monitoreo muestre afectación al humedal que la quebrada alimenta.
  > 
  > ARTÍCULO SÉPTIMO. M […]

Candidatos a juzgar para QAMB-CAG-001: AMB-CAG-001, AMB-CAG-002, AMB-CAG-003, AMB-CAG-004, AMB-CAG-005, AMB-LIC-001, AMB-OCC-001, AMB-OCC-002, AMB-OCC-003, AMB-RES-003, AMB-RUI-005, AMB-SAN-004, AMB-VER-001

### QAMB-CAG-002

- **Título:** Auto que suspende perforación de pozo cercano a nacimiento usado por comunidad en el Meta
- **Tipo de instrumento:** Auto
- **Qué ordena:** Suspender de inmediato la perforación del pozo con sellado provisional, presentar estudio hidrogeológico en diez días, abastecer a la comunidad y abrir sancionatorio.
- **Resumen del análisis:** Perforación de pozo a sesenta metros de un nacimiento usado por veinticinco familias, sin concesión y con caudal del nacimiento en descenso. La medida preventiva es inmediata. El caso es de alto riesgo por la afectación al abastecimiento comunitario.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La autoridad ambiental recibió una denuncia de la comunidad de la vereda El Progreso, en un municipio del departamento del Meta, por la perforación de un pozo de agua subterránea para la Subestación S-75. El pozo se perforaba a 60 metros de un nacimiento de agua que abastece a unas veinticinco familias y a un abrevadero comunitario. La perforación se realizaba sin concesión de aguas subterráneas.
  > 
  > La Empresa informó que el pozo fue contratado por un tercero para la fase de construcción y que la solicitud de concesión se radicó en fecha posterior al inicio de la perforación.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > La visita técnica constató que la perforación se encontraba a 240 metros de profundidad parcial y que el nacimiento presentaba una disminución de caudal respecto de la última visita registrada por la comunidad. No se ha realizado estudio hidrogeológico que determine si el pozo y el nacimiento captan el mismo acuífero.
  > 
  > La zona se encuentra en un sector de recarga de acuíferos según el diagnóstico de la corporación autónoma regional, lo que incrementa la posibilidad de interferencia.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > La perforación de pozos para aprovechamiento de aguas subterráneas requiere concesión previa. La Ley 1333 de 2009 permite imponer medidas preventivas cuando existe un hecho que atente contra un recurso natural y se requiera evitar la continuación del daño. La disminución del nacimiento y la cercanía del pozo justifican la medida preventiva, sin que sea necesario esperar al resultado de los estudios.
  > 
  > RESUELVE
  > 
  > ARTÍCULO PRIMERO. Imponer medida preventiva de suspensión inmediata de la perforación del pozo, con sellado provisional de la boca.
  > 
  > ARTÍCULO SEGUNDO. Requerir a la Empresa y al contratista que, en un plazo de diez días, presenten el estudio hidrogeológico preliminar que determine la relación entre el pozo y el nacimiento.
  > 
  > ARTÍCULO TERCERO. Garantizar el abastecimiento de agua a la comunidad mediante suministro de un tercero autorizado, durante el tiempo que dure la suspensión.
  > 
  > ARTÍCULO CUARTO. Iniciar actuación administrativa sancionatoria contra la Empresa y el contratista por la perforación sin concesión.
  > 
  > ARTÍCULO QUINTO. Requerir al contratista la entrega del registro de los volúmenes extraídos desde el inicio de la perforación, con la copia del contrato de obra y los soportes del pozo.
  > 
  > ARTÍCULO SEXTO. Presentar, en diez días, un plan de abastecimiento de agua para la fase de construcción que no dependa de captaciones en el se […]

Candidatos a juzgar para QAMB-CAG-002: AMB-CAG-001, AMB-CAG-002, AMB-CAG-003, AMB-CAG-004, AMB-CAG-005, AMB-CFO-001, AMB-CFO-003, AMB-LIC-005, AMB-OCC-002, AMB-RES-003, AMB-SAN-001, AMB-SAN-002, AMB-SAN-004, AMB-VER-005

### QAMB-CAG-003

- **Título:** Oficio sobre manejo de aguas residuales domésticas del campamento de una subestación
- **Tipo de instrumento:** Oficio
- **Qué ordena:** Presentar en treinta días el diseño hidráulico del sistema séptico con estudio de percolación y carga orgánica, evaluar reubicación del pozo y analizar efluente y agua del caño.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa presentó a la autoridad ambiental la descripción del sistema de tratamiento de aguas residuales domésticas del campamento de la Subestación S-80, ubicada en un municipio del departamento de Sucre, con el fin de confirmar que la descarga se realiza conforme a la normativa. El campamento alberga entre cuarenta y sesenta personas durante la fase de montaje y cuenta con un sistema séptico con pozo de infiltración.
  > 
  > La Empresa informa que el pozo de infiltración está ubicado a veinte metros de un drenaje natural que conduce a un caño, y que el sistema fue construido en la fase inicial de la obra sin registro de diseño.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El sistema séptico con pozo de infiltración no cuenta con diseño hidráulico ni con estudio de percolación que demuestre la capacidad de infiltración del suelo. El suelo de la zona es arcilloso con nivel freático somero durante la temporada de lluvias, condición que limita la infiltración y favorece la migración de contaminantes hacia el caño.
  > 
  > La carga orgánica del campamento, estimada por número de personas, no ha sido calculada. No se registran análisis de efluente ni de agua del caño.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > La descarga de aguas residuales domésticas al suelo y a cuerpos de agua requiere permiso de vertimiento o el cumplimiento de la normativa de vertimientos aplicable, según el caso. El Decreto 1076 de 2015 exige que el titular acredite la solución adecuada para el manejo de estas aguas. La autoridad debe definir si el sistema existente es suficiente o si requiere ajustes, y en qué plazo.
  > 
  > RESUELVE
  > 
  > ARTÍCULO PRIMERO. Requerir a la Empresa presentar el diseño hidráulico del sistema séptico, con estudio de percolación y cálculo de carga orgánica, en un plazo de treinta días.
  > 
  > ARTÍCULO SEGUNDO. Evaluar la reubicación del pozo de infiltración a una distancia que la autoridad determine a partir del estudio, con respecto al drenaje natural.
  > 
  > ARTÍCULO TERCERO. Realizar un análisis del efluente y del agua del caño aguas abajo del punto de descarga, con resultados en diez días hábiles.
  > 
  > ARTÍCULO CUARTO. Abstenerse de ordenar el cierre del sistema en esta etapa, siempre que la Empresa cumpla los plazos señalados.
  > 
  > ARTÍCULO QUINTO. Sustituir el sistema séptico de la fase inicial por un sistema con tratamiento secundario, con diseño firmado por profesional competente, en el plazo que la autoridad acepte tras la presentación del diseño.
  > 
  > ARTÍCULO SEXTO. Presentar el registro semanal de la población d […]

Candidatos a juzgar para QAMB-CAG-003: AMB-CAG-001, AMB-CAG-002, AMB-CAG-003, AMB-CAG-004, AMB-CAG-005, AMB-CFO-004, AMB-OCC-002, AMB-RES-003, AMB-RES-004, AMB-RUI-004, AMB-SAN-001, AMB-VED-004, AMB-VER-001, AMB-VER-002, AMB-VER-003, AMB-VER-005

### QAMB-CFO-001

- **Título:** Resolución que fija compensación 1:5 por bosque alto andino intervenido en servidumbre de línea de 230 kV en Boyacá
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Fija relación 1:5 por bosque alto andino, ordena restaurar 4,3 hectáreas en seis meses, exige garantía financiera de cinco años y prohíbe intervenir dos torres de mayor valor.
- **Resumen del análisis:** Caso nuevo con bosque alto andino y relación de compensación de 1:5. Riesgo alto por la extensión de la restauración, por depender de un predio de compensación en cota inferior y por la exigencia de garantía financiera.
- **Texto (inicio):**

  > La autoridad ambiental competente resuelve la solicitud de aprovechamiento forestal y compensación presentada por la Empresa para la ejecución de la Línea Sierra Oriental 230 kV, en el tramo que atraviesa el municipio de Duitama, departamento de Boyacá. El expediente SINT-AMB-0016 contiene el inventario forestal de la franja de servidumbre, la cartografía de las torres, el plan de compensación propuesto por el titular y el concepto técnico del grupo evaluador, en el que se analiza la afectación sobre un relicto de bosque alto andino.
  > 
  > ANTECEDENTES. La Empresa solicitó permiso para aprovechar 287 individuos arbóreos dentro de la servidumbre de 30 metros a cada lado del eje, con un volumen estimado de 142 metros cúbicos. El inventario identifica especies como aliso, arrayán, chusque y encenillo, con presencia de individuos de diámetro superior a cuarenta centímetros en la torre T-14 y en la torre T-15. El titular propuso una compensación en relación 1:2, consistente en la restauración de 2,1 hectáreas en un predio de la misma cuenca, con un plazo de ejecución de dos años.
  > 
  > CONSIDERACIONES TÉCNICAS. El bosque alto andino es un ecosistema de crecimiento lento y de alta importancia para la regulación hídrica, por lo que la reposición de su estructura no se logra en el corto plazo. El concepto técnico considera que la relación 1:2 es insuficiente y que debe aplicarse una relación de 1:5 sobre el área intervenida, lo que equivale a restaurar 4,3 hectáreas. Asimismo, el predio propuesto por el titular se encuentra en una cota inferior a la del tramo afectado, por lo que el plan debe demostrar que las especies seleccionadas son apropiadas para la zona de compensación.
  > 
  > CONSIDERACIONES JURÍDICAS. El Decreto 1076 de 2015 establece que el aprovechamiento forestal en bosques naturales requiere permiso previo y que la compensación debe guardar proporción con la afectación. El Decreto 1791 de 1996 regula el régimen de aprovechamiento forestal, y la Ley 99 de 1993 atribuye a la autoridad la función de exigir medidas de manejo para la conservación de los recursos naturales. La obra es de utilidad pública, pero esto no exime de la compensación proporcional al ecosistema afectado.
  > 
  > RESUELVE
  > 
  > ARTÍCULO PRIMERO. Otorgar permiso de aprovechamiento forestal para 287 individuos arbóreos dentro de la servidumbre de la Línea Sierra Oriental 230 kV, con un volumen máximo de 142 metros cúbicos, sin intervenir los individuos de las torres T-14 y T-15 que sean identificados como de mayo […]

Candidatos a juzgar para QAMB-CFO-001: AMB-CFO-001, AMB-CFO-002, AMB-CFO-003, AMB-LIC-001, AMB-LIC-003, AMB-LIC-005, AMB-OCC-001, AMB-OCC-002, AMB-SAN-004, AMB-SAN-005, AMB-VED-001, AMB-VED-003, AMB-VED-004, AMB-VER-002

### QAMB-CFO-002

- **Título:** Concepto técnico sobre compensación de bosque húmedo tropical afectado por servidumbre de línea en Nariño
- **Tipo de instrumento:** Concepto técnico
- **Qué ordena:** Recomienda aprobar la compensación de 2,4 hectáreas, excluir los humedales de la siembra, registrar el acuerdo de conservación y monitorear la supervivencia durante tres años.
- **Resumen del análisis:** Compensación en bosque húmedo con predio receptor ya identificado y acuerdo de conservación. Riesgo medio por la tenencia del predio, la necesidad de registrar el acuerdo y el manejo pendiente de los humedales.
- **Texto (inicio):**

  > El presente concepto técnico se emite dentro del trámite de compensación por remoción de bosque húmedo tropical asociada a la Línea Pacífico Sur 115 kV, en el municipio de Tumaco, departamento de Nariño. El análisis se realiza sobre la información del expediente SINT-AMB-0017, que contiene el censo de cobertura de la franja de servidumbre, el plan de compensación, el acuerdo de uso del predio receptor y los resultados de una visita de campo realizada por el equipo técnico de la corporación autónoma regional.
  > 
  > ANTECEDENTES. La Empresa informó la intervención de 2,4 hectáreas de bosque secundario de más de quince años, sobre un trazado de 3,6 kilómetros que atraviesa dos zonas de humedal. El titular propone compensar el área en un predio vecino, de propiedad de una familia campesina, con el que suscribió un acuerdo de conservación por cinco años y un compromiso de restauración de 2,4 hectáreas con especies nativas de porte alto.
  > 
  > ANÁLISIS TÉCNICO. El censo de cobertura es coherente con la cartografía y con las imágenes de referencia de la zona, y no se detectaron especies vedadas dentro de la franja. El predio receptor presenta condiciones ecológicas similares a las del área intervenida y su cercanía a la franja favorece el flujo de semillas. Sin embargo, la propuesta no define el manejo de las áreas de humedal, que deben excluirse de la siembra y mantenerse con cobertura natural, ni la densidad de individuos por hectárea para el bosque húmedo.
  > 
  > CONCLUSIÓN. Desde el punto de vista técnico, la compensación es viable siempre que la Empresa complemente el plan con la exclusión de los humedales de la siembra, con la densidad de individuos por hectárea y con un sistema de monitoreo de supervivencia durante tres años. El acuerdo con el propietario es un elemento favorable, pero debe elevarse a documento con vigencia registrada y con cláusulas de cumplimiento verificables.
  > 
  > FUNDAMENTO NORMATIVO. La compensación por intervención de bosque en proyectos de utilidad pública se rige por el Decreto 1076 de 2015, que exige la proporcionalidad de la medida y el seguimiento de las obligaciones, y por la Ley 99 de 1993, que asigna a las corporaciones la competencia para ordenar la restauración de los ecosistemas afectados.
  > 
  > RECOMENDACIONES. Se sugiere a la autoridad competente: aprobar la compensación de 2,4 hectáreas con las condiciones de exclusión de humedales y de monitoreo; solicitar el documento de acuerdo de conservación con registro; y requerir un informe al primer a […]

Candidatos a juzgar para QAMB-CFO-002: AMB-CAG-001, AMB-CFO-001, AMB-CFO-002, AMB-CFO-003, AMB-CFO-005, AMB-LIC-001, AMB-LIC-004, AMB-OCC-001, AMB-RES-003, AMB-SAN-003, AMB-SAN-004, AMB-SAN-005, AMB-VED-001, AMB-VED-003, AMB-VED-004, AMB-VED-005

### QAMB-CFO-003

- **Título:** Auto que admite solicitud de aprovechamiento de árboles dispersos para torres de línea en Magdalena
- **Tipo de instrumento:** Auto
- **Qué ordena:** Admite la solicitud de 58 árboles dispersos y requiere en diez días hábiles el censo completo con altura, diámetro y coordenadas, y la ubicación de árboles fuera del predio.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > La autoridad ambiental competente, mediante el presente auto, admite la solicitud de aprovechamiento de árboles dispersos presentada por la Empresa para la construcción de las torres de la Línea Costera 110 kV, en el municipio de Ciénaga, departamento del Magdalena. La solicitud se identifica con el expediente SINT-AMB-0018 y ha sido radicada con los formularios y los planos de ubicación de las torres, por lo que se procede a la verificación de requisitos para dar inicio a la evaluación técnica.
  > 
  > ANTECEDENTES. La solicitud se refiere al aprovechamiento de 58 árboles dispersos en potreros y en borde de caminos rurales, ubicados en tres predios distintos. Según el listado presentado, las especies corresponden a algarrobo, campano y acacia, y la mayoría de los individuos se encuentran en zonas de pastoreo. La Empresa indica que la intervención es necesaria para la instalación de dos torres y para la adecuación de un acceso de maquinaria.
  > 
  > VERIFICACIÓN. La solicitud incluye el formulario diligenciado, el certificado de tradición de los predios y el plano de ubicación de las torres. No obstante, el censo de árboles no reporta la altura ni el diámetro a la altura del pecho de 11 individuos, y las coordenadas de dos de los árboles se encuentran fuera del predio mencionado en la solicitud. Estos vacíos deben ser completados antes de la evaluación técnica de fondo.
  > 
  > CONSIDERACIONES PARA LA EVALUACIÓN. Una vez completada la información, la autoridad evaluará si la tala de los árboles dispersos es necesaria para la instalación de las torres o si es posible modificar la ubicación de la plataforma para conservar algunos individuos de mayor tamaño. Se tendrá en cuenta que los potreros son sistemas en los que los árboles aislados cumplen funciones de sombra para el ganado y de refugio para aves, por lo que la compensación podrá incluir la siembra de individuos de la misma especie en los bordes del predio. Asimismo, el acceso de maquinaria deberá planearse por los caminos existentes para evitar la apertura de nuevas trochas. La decisión de fondo se adoptará una vez se reciba la respuesta y se realice la visita técnica que la autoridad considere necesaria para verificar el censo.
  > 
  > DISPONE
  > 
  > Primero. Admitir la solicitud de aprovechamiento forestal de árboles dispersos para la Línea Costera 110 kV, dentro del expediente SINT-AMB-0018.
  > 
  > Segundo. Requerir a la Empresa para que, en un término de diez días hábiles, presente el censo completo con especie, diámetro, altura y coord […]

Candidatos a juzgar para QAMB-CFO-003: AMB-CFO-001, AMB-CFO-002, AMB-CFO-003, AMB-CFO-004, AMB-LIC-002, AMB-OCC-001, AMB-OCC-002, AMB-SAN-002, AMB-SAN-003, AMB-SAN-004, AMB-SAN-005, AMB-VED-002, AMB-VED-004, AMB-VER-003, AMB-VER-005

### QAMB-CFO-004

- **Título:** Requerimiento por incumplimiento del plan de compensación forestal con viveros sin registro en Caquetá
- **Tipo de instrumento:** Requerimiento
- **Qué ordena:** Exige en treinta días acreditar viveros registrados y trazabilidad de semilla, reponer al menos el 25 % de plántulas no sobrevivientes y presentar informe con registro fotográfico.
- **Resumen del análisis:** Incumplimiento con viveros sin registro, semilla de origen no trazado y supervivencia del 61 % frente al 85 % exigido. Riesgo alto porque el incumplimiento puede escalar a sanción y porque la reposición exige recursos y tiempo adicionales.
- **Texto (inicio):**

  > La autoridad ambiental competente requiere a la Empresa por el incumplimiento del plan de compensación forestal asociado a la Línea Amazonía Norte 115 kV, en jurisdicción del municipio de Florencia, departamento del Caquetá. La actuación se soporta en el expediente SINT-AMB-0019, que incluye el informe de seguimiento del primer año, el registro de los viveros utilizados por el operador y las actas de las visitas de control realizadas durante la fase de establecimiento de las plántulas.
  > 
  > ANTECEDENTES. El plan aprobado preveía la producción en vivero de 3.400 plántulas de especies nativas para la restauración de 3,8 hectáreas de bosque de terraza. Durante la visita de seguimiento se encontró que dos de los viveros utilizados por el operador no se encuentran registrados ante la autoridad, que no se dispone de la trazabilidad del origen de la semilla de tres especies y que la supervivencia en el primer año se reporta en 61 %, frente al 85 % exigido en el plan.
  > 
  > CONSIDERACIONES. El uso de material vegetal de origen no verificado afecta la finalidad misma de la compensación, pues no es posible garantizar que las especies sean propias de la zona ni que el material genético sea adecuado para el ecosistema. El registro de viveros es un requisito de la gestión del material vegetal, y su ausencia constituye un incumplimiento del plan que debe ser corregido. La baja supervivencia, aunque puede atribuirse en parte a la temporada seca, no fue acompañada de medidas de reposición oportunas.
  > 
  > REQUIERE. A la Empresa se le exige: acreditar en un plazo de treinta días el registro de los viveros utilizados, o trasladar la producción a viveros registrados; presentar la trazabilidad del origen de la semilla de las especies identificadas; reponer las plántulas no sobrevivientes en un porcentaje no inferior al 25 % del total de individuos del plan, con cronograma de ejecución; y presentar el informe de avance con el registro fotográfico de cada parcela.
  > 
  > MOTIVACIÓN DE LA ACTUACIÓN. La Empresa debe entender que los viveros son el punto de partida de toda la cadena de compensación, pues de la calidad de la planta depende que la siembra alcance la supervivencia exigida. Un vivero no registrado impide a la autoridad verificar el origen del material, el estado sanitario de las plántulas y la aptitud de las especies para la zona de restauración. La mortalidad del 39 % en el primer año no puede atribuirse únicamente a la temporada seca, pues el plan contemplaba riego de auxilio que no se […]

Candidatos a juzgar para QAMB-CFO-004: AMB-CAG-005, AMB-CFO-001, AMB-CFO-002, AMB-CFO-003, AMB-CFO-005, AMB-LIC-003, AMB-LIC-005, AMB-OCC-001, AMB-SAN-003, AMB-SAN-004, AMB-SAN-005, AMB-VED-003, AMB-VED-004, AMB-VER-002, AMB-VER-003

### QAMB-LIC-001

- **Título:** Resolución que modifica licencia ambiental de Línea Andina 500 kV por ampliación de servidumbre que afecta humedal en Tolima
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Autoriza ampliar la servidumbre a 52 metros en 6,1 kilómetros, suspende la intervención del humedal sin diseño aprobado y exige estudio de avifauna en dos temporadas en noventa días.
- **Resumen del análisis:** Modificación con ampliación de servidumbre que afecta humedal y avifauna migratoria. Riesgo alto por la insuficiencia de la campaña de avifauna, la suspensión del humedal sin diseño aprobado y la posible caducidad parcial.
- **Texto (inicio):**

  > La autoridad ambiental competente resuelve la solicitud de modificación de la licencia ambiental de la Línea Andina 500 kV, relacionada con la ampliación de la franja de servidumbre en un tramo de 6,1 kilómetros del municipio de Honda, departamento del Tolima. El expediente SINT-AMB-0020 contiene el estudio complementario de impacto, la caracterización de avifauna presentada por el titular, el concepto técnico del grupo evaluador y las observaciones de los propietarios de los predios colindantes.
  > 
  > ANTECEDENTES. La licencia vigente fijó una servidumbre de 30 metros para el tramo. Por exigencias de distancia de seguridad, la Empresa solicita ampliarla a 52 metros en el tramo que atraviesa un humedal de ronda de río, lo que implica la intervención de 9 hectáreas de vegetación herbácea y arbustiva y la reubicación de dos torres. El titular aportó la información de la campaña de avifauna realizada en una sola temporada del año.
  > 
  > CONSIDERACIONES TÉCNICAS. El humedal es un área de importancia para especies migratorias y residentes, y su vegetación cumple funciones de filtro de sedimentos y de regulación de inundaciones. La caracterización de una sola temporada no permite concluir sobre la presencia estacional de especies sensibles. El concepto técnico considera que la ampliación de la servidumbre solo puede aprobarse si el titular presenta un estudio de avifauna en dos temporadas y un diseño de las torres que minimice el área de intervención en el humedal.
  > 
  > CONSIDERACIONES JURÍDICAS. El Decreto 1076 de 2015 exige un nuevo análisis cuando se modifican las condiciones evaluadas en la licencia, y la Ley 99 de 1993 atribuye a la autoridad la función de proteger los ecosistemas de humedal. Las observaciones de los propietarios sobre el uso del suelo y la indemnización no son objeto de este acto, sino de la gestión predial de la Empresa, pero se considera el impacto de la ampliación sobre sus predios.
  > 
  > RESUELVE
  > 
  > ARTÍCULO PRIMERO. Autorizar la ampliación de la servidumbre a 52 metros en un tramo de 6,1 kilómetros, condicionada a la presentación del estudio de avifauna en dos temporadas y al diseño de las torres que minimice la intervención del humedal.
  > 
  > ARTÍCULO SEGUNDO. Suspender la intervención del humedal en las torres que no cuenten con el diseño aprobado, hasta que la autoridad se pronuncie sobre el estudio complementario.
  > 
  > ARTÍCULO TERCERO. Exigir un plan de restauración de la vegetación herbácea y arbustiva en un área equivalente al 150 % de la intervenida, con c […]

Candidatos a juzgar para QAMB-LIC-001: AMB-CAG-001, AMB-CAG-002, AMB-CFO-001, AMB-CFO-003, AMB-CFO-005, AMB-LIC-001, AMB-LIC-002, AMB-LIC-004, AMB-LIC-005, AMB-OCC-001, AMB-SAN-002, AMB-SAN-004, AMB-SAN-005, AMB-VED-003, AMB-VED-005

### QAMB-LIC-002

- **Título:** Oficio con requerimiento de información para licencia de subestación nueva en Arauca
- **Tipo de instrumento:** Oficio
- **Qué ordena:** Solicita estudio de ruido, concepto de uso del suelo, plano de drenajes y de escorrentía, y aclaración de captación de agua y manejo de excavaciones en treinta días calendario.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > La autoridad ambiental competente se dirige a la Empresa en relación con la solicitud de licencia ambiental para la construcción de la Subestación Llanura Arauca 230 kV, prevista en el municipio de Arauquita, departamento de Arauca. La solicitud se consigna en el expediente SINT-AMB-0021, y en la etapa de revisión preliminar se identificaron vacíos de información que impiden iniciar la evaluación técnica de fondo.
  > 
  > ANTECEDENTES. La Empresa radicó el estudio de impacto ambiental para una subestación de 230 kV en un lote de 4,5 hectáreas, con uso actual de pastoreo, a unos 250 metros de un caño que drena hacia un bajo inundable. El proyecto incluye una caseta de control, dos bancos de transformadores, un sistema de contención de aceites y un tanque de agua de servicio. La solicitud no incluye los estudios complementarios que la autoridad considera indispensables para el tipo de sitio.
  > 
  > INFORMACIÓN REQUERIDA. Para continuar el trámite, se solicita a la Empresa: primero, un estudio de ruido que modele los niveles en los límites del predio y en las viviendas más cercanas, con la descripción de los equipos y del horario de operación; segundo, el concepto de uso del suelo expedido por la autoridad municipal, en el que se confirme la compatibilidad del proyecto con la destinación del predio; tercero, el plano de drenajes y de escorrentía del lote, con la identificación del punto de descarga de las aguas pluviales y la cota de inundación del bajo.
  > 
  > ADICIONALMENTE. Se requiere precisar si la obra necesitará captación de agua superficial o subterránea para la fase constructiva, y en caso afirmativo, adjuntar la solicitud del trámite correspondiente. También se solicita aclarar el manejo de los residuos de construcción y la disposición de los excedentes de excavación, dado que el sitio presenta nivel freático superficial durante la temporada de lluvias.
  > 
  > PLAZO. La Empresa dispone de un término de treinta días calendario, contados desde la recepción del presente oficio, para remitir la información. La respuesta debe citar el expediente SINT-AMB-0021 y remitirse por el medio oficial habilitado. Si no se atiende el requerimiento en el plazo previsto, la autoridad podrá declarar el desistimiento de la solicitud sin perjuicio de una nueva radicación.
  > 
  > RECOMENDACIÓN DE PRESENTACIÓN. Para facilitar la evaluación, la autoridad sugiere que la Empresa organice la información por capítulos, siguiendo la estructura del término de referencia del estudio de impacto, e incluya un re […]

Candidatos a juzgar para QAMB-LIC-002: AMB-CAG-003, AMB-CAG-004, AMB-CFO-001, AMB-CFO-004, AMB-LIC-002, AMB-LIC-003, AMB-LIC-004, AMB-LIC-005, AMB-OCC-002, AMB-RUI-001, AMB-RUI-004, AMB-SAN-001, AMB-SAN-002, AMB-VED-004, AMB-VER-002, AMB-VER-003, AMB-VER-005

### QAMB-LIC-003

- **Título:** Requerimiento por ausencia de registro fotográfico en seguimiento de obras de línea de transmisión en Cauca
- **Tipo de instrumento:** Requerimiento
- **Qué ordena:** Exige en quince días calendario el registro fotográfico georreferenciado de los dos últimos meses, el plan de manejo de residuos actualizado y evidencia completa en los informes siguientes.
- **Resumen del análisis:** Falta de evidencia fotográfica en obra activa durante dos meses consecutivos, con debilidad en la gestión del equipo de topografía. Riesgo medio porque la omisión es subsanable, pero puede derivar en medida preventiva si se reitera.
- **Texto (inicio):**

  > La autoridad ambiental competente requiere a la Empresa por la ausencia de evidencias de seguimiento en las obras de la Línea Macizo 115 kV, en el municipio de Popayán, departamento del Cauca. El requerimiento se consigna en el expediente SINT-AMB-0022, a partir de la revisión de los informes mensuales y de una visita de control realizada durante la fase de tendido de conductores, en la que se constató que no se disponía de registro fotográfico georreferenciado de las intervenciones en los frentes de obra.
  > 
  > ANTECEDENTES. La licencia ambiental exige la presentación mensual de un informe de seguimiento con registro fotográfico georreferenciado de cada frente de obra, de las medidas de manejo de cauces y del manejo de residuos. Durante los últimos dos meses, los informes presentados contienen descripciones generales, pero no incluyen fotografías ni coordenadas de los puntos intervenidos. El titular explicó que el equipo de topografía estuvo a cargo de otras actividades del proyecto.
  > 
  > CONSIDERACIONES. La evidencia fotográfica es el soporte que permite a la autoridad verificar que las medidas de manejo se aplican en campo y no solo en el papel. Su ausencia en un frente de obra activo, en el que se realizan movimientos de tierra y tendido, impide evaluar la oportunidad de las medidas de control. La omisión es subsanable y no se observan daños ambientales significativos en la visita, pero la falta de registros en periodos consecutivos es un indicio de debilidad en la gestión.
  > 
  > REQUIERE. A la Empresa se le exige: presentar en quince días calendario el registro fotográfico georreferenciado de los dos últimos meses, con la fecha, la hora y el frente de obra de cada imagen; remitir el plan de manejo de residuos de obra actualizado, con la identificación de los puntos de acopio y de las empresas gestoras; y garantizar que en los informes mensuales siguientes se incluya la evidencia fotográfica completa.
  > 
  > ADVERTENCIA. Si el registro no se entrega o si se reitera la omisión, la autoridad podrá imponer una medida preventiva de suspensión de las actividades en el frente de obra correspondiente y dar inicio al procedimiento sancionatorio previsto en la Ley 1333 de 2009. La respuesta debe radicarse dentro del expediente SINT-AMB-0022.
  > 
  > CONSIDERACIONES ADICIONALES. El seguimiento de obra no se limita a la entrega de documentos, sino que implica la verificación en campo de las medidas de manejo. La autoridad considera que la falta de registro en dos meses consecutivos reduce […]

Candidatos a juzgar para QAMB-LIC-003: AMB-CFO-001, AMB-CFO-002, AMB-CFO-004, AMB-CFO-005, AMB-LIC-001, AMB-LIC-005, AMB-OCC-002, AMB-RES-001, AMB-RES-003, AMB-SAN-001, AMB-SAN-002, AMB-VED-002, AMB-VED-005, AMB-VER-002, AMB-VER-003, AMB-VER-004
