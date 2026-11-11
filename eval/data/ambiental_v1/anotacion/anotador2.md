# Etiquetado de relevancia — expedientes ambientales

Eres un abogado ambiental en Colombia. Para cada **expediente consulta** debes juzgar qué tan útil es cada **expediente candidato** como precedente para atenderlo. Juzga cada par por separado, solo con el contenido de los expedientes.

Escala (entero de 0 a 3):
- **3** = misma obligación o situación, directamente aplicable como precedente.
- **2** = mismo tema con diferencias relevantes, útil como referencia.
- **1** = relación tangencial.
- **0** = no relacionado.

Escribe el resultado en `C:\Users\aleja\Documents\Projects\tutelas\tutelas_backend\eval\data\ambiental_v1\anotacion\anotador2_resultado.csv`: un CSV en UTF-8 con encabezado exacto `qid,doc_id,relevancia_0a3,razon_breve` y **una fila por cada par listado abajo** (ni más ni menos). La razón breve va entre comillas dobles, en español y con máximo 20 palabras. No leas ningún otro archivo. Al terminar, responde solo cuántas filas escribiste.

Pares a juzgar: **89** (6 consultas, 42 candidatos distintos).

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

### AMB-OCC-004

- **Título:** Concepto técnico sobre acceso vial permanente en la ronda de quebrada Los Frailes
- **Tipo de instrumento:** Concepto técnico
- **Qué ordena:** Emitir concepto técnico favorable condicionado para el acceso vial permanente sobre la quebrada Los Frailes, con sección hidráulica que incluya crecientes, estabilización de dos sectores con erosión y plan de cierre que retire materiales de la ronda.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > OBJETO
  > 
  > El presente concepto técnico evalúa la solicitud de la Empresa para construir un acceso vial permanente de doscientos metros que atraviesa la ronda de la quebrada Los Frailes, en un municipio de Risaralda, para dar mantenimiento a la Línea Sur 115 kV durante su vida útil.
  > 
  > INFORMACIÓN REVISADA
  > 
  > Se revisaron el plano de trazado, el estudio geotécnico de los taludes, el levantamiento topográfico de la quebrada y el registro de visitas de campo realizadas por el equipo técnico de la corporación en dos fechas distintas del último semestre.
  > 
  > ANÁLISIS TÉCNICO
  > 
  > El trazado propuesto cruza la quebrada mediante una placa en concreto con un ancho de cuatro metros. Según el estudio geotécnico, los taludes presentan estabilidad aceptable con pendientes inferiores a veinticinco grados, aunque se identifican dos sectores con erosión activa en la margen derecha que deben estabilizarse antes de la construcción.
  > 
  > La placa no altera el lecho cuando se construye por fuera del cauce y se apoya en estribos retirados de la orilla. Sin embargo, el diseño no contempla la altura de las crecientes de la quebrada y no se acompaña de un análisis de sección hidráulica que lo respalde.
  > 
  > La vegetación de ronda es de tipo secundario con regeneración natural, sin especies en veda. Se recomienda limitar la tala a la superficie de la calzada, con preservación de los árboles de la margen.
  > 
  > Respecto de la estabilidad de los estribos de la placa, el estudio geotécnico recomienda fundaciones profundas en el […]

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

### AMB-RES-005

- **Título:** Requerimiento por almacenamiento de residuos en campamento sin señalización ni contención
- **Tipo de instrumento:** Requerimiento
- **Qué ordena:** Adecuar en treinta días el área de almacenamiento con piso impermeable, contención al 110 por ciento y señalización, registrarse como generador y entregar los residuos vencidos a gestor autorizado.
- **Resumen del análisis:** Almacenamiento de residuos peligrosos sin contención ni registro, con manchas de hidrocarburo y cercanía a una zanja de drenaje. El riesgo es preventivo y el incumplimiento es corregible con obras sencillas y trámite administrativo.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > Durante una visita de control realizada al campamento de obra de la Subestación S-52, ubicada en un municipio del departamento de Caldas, se identificó un área de almacenamiento de residuos peligrosos que no cumple las condiciones de la normativa. El área contiene doce tambores de aceite usado, cuatro baterías de plomo ácido y trapos impregnados en bolsas, sin señalización visible ni piso impermeable.
  > 
  > La Empresa informó que el área corresponde a un almacenamiento temporal previo a la entrega al gestor, que se programa cada tres meses. No se aportó el registro de generadores de residuos peligrosos ni los certificados de entrega de los últimos periodos.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El sitio se ubica a cuarenta metros de una zanja de drenaje que desemboca en una quebrada sin nombre. Los tambores se encuentran apilados en dos hileras sin bandeja de contención. No se observaron signos de fuga al momento de la visita, aunque sí manchas de hidrocarburo sobre el piso de tierra, lo que sugiere derrames previos de baja magnitud.
  > 
  > La Empresa cuenta con extintor y kit básico de absorbentes, pero el kit no está señalizado ni accesible desde el acceso del área. Durante la visita se verificó que las baterías no tienen tapas protectoras en los bornes, y que dos de ellas presentan carcasa fisurada, condición que aumenta el riesgo de derrame de electrolito ácido sobre el suelo.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > El Decreto 4741 de 2005 exige que el almacenamiento de residuos peligrosos s […]

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

### AMB-RUI-002

- **Título:** Resolución de seguimiento a monitoreo de ruido en subestación de alta tensión del Caribe
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Identificar en cuarenta y cinco días el aporte individual de ventiladores y transformadores al ruido nocturno, presentar diseño de mitigación en cuatro meses y remitir el registro de quejas de doce meses.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa presentó el informe semestral de monitoreo acústico de la Subestación S-07, ubicada en el municipio de Sabanalarga, departamento del Atlántico. El informe incluye mediciones diurnas, vespertinas y nocturnas en cuatro puntos de receptor, con equipo calibrado y registro de velocidad y dirección del viento. La estación opera con dos transformadores de potencia de 60 MVA y un banco de reactores.
  > 
  > La autoridad ambiental revisó el informe junto con la queja presentada por residentes del barrio Villa Nueva, quienes reportaron vibración audible y ruido constante durante la madrugada, especialmente en los meses de menor temperatura.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > Los resultados muestran cumplimiento en los horarios diurno y vespertino. En el horario nocturno, el punto R4, ubicado a 90 metros del cerramiento norte, registra niveles de 52 dB(A) frente al límite de 45 dB(A) para zona residencial. El informe no discrimina entre el aporte de los transformadores y el de los ventiladores de enfriamiento, lo que impide focalizar la intervención.
  > 
  > El informe describe la instalación de un sistema de amortiguación de vibraciones en las bases de los transformadores, pero no aporta mediciones previas y posteriores que permitan verificar su efecto. Tampoco se analizaron reflexiones del ruido en el muro de cerramiento de bloque, que podrían estar elevando el nivel medido en el punto R4.
  > 
  > Las mediciones de las madrugadas de los meses de menor temperatura no están incluidas en el […]

### AMB-RUI-003

- **Título:** Atención a queja vecinal por zumbido de transformador en el barrio Villa Nueva
- **Tipo de instrumento:** Oficio
- **Qué ordena:** Realizar en treinta días una campaña de medición en tres viviendas señaladas, informar si el banco de condensadores fue autorizado y comunicar los resultados a los quejosos.
- **Resumen del análisis:** Queja vecinal sin medición previa. La Empresa responde con documentos de mantenimiento que no acreditan emisión acústica. La clave es el banco de condensadores no descrito en el proyecto, que puede resultar una fuente no licenciada.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La corporación autónoma regional recibió una queja de vecinos del barrio Villa Nueva, en un municipio del departamento de Cundinamarca, por un zumbido persistente proveniente de la Subestación S-14. Los quejosos describen el sonido como continuo, de tono grave, que aumenta con la lluvia y en noches de alta humedad. Ocho firmas de residentes acompañan la queja, sin identificación de viviendas específicas.
  > 
  > La Empresa respondió mediante comunicación en la que sostiene que la estación cumple con las condiciones de operación autorizadas y que no ha recibido quejas formales previas por la vía institucional. Adjunta un registro de mantenimiento de los transformadores y un informe de inspección visual del cerramiento.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > La corporación revisó la información disponible. El registro de mantenimiento es completo en las actividades mecánicas y eléctricas, pero no contiene mediciones de ruido. El informe de inspección visual no evalúa la emisión acústica. No se realizó medición en los predios de los quejosos, de modo que no hay evidencia técnica que confirme ni descarte la excedencia de los niveles permisibles.
  > 
  > Los quejosos indicaron que el zumbido se percibe con mayor intensidad en el costado oriental de la estación, donde se encuentra un banco de condensadores de compensación reactiva que no figura en la descripción del proyecto licenciado. La Empresa no hizo referencia a este equipo en su respuesta. La ausencia de una descripción en el licenciami […]

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

### QAMB-RUI-002

- **Título:** Oficio por zumbido y vibración atribuidos a subestación en un municipio de Bolívar
- **Tipo de instrumento:** Oficio
- **Qué ordena:** Realizar medición nocturna de siete noches con subestación en carga alta, incluir vibración en estructuras con acelerómetro y notificar a la junta de acción comunal la fecha.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La autoridad ambiental recibió un escrito de la junta de acción comunal de un sector del municipio de Magangué, departamento de Bolívar, en el que se denuncia un zumbido continuo y vibración en las paredes de viviendas próximas a la Subestación S-51. La junta refiere que las molestias se intensificaron después de una ampliación de la subestación y que algunos vecinos presentan dificultades de sueño.
  > 
  > La Empresa respondió que la ampliación cumplió todas las condiciones del licenciamiento y que sus mediciones de la última auditoría anual arrojaron valores dentro de los límites. Adjunta el informe de auditoría, con medición diurna y nocturna.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El informe de auditoría fue realizado en un día de baja demanda eléctrica, con los transformadores operando al 40 por ciento de su carga nominal. Las quejas se refieren a un período de alta demanda, en el que la emisión de los transformadores aumenta. Por ello, la medición aportada no representa las condiciones de la queja.
  > 
  > La vibración audible en paredes no ha sido evaluada en el estudio. El zumbido de baja frecuencia puede transmitirse por estructura y no siempre se detecta con sonómetros de medición en el aire.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > La queja presentada por la comunidad activa la obligación de la autoridad de verificar la situación. El informe de la Empresa cumple parcialmente la verificación, pero no atiende la condición de operación en la que se produce el problema. La Resolución 627 de 2006 fija los niveles de referencia para receptores, sin excluir las condiciones de carga máxima.
  > 
  > RESUELVE
  > 
  > ARTÍCULO PRIMERO. Requerir a la Empresa una medición nocturna con la subestación en condiciones de carga alta, al menos durante siete noches, en tres viviendas señaladas por la junta de acción comunal.
  > 
  > ARTÍCULO SEGUNDO. Incluir en la medición la evaluación de vibración en estructuras con acelerómetro y el registro de carga de los transformadores durante el período.
  > 
  > ARTÍCULO TERCERO. Informar a la junta de acción comunal la fecha de la campaña con antelación suficiente para permitir la presencia de representantes.
  > 
  > ARTÍCULO CUARTO. Realizar la medición de la emisión de los dos transformadores con la subestación en carga alta, durante no menos de siete noches, con registro de la carga de cada equipo y de la temperatura del aceite.
  > 
  > ARTÍCULO QUINTO. Evaluar la vibración en las viviendas del sector con acelerómetros instalados sobre el piso y en las paredes, con registro de la frecu […]

Candidatos a juzgar para QAMB-RUI-002: AMB-CAG-002, AMB-LIC-002, AMB-LIC-003, AMB-OCC-002, AMB-RES-001, AMB-RES-004, AMB-RUI-001, AMB-RUI-002, AMB-RUI-003, AMB-RUI-004, AMB-RUI-005, AMB-SAN-001, AMB-SAN-002, AMB-VER-003

### QAMB-SAN-001

- **Título:** Medida preventiva de suspensión de descargas de agua de refrigeración en Subestación S-12 en Bolívar
- **Tipo de instrumento:** Auto
- **Qué ordena:** Suspender de inmediato las descargas de refrigeración de la Subestación S-12 al caño, contener y retirar la espuma oleosa en cinco días con certificado de gestor, y presentar registros de temperatura y calidad de los últimos doce meses.
- **Resumen del análisis:** Medida preventiva inmediata por descarga de agua de refrigeración con aceite y mortandad de peces en un caño que alimenta humedales. La suspensión dura hasta instalar separador y obtener permiso de vertimiento, lo que puede tomar semanas. La empresa debe actuar de inmediato en la contención y en la solicitud del permiso, porque la mortandad y la falta de permiso elevan el riesgo de un procedimiento sancionatorio posterior.
- **Texto (inicio):**

  > CONSIDERANDO
  > 
  > Que la corporación, en visita de control a la Subestación S-12, propiedad de la Empresa, ubicada en un municipio de Bolívar, verificó que se realizaban descargas de agua de refrigeración de equipos de potencia, con temperatura elevada y restos de aceite, hacia un caño que desemboca en un complejo de humedales.
  > 
  > Que en el acta de visita se dejó constancia de la presencia de espuma oleosa en la superficie del caño, de la muerte de un número considerable de peces en el tramo inmediato y de la ausencia de un sistema de separación de hidrocarburos en la descarga.
  > 
  > Que el expediente de la Empresa no incluye el permiso de vertimiento vigente para la descarga del sistema de refrigeración.
  > 
  > CONSIDERACIONES
  > 
  > La situación constituye un riesgo inminente para la fauna acuática del complejo de humedales y para los pescadores de la zona. Las pruebas de campo indican presencia de aceite mineral en concentración superior a la permitida para cuerpos de agua de la categoría del caño.
  > 
  > La medida preventiva procede de conformidad con el artículo 12 de la Ley 1333 de 2009, con el fin de impedir la continuación del hecho mientras se adelanta el procedimiento.
  > 
  > La corporación considera que la descarga de agua de refrigeración con temperatura elevada tiene un efecto térmico adicional sobre el caño, que reduce el oxígeno disuelto y puede explicar, junto con la presencia de aceite, la mortandad observada. Este efecto no fue medido por la Empresa en sus registros y debe considerarse en el análisis de la gravedad de la infracción y en el diseño del sistema de enfriamiento que se exija.
  > 
  > La Empresa no dispone de un plan de respuesta a derrames para el área de equipos de potencia de la subestación. Se observó que los materiales de contención se encontraban almacenados lejos del patio de transformadores y que el personal de operación no tenía entrenamiento documentado en atención de derrames. La corporación exige que este plan se presente con el registro de capacitaciones y el inventario de materiales disponibles.
  > 
  > Para la reanudación de las descargas, la Empresa deberá demostrar que el separador de aceites opera con eficiencia adecuada y que el efluente final cumple los límites de temperatura y de hidrocarburos aplicables al cuerpo de agua receptor. Hasta que se presenten estos soportes, la medida preventiva se mantendrá vigente.
  > 
  > DISPONE
  > 
  > ARTÍCULO PRIMERO. Imponer medida preventiva de suspensión inmediata de las descargas del sistema de refrigeración de la Subestación S-1 […]

Candidatos a juzgar para QAMB-SAN-001: AMB-CAG-001, AMB-CAG-002, AMB-CAG-005, AMB-LIC-003, AMB-LIC-005, AMB-RES-003, AMB-RES-004, AMB-SAN-001, AMB-VER-001, AMB-VER-002, AMB-VER-003, AMB-VER-004, AMB-VER-005

### QAMB-SAN-003

- **Título:** Resolución que decide sanción económica por incumplimiento reiterado de obligaciones del PMA en Antioquia
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Imponer multa de ciento veinte salarios mínimos mensuales por incumplimiento reiterado del PMA, ordenar terminar la estabilización de dos sectores en noventa días y entregar certificados de residuos de los cuatro frentes.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > CONSIDERANDO
  > 
  > Que dentro del proceso sancionatorio contra la Empresa se formularon cargos por el incumplimiento de tres obligaciones del plan de manejo ambiental de la Línea Norte 115 kV en un municipio de Antioquia: la no ejecución de las obras de estabilización de taludes, el incumplimiento del programa de manejo de residuos de obra y el retraso en la entrega de los informes semestrales de seguimiento.
  > 
  > Que la Empresa presentó descargos y aportó el cronograma de estabilización, los certificados de disposición de residuos de dos de los cuatro frentes y los informes semestrales de los dos últimos periodos.
  > 
  > Que la corporación verificó en campo que las obras de estabilización se encuentran ejecutadas en un sesenta por ciento y que dos sectores permanecen sin protección.
  > 
  > CONSIDERACIONES
  > 
  > Para la graduación de la sanción se tuvo en cuenta la reiteración de la conducta, que fue objeto de dos requerimientos previos sin cumplimiento total, así como la capacidad económica del infractor, la ausencia de daño irreversible y la colaboración parcial demostrada en el expediente.
  > 
  > La corporación consideró que la falta de estabilización de dos sectores de talud durante un periodo prolongado incrementa la probabilidad de remoción en masa en la temporada de lluvias, con afectación de la calidad del agua de la quebrada receptora y de predios vecinos. El riesgo no se ha materializado en daño, pero el expediente demuestra que la Empresa conocía la obligación desde la aprobación del plan y no adoptó medidas provisionales de contención.
  > 
  > En cuanto a los informes semestrales, la corporación verificó que fueron presentados con más de sesenta días de retraso en el último periodo, y que el primer informe no incluía el registro fotográfico ni la georreferenciación de las obras. Estas deficiencias se consideraron leves por sí mismas, pero se valoraron en conjunto con la reiteración para la graduación de la sanción.
  > 
  > La Empresa podrá acreditar la ejecución de las obras pendientes mediante actas de obra, registros fotográficos georreferenciados y un informe firmado por profesional idóneo. El cumplimiento de estas órdenes no extingue la multa impuesta, pero será considerado por la corporación en los futuros procesos de seguimiento.
  > 
  > La Empresa tendrá la oportunidad de demostrar en la etapa de descargos que los problemas de los informes semestrales se corrigieron con la contratación de un profesional de seguimiento ambiental, y que el monitoreo de la estabilización cuenta ya con registr […]

Candidatos a juzgar para QAMB-SAN-003: AMB-CAG-005, AMB-CFO-003, AMB-CFO-004, AMB-LIC-002, AMB-LIC-005, AMB-OCC-002, AMB-OCC-004, AMB-RES-004, AMB-RUI-004, AMB-SAN-001, AMB-SAN-002, AMB-SAN-003, AMB-SAN-004, AMB-SAN-005, AMB-VED-004, AMB-VER-003, AMB-VER-004, AMB-VER-005

### QAMB-VED-002

- **Título:** Resolución que condiciona el manejo de fauna y flora vedada durante despeje en bosque húmedo de Chocó
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Condicionar el despeje de corredor en bosque húmedo a un cronograma de suspensión ajustado al periodo de cría del primate, rescate de palma vedada, inspección previa con bitácora, plan de vigilancia y conectividad en sesenta días, y suspensión ante hallazgo de cría.
- **Resumen del análisis:** Levantamiento de veda en bosque húmedo con dos especies en veda y un cronograma de suspensión que no coincide con la época de cría reportada. El riesgo es alto porque una labor en temporada de cría o un hallazgo no atendido activa la suspensión y puede derivar en un procedimiento sancionatorio. Conviene ajustar el cronograma antes del inicio y preparar el plan de vigilancia posterior, que hoy no está incluido.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La corporación resolvió sobre el plan de manejo presentado por la Empresa para el despeje de un corredor de la Línea Costa 110 kV, que atraviesa un fragmento de bosque húmedo tropical en un municipio del Chocó. La autorización de levantamiento de veda cubre especies de fauna y de flora asociadas, entre ellas un primate y una especie de palma en veda.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El plan contempla el rescate de la palma, la inspección previa de árboles para detectar nidos y madrigueras, la suspensión de labores en la temporada de cría y un equipo de respuesta para hallazgos de fauna. La corporación encuentra que el cronograma de suspensión no coincide con el calendario de cría reportado por la literatura para el primate, por lo que se requiere ajuste.
  > 
  > El plan no incluye la vigilancia posterior al despeje ni el seguimiento de la conectividad del corredor de dispersión. La ausencia de estos elementos reduce la probabilidad de que la obra no afecte a la población de fauna.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > La autorización de levantamiento de veda depende de la aprobación de medidas de manejo que hacen parte de la condición de ejecución. El incumplimiento de estas medidas da lugar a infracción ambiental.
  > 
  > Un elemento central del análisis es la coincidencia del cronograma de suspensión con la época de cría del primate. El calendario reportado por la literatura para la región indica que los nacimientos se concentran en la segunda mitad del año, mientras que el cronograma propuesto suspende labores sólo durante dos semanas. La corporación considera que una suspensión tan corta no protege la cría, y exige que el cronograma cubra el periodo completo de dependencia materna.
  > 
  > La vigilancia posterior al despeje debe incluir censos de la población del primate y de la palma en el corredor de dispersión durante dos años, con la identificación de los individuos que utilizan el paso y el seguimiento de cualquier desplazamiento hacia áreas fragmentadas. Estos datos permitirán evaluar si la conectividad se mantiene y si el corredor cumple su función ecológica una vez intervenido.
  > 
  > La destrucción de individuos de la palma, aun tratándose de ejemplares jóvenes, constituye una infracción grave. Los vehículos y la maquinaria deberán ingresar al corredor sólo por las rutas aprobadas, con el fin de limitar la compactación del suelo y el daño a la regeneración natural.
  > 
  > RESUELVE
  > 
  > ARTÍCULO PRIMERO. Condicionar el levantamiento de veda a la aprobación de un cronograma de suspen […]

Candidatos a juzgar para QAMB-VED-002: AMB-CAG-005, AMB-CFO-002, AMB-LIC-001, AMB-LIC-005, AMB-SAN-001, AMB-SAN-002, AMB-SAN-005, AMB-VED-001, AMB-VED-002, AMB-VED-003, AMB-VED-004, AMB-VED-005, AMB-VER-004

### QAMB-VER-003

- **Título:** Oficio que solicita ajustes al vertimiento de un campamento de obra en La Guajira
- **Tipo de instrumento:** Oficio
- **Qué ordena:** Pide ajustar el sistema del campamento con memoria de cálculo, ubicación del pozo de infiltración a distancia verificada y programa de mantenimiento, o demostrar disposición por gestor autorizado.
- **Resumen del análisis:** Solicitud de ajuste documental para campamento temporal de baja carga contaminante, con riesgo de infiltración cercana a pozos. Riesgo bajo por la naturaleza temporal de la obra y la posibilidad de disposición por gestor.
- **Texto (inicio):**

  > La autoridad ambiental competente se pronuncia mediante el presente oficio sobre el sistema de manejo de aguas residuales del campamento de obra de la Línea Desierto Norte 110 kV, en el municipio de Maicao, departamento de La Guajira. La comunicación se incorpora al expediente SINT-AMB-0025 y responde a la revisión del permiso de vertimientos temporal solicitado por la Empresa para una instalación con población aproximada de treinta trabajadores durante once meses.
  > 
  > ANTECEDENTES. El campamento cuenta con un sistema de tanque séptico seguido de un filtro de arena, cuyo efluente se descarga a un pozo de infiltración ubicado a unos ochenta metros de un drenaje temporal. La Empresa presentó el diseño del sistema, pero la memoria de cálculo no incluye la estimación del caudal diario ni la dimensión del tanque respecto de la población prevista, y el plano no indica la distancia a los pozos de uso doméstico de las viviendas vecinas.
  > 
  > CONSIDERACIONES. Para una instalación temporal de esta magnitud, la carga de aguas residuales domésticas es baja, por lo que el riesgo principal está en la infiltración sin control hacia el acuífero superficial de la zona. La memoria de cálculo debe demostrar que el tanque tiene un volumen suficiente para el caudal previsto y un tiempo de retención adecuado. Igualmente, la distancia al drenaje temporal y a los pozos debe estar verificada con el levantamiento de campo, pues la zona presenta periodos de lluvia intensa de corta duración.
  > 
  > RESPUESTA. Se solicita a la Empresa ajustar el diseño del sistema de tratamiento del campamento con los siguientes contenidos: la memoria de cálculo que incluya el caudal diario estimado por persona, el volumen del tanque y el tiempo de retención; la ubicación georreferenciada del pozo de infiltración con la distancia a drenajes y pozos; y el programa de mantenimiento con la frecuencia de retiro de lodos y de limpieza del filtro de arena.
  > 
  > Si la Empresa opta por la disposición de los efluentes mediante un gestor autorizado, sin descarga al terreno, deberá aportar el contrato vigente y los soportes de recolección, lo que dispensaría el permiso de infiltración, pero no la conservación de la documentación en el campamento durante la vigencia de la obra.
  > 
  > CONSIDERACIONES DE SEGURIDAD HÍDRICA. La zona presenta sectores con nivel freático somero y pozos de uso doméstico de las comunidades vecinas, por lo que cualquier infiltración sin control puede afectar la calidad del agua que consumen. El diseño del pozo […]

Candidatos a juzgar para QAMB-VER-003: AMB-CAG-001, AMB-CAG-002, AMB-CAG-003, AMB-CAG-004, AMB-LIC-002, AMB-LIC-004, AMB-LIC-005, AMB-OCC-002, AMB-RES-003, AMB-RES-005, AMB-SAN-001, AMB-VER-001, AMB-VER-002, AMB-VER-003, AMB-VER-005
