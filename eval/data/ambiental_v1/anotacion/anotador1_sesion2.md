# Etiquetado de relevancia — expedientes ambientales

Eres un abogado ambiental en Colombia. Para cada **expediente consulta** debes juzgar qué tan útil es cada **expediente candidato** como precedente para atenderlo. Juzga cada par por separado, solo con el contenido de los expedientes.

Escala (entero de 0 a 3):
- **3** = misma obligación o situación, directamente aplicable como precedente.
- **2** = mismo tema con diferencias relevantes, útil como referencia.
- **1** = relación tangencial.
- **0** = no relacionado.

Escribe el resultado en `C:\Users\aleja\Documents\Projects\tutelas\tutelas_backend\eval\data\ambiental_v1\anotacion\anotador1_sesion2_resultado.csv`: un CSV en UTF-8 con encabezado exacto `qid,doc_id,relevancia_0a3,razon_breve` y **una fila por cada par listado abajo** (ni más ni menos). La razón breve va entre comillas dobles, en español y con máximo 20 palabras. No leas ningún otro archivo. Al terminar, responde solo cuántas filas escribiste.

Pares a juzgar: **139** (10 consultas, 40 candidatos distintos).

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

### AMB-OCC-005

- **Título:** Resolución que autoriza obra de defensa de ribera para proteger torre cercana al río Chicamocha Sur
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Otorgar permiso de ocupación de cauce para un enrocado de defensa de ribera de ciento ochenta metros en el río Chicamocha Sur, con uso exclusivo de roca y geotextil, obra en periodo seco, informe de revegetalización a sesenta días e inspección anual del enrocado.
- **Resumen del análisis:** Permiso favorable para una obra de protección de torre frente a socavación lateral. El diseño tiene soporte técnico y el impacto está localizado, de modo que el riesgo es bajo. Los puntos a vigilar son la fecha de ejecución en temporada seca, la disposición de sobrantes y el prendimiento de la revegetalización, que suelen ser los incumplimientos más frecuentes en obras de este tipo.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa solicitó permiso de ocupación de cauce para instalar un enrocado de defensa de ribera de ciento ochenta metros en la margen izquierda del río Chicamocha Sur, con el fin de proteger la base de una torre de la Línea Sur 115 kV expuesta a socavación lateral en un municipio de Boyacá.
  > 
  > La solicitud incluye el diseño del enrocado, el estudio de transporte de sedimentos, los planos de la obra y el plan de manejo de maquinaria. La visita de evaluación confirmó el proceso erosivo en la margen y la proximidad de la torre a la orilla, a unos doce metros.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El diseño del enrocado utiliza roca de tamaño mínimo de cuatrocientos milímetros y una capa de filtro geotextil. El cálculo de estabilidad frente a la crecida de diseño resulta satisfactorio. La obra no modifica el régimen de caudales y su efecto sobre el lecho aguas abajo se considera localizado.
  > 
  > La intervención requiere la remoción de vegetación herbácea y de dos arbustos. El plan de revegetalización con especies nativas es suficiente para compensar la intervención, siempre que se ejecute en la temporada húmeda posterior a la obra.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > La obra constituye una intervención permanente del cauce y requiere permiso según el Decreto 1076 de 2015. Se acredita la publicación del aviso y la ausencia de oposiciones.
  > 
  > El estudio de transporte de sedimentos muestra que el río presenta una carga de fondo moderada y que el enrocado no modifica sustancialmente la sección e […]

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

### AMB-RES-002

- **Título:** Oficio de respuesta sobre retrofilling de transformadores con presunto aceite libre de PCB
- **Tipo de instrumento:** Oficio
- **Qué ordena:** Presentar en cuarenta y cinco días análisis de laboratorio acreditado de aceite de los tres transformadores antes de solicitar la exclusión de PCB, manteniendo control de derrames.
- **Resumen del análisis:** Solicitud de exclusión de PCB basada en retrofilling sin análisis posterior. La certificación interna y las fichas de aceite nuevo no prueban la condición del equipo. El caso es de riesgo medio, porque el resultado de laboratorio determina si el inventario se mantiene.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > Mediante comunicación anterior, la autoridad ambiental solicitó a la Empresa el inventario de bifenilos policlorados de la Subestación S-09, ubicada en un municipio del departamento del Tolima. La Empresa responde que los tres transformadores de potencia de la estación fueron reacondicionados mediante retrofilling con aceite dieléctrico nuevo, por lo que, a su juicio, ya no contienen PCB y no requieren eliminación como residuo peligroso.
  > 
  > La respuesta adjunta las fichas técnicas de los aceites nuevos, un registro fotográfico de los trabajos y una certificación interna firmada por el área de mantenimiento.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El retrofilling es una técnica de reemplazo del aceite de un equipo, pero no garantiza por sí misma que la concentración residual de PCB quede por debajo del umbral aplicable. Los restos de aceite contaminado adheridos al núcleo, a las bobinas y a las tuberías pueden migrar al aceite nuevo durante semanas o meses. La certificación interna no reemplaza un análisis de laboratorio acreditado tomado después del período de estabilización.
  > 
  > Las fichas técnicas corresponden a aceites nuevos y no a muestras del equipo en operación. No se aportó ningún resultado analítico posterior al reacondicionamiento. Adicionalmente, uno de los transformadores fue fabricado antes de la fecha de restricción, lo que obliga a verificar su condición de manera directa. Tampoco se informó sobre la disposición del aceite retirado durante el reacondicionamiento, q […]

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

### QAMB-OCC-001

- **Título:** Autorización condicionada de cruce aéreo de Línea Costa 110 kV sobre el río Sinú Medio
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Otorgar permiso de cruce aéreo de un circuito de la Línea Costa 110 kV sobre el río Sinú Medio, con altura libre de sesenta metros, prohibición de acopio en el lecho y en la ciénaga, y estudio de nivel freático antes de la energización.
- **Resumen del análisis:** Permiso favorable para un cruce de gran luz con altura libre amplia. El punto a vigilar no es el cruce en sí sino el efecto sobre el nivel freático de la ciénaga, que sólo se verifica con mediciones en dos ciclos hidrológicos y puede retrasar la energización. Conviene planear desde ya la instalación de piezómetros y la documentación de la poda.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa solicitó permiso de ocupación de cauce para el cruce aéreo de un circuito de la Línea Costa 110 kV sobre el río Sinú Medio, en un municipio de Córdoba. El cruce tiene una luz de trescientos veinte metros entre dos apoyos instalados en las márgenes, con una altura libre de sesenta y dos metros sobre el nivel de aguas ordinarias.
  > 
  > El expediente incluye el estudio de navegabilidad del río, la memoria de cálculo mecánico del conductor, el informe hidrológico con período de retorno de cien años y el plan de manejo de la franja de servidumbre en ambas orillas.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > La corporación revisó el informe hidrológico y encontró que la altura libre cumple con el margen de seguridad frente a la creciente de diseño. Se observa, sin embargo, que los apoyos se encuentran a menos de cuarenta metros del borde de la ronda de un humedal de ciénaga conectado al cauce principal, lo que exige verificar el efecto de la obra sobre el nivel freático.
  > 
  > La intervención en el lecho se limita a la cimentación de los apoyos fuera del cauce permanente. No se requiere retiro de vegetación de ribera significativa, aunque sí una poda de mantenimiento en la franja de seguridad.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > El permiso se evalúa conforme al Decreto 1076 de 2015. El trámite se surtió con publicación del aviso y con la intervención de la alcaldía municipal, que no presentó objeciones.
  > 
  > Sobre la ciénaga, el estudio hidrológico presentado sólo cubre el cauce principal y no modela el intercambio de flujo entre el río y el humedal durante la creciente. Dado que la distancia entre los apoyos y el borde de la ronda es limitada, la Empresa debe describir cómo mantendrá la conectividad hidráulica del humedal durante las obras y durante la operación.
  > 
  > La alcaldía municipal manifestó en su respuesta que existe un proyecto de adecuación de la vía de acceso al humedal para pescadores. La Empresa debe coordinar con la administración municipal la ubicación de sus accesos de obra para que no coincidan con esa vía, e informar a la corporación el resultado de esa coordinación antes de iniciar la cimentación de los apoyos cercanos a la ronda.
  > 
  > Se recuerda que la verificación del nivel freático debe realizarse con piezómetros instalados antes del inicio de la cimentación, y que los registros deben conservarse para ser presentados junto con el informe de cumplimiento del permiso.
  > 
  > RESUELVE
  > 
  > ARTÍCULO PRIMERO. Otorgar a la Empresa permiso de ocupación de cauce para el cruce […]

Candidatos a juzgar para QAMB-OCC-001: AMB-CAG-002, AMB-CFO-001, AMB-LIC-001, AMB-LIC-002, AMB-OCC-001, AMB-OCC-002, AMB-OCC-005, AMB-RUI-001, AMB-SAN-002, AMB-SAN-004, AMB-VED-004, AMB-VED-005, AMB-VER-005

### QAMB-OCC-002

- **Título:** Solicitud de permiso para acceso vial en zona de ronda de quebrada Aguas Claras en Nariño
- **Tipo de instrumento:** Auto
- **Qué ordena:** Suspender el relleno de la margen y exigir en la evaluación una alternativa por la vía veredal existente, diseño hidráulico de la alcantarilla con caudal comunitario, protección del nacimiento y plan de comunicación con la junta.
- **Resumen del análisis:** Acceso vial temporal que pone en riesgo una fuente de agua de uso productivo y una margen con erosión activa. La corporación ya sugiere una alternativa por vía existente, lo que puede resolver el caso sin permiso de ocupación. El riesgo es alto por la oposición comunitaria documentada y el nacimiento cercano; conviene evaluar la alternativa antes de presentar un diseño que la corporación podría rechazar.
- **Texto (inicio):**

  > CONSIDERANDO
  > 
  > Que la Empresa solicitó permiso de ocupación de cauce para un acceso vial de ochenta metros que conecta una vía veredal con la base de una torre de la Línea Costa 110 kV, sobre la quebrada Aguas Claras, en un municipio de Nariño. El acceso requiere una alcantarilla de tubo de concreto de un metro veinte de diámetro y el relleno de la margen derecha.
  > 
  > Que en el aviso de publicación una junta de acción comunal manifestó que la quebrada es fuente de agua para el beneficio de café de la vereda y que el relleno de la margen ya ha generado derrumbes en temporadas anteriores.
  > 
  > Que la visita técnica confirmó la presencia de un sector con erosión de margen y la existencia de un nacimiento de agua a unos quince metros del trazado proyectado.
  > 
  > CONSIDERACIONES
  > 
  > El trazado afecta la estabilidad de la margen y la calidad de la fuente que abastece la actividad productiva local. La alcantarilla proyectada subestima el caudal de creciente registrado por la comunidad y el diseño no incorpora el nacimiento.
  > 
  > Se trata de un acceso temporal que podría reubicarse por la vía existente, y así lo recomienda el concepto técnico de la corporación.
  > 
  > Un análisis adicional sobre el nacimiento detectado indica que se trata de una surgencia permanente que alimenta el sistema de captación del beneficiadero de café. Cualquier alteración del aporte subterráneo o del suelo de recarga, incluso temporal, afectaría la operación productiva de la vereda, por lo que la protección del nacimiento debe considerarse criterio excluyente en el diseño de la alternativa de acceso.
  > 
  > En relación con la alternativa por la vía veredal existente, la Empresa deberá demostrar que el tránsito de maquinaria y de camiones de transporte de estructuras no afectará la banca de la vía ni a los usuarios de la comunidad. El análisis comparativo debe incluir los costos de adecuación, la duración de la obra, el número de viajes previstos y las medidas de restauración de la vía al finalizar el montaje.
  > 
  > La corporación destaca además que la comunidad manifestó no haber sido consultada sobre el trazado del acceso antes de la radicación. La Empresa debe realizar una reunión con la junta de acción comunal y dejar constancia en acta de las inquietudes recibidas y de la respuesta dada.
  > 
  > Por último, la corporación recuerda que el aviso de publicación de la solicitud fue fijado durante el término legal y que las observaciones de la junta de acción comunal se incorporan al expediente como prueba. La Empresa no puede de […]

Candidatos a juzgar para QAMB-OCC-002: AMB-CAG-002, AMB-CFO-004, AMB-LIC-004, AMB-LIC-005, AMB-OCC-001, AMB-OCC-002, AMB-OCC-003, AMB-OCC-004, AMB-OCC-005, AMB-RES-003, AMB-RUI-005, AMB-SAN-002, AMB-SAN-004, AMB-VER-002

### QAMB-OCC-003

- **Título:** Solicitud de permiso para muro de contención en la orilla de un afluente del río Magdalena en Huila
- **Tipo de instrumento:** Requerimiento
- **Qué ordena:** Requerir en sesenta días el estudio de transporte de sedimentos, el análisis de evolución de la sección en diez años, la reconciliación de planos y la modelación de crecientes, sin ejecutar gaviones en el lecho.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa solicitó permiso de ocupación de cauce para la construcción de un muro de contención de gaviones de sesenta metros de longitud sobre la orilla de un afluente del río Magdalena, en un municipio del sur del Huila. El muro protegería la base de una torre de la subestación de enlace que se encuentra a nueve metros del borde del agua.
  > 
  > CONSIDERACIONES
  > 
  > La corporación observa que la solicitud carece de estudio de transporte de sedimentos y de un análisis de la dinámica del afluente durante los últimos diez años. La información sobre el ancho de la sección transversal es contradictoria entre el plano y la memoria.
  > 
  > El muro de gaviones ocupa parte del lecho menor durante la época de estiaje y no se determina si afectaría el flujo en crecientes.
  > 
  > La corporación considera que el muro de gaviones, por su naturaleza, es una estructura rígida que transfiere la energía de la corriente a los extremos no protegidos. Si el muro se construye sin análisis del efecto sobre el flujo, puede generar socavación aguas abajo de su extremo y desplazar el problema hacia predios vecinos. Por ello la modelación de crecientes no es un trámite formal, sino el elemento que permite determinar si la obra es viable y en qué condiciones.
  > 
  > El expediente no contiene el diagnóstico de la erosión lateral del afluente ni el registro de los eventos de inundación ocurridos en los últimos años. La información de la comunidad y de la alcaldía sobre el comportamiento del afluente debe incorporarse al estudio, pues su experiencia histórica es un insumo valioso para validar los modelos y definir el caudal de diseño.
  > 
  > La Empresa debe considerar alternativas de protección menos intrusivas, como la reubicación temporal de la base de la torre o un enrocado sin relleno de la sección, cuya viabilidad técnica deberá compararse en el informe. La decisión de la corporación dependerá de que el análisis demuestre que la alternativa elegida es la de menor afectación al cauce y a la ronda.
  > 
  > Cabe anotar que el afluente atraviesa dos predios de uso agropecuario y que la modelación debe identificar el efecto del muro sobre la margen de cada predio, con la extensión de la zona de influencia aguas arriba y aguas abajo. El estudio también debe indicar si la obra altera la dirección de la corriente en el punto de captación de la vereda y si se requiere un tramo de transición para evitar cambios bruscos de la sección.
  > 
  > La corporación considera necesario que el informe de la Empresa incluya un plan de […]

Candidatos a juzgar para QAMB-OCC-003: AMB-CAG-002, AMB-CAG-005, AMB-LIC-004, AMB-LIC-005, AMB-OCC-001, AMB-OCC-002, AMB-OCC-003, AMB-OCC-004, AMB-OCC-005, AMB-RES-004, AMB-RUI-002, AMB-RUI-005, AMB-SAN-002, AMB-VED-004

### QAMB-OCC-004

- **Título:** Concepto de viabilidad para cruce de línea sobre quebrada Chorrera Negra en Antioquia
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Otorgar permiso de cruce aéreo sobre la quebrada Chorrera Negra con vano de ciento cincuenta metros, mantener altura libre sobre la creciente de diseño, instalar señalización de alta tensión antes de energizar y no intervenir la ronda.
- **Resumen del análisis:** Permiso favorable de cruce con vano amplio y apoyos fuera de la ronda, con mínima intervención del cauce. El riesgo es bajo. La condición práctica a cumplir es la señalización en ambas márgenes antes de energizar, con informe fotográfico, que suele ser la última actividad en cerrarse y la que la corporación verificará.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa solicitó permiso de ocupación de cauce para el cruce de la Línea Sur 115 kV sobre la quebrada Chorrera Negra, en un municipio del Suroeste antioqueño. El cruce se resuelve con un vano de ciento cincuenta metros, sin apoyos dentro de la ronda hídrica, y la solicitud incluye un plan de manejo de la franja de servidumbre.
  > 
  > El trámite incluyó visita técnica, publicación del aviso y revisión del estudio hidrológico con período de retorno de cincuenta años.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > Los apoyos quedan por fuera de la ronda, de modo que la intervención se limita al sobrevuelo del conductor. La altura libre sobre el nivel de creciente cumple con el margen de seguridad. No se requiere tala de vegetación de ribera, pues el corredor está ocupado por pastos y rastrojos.
  > 
  > La Empresa propone instalar señalización de alta tensión en ambas márgenes para evitar el ingreso de personas con equipos de pesca o minería artesanal, medida que la corporación considera apropiada.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > El permiso se otorga conforme al Decreto 1076 de 2015. No se formularon oposiciones dentro del término de publicación.
  > 
  > La corporación considera que el vano de ciento cincuenta metros permite evitar la intervención de la ronda con apoyos, lo que constituye la mejor alternativa de diseño para la quebrada. Sin embargo, la altura de los conductores en el punto medio del vano debe calcularse con las condiciones de temperatura máxima y de flecha por carga de hielo o de viento, de acuerdo con la memoria de cálculo mecánico, y no sólo con la altura de creciente.
  > 
  > Respecto de los accesos, el proyecto utiliza un camino existente de uso agropecuario que atraviesa la ronda en un punto sin cauce permanente. La Empresa deberá mantener ese camino en su estado actual, sin ampliación ni relleno, e informar a la corporación si durante el mantenimiento requiere una intervención adicional sobre la franja, caso en el cual deberá tramitarse la modificación del permiso.
  > 
  > La señalización de alta tensión debe ser visible desde ambas márgenes y mantenerse durante la vida útil de la línea. Se recomienda que la Empresa registre el estado de la señalización en las visitas de mantenimiento e informe a la comunidad local, mediante un aviso en lenguaje sencillo, sobre los riesgos de la cercanía a los conductores.
  > 
  > La corporación recuerda que el permiso de cruce no ampara la instalación de estructuras auxiliares de tensado ni de acopio en la ronda, y que cualquier variación de la ubica […]

Candidatos a juzgar para QAMB-OCC-004: AMB-CAG-004, AMB-CAG-005, AMB-CFO-001, AMB-CFO-003, AMB-LIC-005, AMB-OCC-001, AMB-OCC-002, AMB-OCC-003, AMB-OCC-004, AMB-OCC-005, AMB-RES-003, AMB-SAN-002, AMB-VED-004, AMB-VED-005, AMB-VER-005

### QAMB-RES-001

- **Título:** Resolución por derrame de aceite de interruptor que llegó a humedal en Huila
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Ejecutar en treinta días el plan de restauración del humedal con retiro de material a gestor autorizado, analizar PCB en aceite y sedimentos y actualizar el plan de contingencia.
- **Resumen del análisis:** Derrame de aceite de interruptor que alcanzó un humedal que drena a un afluente del Magdalena. El ecosistema tiene protección especial y el plan de contingencia no previó barreras ni notificación. Es un caso de alto riesgo con sancionatorio.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa reportó un derrame de aproximadamente 400 litros de aceite dieléctrico desde un interruptor en aceite de la Subestación S-55, ubicada en un municipio del departamento del Huila. El evento ocurrió durante una falla interna del equipo, con expulsión de aceite por la válvula de alivio. Según el reporte, la tina de contención retuvo la mayor parte del aceite, pero una fracción superó el borde por la pendiente del terreno y alcanzó un humedal de unas tres hectáreas que drena hacia un afluente del río Magdalena.
  > 
  > La autoridad recibió el reporte de la Empresa a las veinte horas del evento y realizó visita el día siguiente. La Empresa activó barreras de contención en el humedal y retiró parte del material superficial.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > La visita constató aceite en la lámina de agua del humedal en una franja de unos ochenta metros de longitud, con afectación de la vegetación de borde. Las muestras de agua en el punto de salida del humedal presentan hidrocarburos por encima del valor de referencia. El análisis de PCB no ha sido reportado, y el equipo es de fabricación anterior a la restricción, por lo que la verificación es necesaria.
  > 
  > El plan de contingencia de la estación existe, pero no contempla la barrera perimetral del humedal ni el procedimiento de notificación a las comunidades que usan el cuerpo de agua para el abrevadero.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > El humedal es un ecosistema de especial protección que activa un nivel de exigencia mayor en la evaluación de la afectación. El Decreto 1076 de 2015 y la Ley 99 de 1993 obligan al titular a adoptar medidas de restauración del ecosistema afectado. La falla del equipo y la insuficiencia del plan de contingencia configuran un incumplimiento que la autoridad debe investigar bajo la Ley 1333 de 2009.
  > 
  > RESUELVE
  > 
  > ARTÍCULO PRIMERO. Ordenar a la Empresa un plan de restauración del humedal, con retiro del material impregnado mediante gestor autorizado, en un plazo de treinta días.
  > 
  > ARTÍCULO SEGUNDO. Realizar análisis de PCB y de hidrocarburos en el aceite del equipo y en los sedimentos del humedal, con resultados en veinte días hábiles.
  > 
  > ARTÍCULO TERCERO. Actualizar el plan de contingencia para incorporar barreras perimetrales en humedales y un protocolo de notificación a las comunidades usuarias.
  > 
  > ARTÍCULO CUARTO. Iniciar procedimiento sancionatorio contra la Empresa por la afectación del ecosistema.
  > 
  > ARTÍCULO QUINTO. Instalar, en un plazo de diez días, barreras de contención perimetral […]

Candidatos a juzgar para QAMB-RES-001: AMB-CAG-001, AMB-LIC-003, AMB-LIC-004, AMB-LIC-005, AMB-RES-001, AMB-RES-002, AMB-RES-003, AMB-RES-004, AMB-RES-005, AMB-SAN-001, AMB-SAN-005, AMB-VED-005, AMB-VER-004

### QAMB-RES-002

- **Título:** Requerimiento por almacenamiento de baterías y aceite usado en bodega arrendada de Caldas
- **Tipo de instrumento:** Requerimiento
- **Qué ordena:** Retirar en quince días baterías y aceite usado a gestor con manifiesto, o instalar contención, cubierta e inventario, y presentar registro de generador y certificados de entrega.
- **Resumen del análisis:** Acopio de baterías y aceite usado en una bodega arrendada en zona residencial sin contención ni inventario. El retiro en plazo corto es la medida principal. El riesgo es medio por la cercanía a viviendas y la carga combustible.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La autoridad ambiental realizó una visita a una bodega arrendada por la Empresa en un municipio del departamento de Caldas, utilizada como depósito de repuestos y residuos de las cuadrillas de mantenimiento de la Línea Oriente 500 kV. La bodega almacena baterías de níquel cadmio, ciento veinte litros de aceite usado en recipientes plásticos y material absorbente impregnado en sacos.
  > 
  > La Empresa informó que la bodega se utiliza como punto de acopio mientras se programa la entrega a un gestor, y que los residuos se generaron en actividades de mantenimiento de los últimos seis meses.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > Los recipientes de aceite usado se encuentran sobre estanterías de madera, sin bandeja de contención ni cubierta. El piso de la bodega es de cemento sin sellar, con grietas visibles. Las baterías están apiladas en el suelo junto a una puerta de servicio. No hay registro de inventario de residuos ni fecha de ingreso de cada recipiente.
  > 
  > La bodega se encuentra en una zona urbana de uso residencial, a unos treinta metros de viviendas. El riesgo principal es la dispersión de aceite por lluvia o por fuego, dada la mezcla de materiales combustibles almacenados.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > El Decreto 4741 de 2005 regula el almacenamiento de residuos peligrosos y exige condiciones de contención, señalización y registro de la cantidad y fecha de generación. El titular responde por el almacenamiento aun cuando el lugar sea de un tercero, pues es el generador de los residuos. La situación exige una respuesta de medidas preventivas, sin perjuicio de la verificación del registro de generador.
  > 
  > RESUELVE
  > 
  > ARTÍCULO PRIMERO. Requerir a la Empresa retirar de la bodega las baterías y el aceite usado en un plazo de quince días, entregándolos a gestor autorizado con manifiesto.
  > 
  > ARTÍCULO SEGUNDO. Si el retiro no es posible en el plazo, instalar una bandeja de contención, una cubierta y señalización de riesgo, y llevar un inventario con fecha de ingreso de cada residuo.
  > 
  > ARTÍCULO TERCERO. Presentar el registro como generador de residuos peligrosos de las instalaciones y los certificados de entrega de los últimos seis meses.
  > 
  > ARTÍCULO CUARTO. Informar a la autoridad la fecha de entrega al gestor, con soporte del manifiesto.
  > 
  > ARTÍCULO QUINTO. Disponer las baterías de níquel cadmio en un lugar cubierto, sobre bandeja de contención y separadas del aceite usado, mientras se completa el retiro.
  > 
  > ARTÍCULO SEXTO. Revisar el contrato de arrendamiento de la bodega en lo […]

Candidatos a juzgar para QAMB-RES-002: AMB-CAG-003, AMB-CAG-004, AMB-LIC-003, AMB-LIC-005, AMB-RES-001, AMB-RES-002, AMB-RES-003, AMB-RES-004, AMB-RES-005, AMB-SAN-001, AMB-VER-002, AMB-VER-004, AMB-VER-005

### QAMB-RES-003

- **Título:** Oficio de respuesta sobre equipos con condensadores de PCB en subestación de Nariño
- **Tipo de instrumento:** Oficio
- **Qué ordena:** Completar en cuarenta y cinco días la documentación de seis condensadores sin placa, corregir el listado de activos y analizar en laboratorio los equipos no documentados.
- **Resumen del análisis:** (sin análisis)
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La autoridad ambiental solicitó a la Empresa información sobre los condensadores instalados en la Subestación S-61, ubicada en un municipio del departamento de Nariño, en relación con la identificación de bifenilos policlorados. La Empresa responde mediante oficio en el que afirma que la estación cuenta con once condensadores de compensación reactiva, todos ellos con placa de fabricante posterior a la restricción de PCB.
  > 
  > La respuesta incluye copia de las placas de cinco equipos, tomada mediante fotografías, y un listado de activos extraído del sistema de gestión de la Empresa.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > Las fotografías corresponden a cinco de los once condensadores declarados. Los seis restantes no tienen soporte documental de placa. El listado de activos registra una fecha de instalación diferente a la declarada en la respuesta para dos de los equipos fotografiados, lo que sugiere que se trata de equipos reemplazados sin actualizar el registro.
  > 
  > La placa fotografiada no permite verificar la composición del dieléctrico en los casos en que el fabricante no especifica el tipo de líquido. No se aportaron análisis de laboratorio de los equipos.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > La Resolución 1407 de 2018 exige que el titular identifique de manera verificable los equipos que pueden contener PCB. La declaración del titular es un elemento de la respuesta, pero debe estar soportada en documentación que permita su verificación. La inconsistencia entre el listado de activos y la declaración impide tener por verificado el inventario.
  > 
  > La autoridad no considera en este momento una decisión de fondo, ya que se trata de una respuesta a requerimiento de información.
  > 
  > RESUELVE
  > 
  > ARTÍCULO PRIMERO. Requerir a la Empresa completar la documentación de los seis condensadores sin placa, mediante fotografías, número de serie y certificado del fabricante cuando exista.
  > 
  > ARTÍCULO SEGUNDO. Corregir el listado de activos para los dos equipos con fecha de instalación inconsistente y remitir el listado depurado.
  > 
  > ARTÍCULO TERCERO. Si algún equipo no puede documentarse, realizar análisis de laboratorio de su dieléctrico, con toma de muestra acreditada.
  > 
  > ARTÍCULO CUARTO. Presentar la información en un plazo de cuarenta y cinco días calendario.
  > 
  > ARTÍCULO QUINTO. Presentar un análisis de la capacidad de la tina de contención de los transformadores de la subestación, con el cálculo del volumen de aceite de cada equipo y del volumen de agua lluvia de un evento de diseño.
  > 
  > ARTÍCULO S […]

Candidatos a juzgar para QAMB-RES-003: AMB-CAG-002, AMB-CAG-003, AMB-CAG-004, AMB-CFO-004, AMB-OCC-002, AMB-RES-001, AMB-RES-002, AMB-RES-003, AMB-RES-004, AMB-RES-005, AMB-RUI-001, AMB-RUI-002, AMB-RUI-003, AMB-RUI-004, AMB-SAN-002, AMB-VED-004, AMB-VER-003

### QAMB-RUI-001

- **Título:** Auto que pide verificar ruido nocturno de subestación de 230 kV en el oriente antioqueño
- **Tipo de instrumento:** Auto
- **Qué ordena:** Realizar campaña de diez noches en dos épocas del año, recalcular la propagación con datos de sitio, evaluar la reducción de ventiladores y definir medidas adicionales si se supera el límite.
- **Resumen del análisis:** Estudio de ruido de una sola noche para una estación nueva con viviendas a menos de trescientos metros. El modelo estima excedencia y la medida propuesta no está cuantificada. La clave es la representatividad estacional.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa presentó el estudio de ruido de la Subestación S-70, nueva estación de 230 kV ubicada en zona rural de un municipio del oriente del departamento de Antioquia, con el fin de obtener la aprobación del componente de ruido de la licencia de construcción. El estudio consiste en una sola noche de medición realizada en el mes de julio, en dos puntos ubicados en el lindero de la propiedad, y una modelación de propagación para las viviendas de la vereda La Cuchilla Alta.
  > 
  > La vereda tiene catorce viviendas a menos de trescientos metros de la estación. Los habitantes presentaron observaciones durante el trámite, indicando que el paisaje sonoro nocturno en la zona depende de quebradas y de ganado, y que la temporada de lluvias altera de manera notable el ambiente.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > La medición de una sola noche en época seca no representa el régimen sonoro del sector durante el año. El modelo de propagación utiliza un coeficiente de absorción de suelo que la propia Empresa describe como conservador, y no incorpora la humedad ni la inversión térmica que caracteriza las noches de la vereda. Los resultados modelados indican niveles de 47 dB(A) en la vivienda más próxima durante el horario nocturno, por encima del límite de 45 dB(A) para zona residencial.
  > 
  > La Empresa propone reducir la velocidad de los ventiladores de los transformadores durante la noche como medida principal, sin cuantificar el efecto de esa reducción sobre la temperatura de operación ni sobre la emisión tonal.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > La Resolución 627 de 2006 exige demostrar el cumplimiento de los niveles en los receptores, y el estudio presentado no cumple esa exigencia porque no es representativo de las condiciones del sitio. El Decreto 1076 de 2015 permite que la autoridad solicite información adicional antes de pronunciarse sobre la viabilidad del componente de ruido.
  > 
  > RESUELVE
  > 
  > ARTÍCULO PRIMERO. Requerir a la Empresa una campaña de medición de ruido de diez noches en al menos tres puntos, distribuidas en dos épocas del año: temporada seca y temporada de lluvias, con registro de condiciones meteorológicas.
  > 
  > ARTÍCULO SEGUNDO. Recalcular la propagación con los coeficientes de absorción medidos en el sitio y con la inversión térmica registrada en las campañas.
  > 
  > ARTÍCULO TERCERO. Presentar una evaluación de la medida de reducción de velocidad de los ventiladores, con datos de temperatura de los transformadores y de emisión tonal, y definir las medidas adicionales si […]

Candidatos a juzgar para QAMB-RUI-001: AMB-CAG-001, AMB-CAG-003, AMB-CFO-005, AMB-LIC-003, AMB-LIC-004, AMB-OCC-002, AMB-RUI-001, AMB-RUI-002, AMB-RUI-003, AMB-RUI-004, AMB-RUI-005, AMB-SAN-005, AMB-VED-003

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

### QAMB-RUI-003

- **Título:** Resolución que exige barrera acústica en subestación junto a una clínica en Tolima
- **Tipo de instrumento:** Resolución
- **Qué ordena:** Modelar la fachada de la clínica como zona de tranquilidad, diseñar barrera certificada con ensayos, incluir el componente tonal de 120 Hz y no energizar sin medición directa.
- **Resumen del análisis:** Ampliación de subestación con clínica nocturna a ochenta metros. El plan usa clasificación de uso mixto que no corresponde al receptor y la barrera de tierra no tiene respaldo técnico. Es un caso de riesgo alto por receptor sensible.
- **Texto (inicio):**

  > ANTECEDENTES
  > 
  > La Empresa solicitó la modificación del componente de ruido del plan de manejo de la Subestación S-88, ubicada en un municipio del departamento del Tolima, para incorporar un transformador adicional de 100 MVA. A ochenta metros del límite de la estación se encuentra una clínica de atención de baja complejidad, con área de hospitalización que funciona durante la noche.
  > 
  > El estudio de ruido presentado por la Empresa clasifica la zona como de uso mixto, pese a que el uso de la clínica corresponde a un receptor sensible que la normativa asimila a zona de tranquilidad para el horario nocturno.
  > 
  > CONSIDERACIONES TÉCNICAS
  > 
  > El modelo presentado estima un nivel de 52 dB(A) en la fachada de la clínica durante la noche, con la potencia del nuevo transformador incluida. El valor supera el límite nocturno para zona de tranquilidad, que es de 45 dB(A), aunque se encuentra dentro del límite de uso mixto.
  > 
  > La Empresa propone una barrera de tierra con vegetación de altura media. El modelo de la barrera no incluye la absorción de la vegetación en su fase de crecimiento y supone una eficacia de reducción que no está respaldada por ensayos. Además, el transformador nuevo tendría un componente tonal en 120 Hz que no fue incluido en el modelo.
  > 
  > CONSIDERACIONES JURÍDICAS
  > 
  > La Resolución 627 de 2006 distingue entre tipos de zona y exige que el receptor sensible se evalúe con el límite que le corresponde. La clasificación de uso mixto no es aplicable a una clínica con hospitalización nocturna. La modificación del plan de manejo solo puede aprobarse si la Empresa demuestra el cumplimiento en ese receptor.
  > 
  > RESUELVE
  > 
  > ARTÍCULO PRIMERO. Condicionar la aprobación de la modificación del plan de manejo a la presentación, en sesenta días, de una modelación con la clasificación de zona de tranquilidad para la fachada de la clínica.
  > 
  > ARTÍCULO SEGUNDO. Diseñar una barrera acústica con materiales certificados, cuya eficacia se demuestre con datos de ensayo, e incluir en el modelo el componente tonal de 120 Hz del nuevo transformador.
  > 
  > ARTÍCULO TERCERO. No energizar el nuevo transformador hasta que se verifique, mediante medición directa en la fachada de la clínica, el cumplimiento del límite nocturno aplicable.
  > 
  > ARTÍCULO CUARTO. Establecer un canal de comunicación con la administración de la clínica para coordinar las mediciones que se realicen en sus instalaciones.
  > 
  > ARTÍCULO QUINTO. Notificar a la administración de la clínica la fecha de las mediciones con antelación suficiente, […]

Candidatos a juzgar para QAMB-RUI-003: AMB-CAG-003, AMB-CAG-004, AMB-LIC-001, AMB-LIC-003, AMB-LIC-004, AMB-OCC-002, AMB-RUI-001, AMB-RUI-002, AMB-RUI-003, AMB-RUI-004, AMB-RUI-005, AMB-SAN-002, AMB-VER-004
