
  
  
  
  
      id integer NOT NULL,
      nombre character varying(100) NOT NULL,
      email character varying(100) NOT NULL,
      especialidad character varying(50),
      activo boolean DEFAULT true,
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      id integer NOT NULL,
      nombre character varying(100) NOT NULL,
      activo boolean DEFAULT true
  );
  
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      id integer NOT NULL,
      categoria character varying(100),
      titulo_referencia character varying(255),
      contenido_legal text NOT NULL,
      embedding public.vector(1536),
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      id integer NOT NULL,
      nombre character varying(100) NOT NULL,
      palabras_clave text[] NOT NULL,
      activo boolean DEFAULT true
  );
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      id integer NOT NULL,
      tiempo_ahorrado_minutos integer DEFAULT 100,
      costo_hora_juridico numeric(10,2) DEFAULT 50.00
  );
  
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      id integer NOT NULL,
      tutela_id uuid,
      accion text NOT NULL,
      area_involucrada character varying(100),
      responsable_nombre character varying(100),
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      id integer NOT NULL,
      usuario_id integer,
      accion text NOT NULL,
      entidad_afectada text,
      entidad_id text,
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      id integer NOT NULL,
      patron character varying(255) NOT NULL,
      descripcion character varying(255),
      activo boolean DEFAULT true
  );
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
      id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
      radicado character varying(50) NOT NULL,
      accionante character varying(255) NOT NULL,
      juzgado character varying(255),
      fecha_notificacion date,
  
  
  
  


