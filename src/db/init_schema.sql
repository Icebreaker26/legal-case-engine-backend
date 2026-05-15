
> CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
  
  
  --
  -- TOC entry 3552 (class 0 OID 0)
  -- Dependencies: 3
> CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;
  
  
  --
  -- TOC entry 3553 (class 0 OID 0)
  -- Dependencies: 2
> CREATE TABLE public.abogados (
      id integer NOT NULL,
      nombre character varying(100) NOT NULL,
      email character varying(100) NOT NULL,
      especialidad character varying(50),
      activo boolean DEFAULT true,
> CREATE SEQUENCE public.abogados_id_seq
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
> CREATE TABLE public.areas (
      id integer NOT NULL,
      nombre character varying(100) NOT NULL,
      activo boolean DEFAULT true
  );
  
> CREATE SEQUENCE public.areas_id_seq
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
> CREATE TABLE public.base_conocimiento_enel (
      id integer NOT NULL,
      categoria character varying(100),
      titulo_referencia character varying(255),
      contenido_legal text NOT NULL,
      embedding public.vector(1536),
> CREATE SEQUENCE public.base_conocimiento_enel_id_seq
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
> CREATE TABLE public.categorias_juridicas (
      id integer NOT NULL,
      nombre character varying(100) NOT NULL,
      palabras_clave text[] NOT NULL,
      activo boolean DEFAULT true
  );
> CREATE SEQUENCE public.categorias_juridicas_id_seq
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
> CREATE TABLE public.configuracion_roi (
      id integer NOT NULL,
      tiempo_ahorrado_minutos integer DEFAULT 100,
      costo_hora_juridico numeric(10,2) DEFAULT 50.00
  );
  
> CREATE SEQUENCE public.configuracion_roi_id_seq
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
> CREATE TABLE public.historial_acciones (
      id integer NOT NULL,
      tutela_id uuid,
      accion text NOT NULL,
      area_involucrada character varying(100),
      responsable_nombre character varying(100),
> CREATE SEQUENCE public.historial_acciones_id_seq
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
> CREATE TABLE public.logs_sistema (
      id integer NOT NULL,
      usuario_id integer,
      accion text NOT NULL,
      entidad_afectada text,
      entidad_id text,
> CREATE SEQUENCE public.logs_sistema_id_seq
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
> CREATE TABLE public.noise_patterns (
      id integer NOT NULL,
      patron character varying(255) NOT NULL,
      descripcion character varying(255),
      activo boolean DEFAULT true
  );
> CREATE SEQUENCE public.noise_patterns_id_seq
      AS integer
      START WITH 1
      INCREMENT BY 1
      NO MINVALUE
      NO MAXVALUE
> CREATE TABLE public.tutelas (
      id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
      radicado character varying(50) NOT NULL,
      accionante character varying(255) NOT NULL,
      juzgado character varying(255),
      fecha_notificacion date,
> CREATE INDEX base_conocimiento_enel_embedding_idx ON public.base_conocimiento_enel USING hnsw (embedding public.vector_cosine_ops);
  
  
  --
  -- TOC entry 3363 (class 1259 OID 40973)
  -- Name: idx_base_conocimiento_documento; Type: INDEX; Schema: public; Owner: icebreaker
> CREATE INDEX idx_base_conocimiento_documento ON public.base_conocimiento_enel USING btree (documento_id);
  
  
  --
  -- TOC entry 3386 (class 2606 OID 32801)
  -- Name: historial_acciones historial_acciones_tutela_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: icebreaker


