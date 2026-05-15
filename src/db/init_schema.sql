--
-- PostgreSQL database dump
--

-- Dumped from database version 15.4 (Debian 15.4-2.pgdg120+1)
-- Dumped by pg_dump version 15.4 (Debian 15.4-2.pgdg120+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: abogados; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.abogados (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    email character varying(100) NOT NULL,
    especialidad character varying(50),
    activo boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    password_hash character varying(255),
    is_admin boolean DEFAULT false,
    is_approved boolean DEFAULT false,
    rol character varying(20) DEFAULT 'juridico'::character varying
);


--
-- Name: COLUMN abogados.is_admin; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.abogados.is_admin IS 'Define si el abogado tiene privilegios de administrador para gestionar otros usuarios';


--
-- Name: COLUMN abogados.is_approved; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.abogados.is_approved IS 'Define si el abogado ha sido aprobado por un administrador para acceder al sistema';


--
-- Name: abogados_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.abogados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: abogados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.abogados_id_seq OWNED BY public.abogados.id;


--
-- Name: areas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.areas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    activo boolean DEFAULT true
);


--
-- Name: areas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.areas_id_seq OWNED BY public.areas.id;


--
-- Name: base_conocimiento_enel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.base_conocimiento_enel (
    id integer NOT NULL,
    categoria character varying(100),
    titulo_referencia character varying(255),
    contenido_legal text NOT NULL,
    embedding public.vector(1536),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    embedding_local public.vector(384),
    es_exitosa boolean DEFAULT true,
    documento_id uuid,
    is_active boolean DEFAULT true
);


--
-- Name: base_conocimiento_enel_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.base_conocimiento_enel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: base_conocimiento_enel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.base_conocimiento_enel_id_seq OWNED BY public.base_conocimiento_enel.id;


--
-- Name: categorias_juridicas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categorias_juridicas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    palabras_clave text[] NOT NULL,
    activo boolean DEFAULT true
);


--
-- Name: categorias_juridicas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categorias_juridicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categorias_juridicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categorias_juridicas_id_seq OWNED BY public.categorias_juridicas.id;


--
-- Name: configuracion_roi; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuracion_roi (
    id integer NOT NULL,
    tiempo_ahorrado_minutos integer DEFAULT 100,
    costo_hora_juridico numeric(10,2) DEFAULT 50.00
);


--
-- Name: configuracion_roi_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.configuracion_roi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: configuracion_roi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.configuracion_roi_id_seq OWNED BY public.configuracion_roi.id;


--
-- Name: historial_acciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.historial_acciones (
    id integer NOT NULL,
    tutela_id uuid,
    accion text NOT NULL,
    area_involucrada character varying(100),
    responsable_nombre character varying(100),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_seguimiento date
);


--
-- Name: COLUMN historial_acciones.fecha_seguimiento; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.historial_acciones.fecha_seguimiento IS 'Fecha en la que el sistema debe alertar sobre esta gesti├│n espec├¡fica';


--
-- Name: historial_acciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.historial_acciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: historial_acciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.historial_acciones_id_seq OWNED BY public.historial_acciones.id;


--
-- Name: logs_sistema; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.logs_sistema (
    id integer NOT NULL,
    usuario_id integer,
    accion text NOT NULL,
    entidad_afectada text,
    entidad_id text,
    ip_origen character varying(45),
    detalles jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: logs_sistema_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.logs_sistema_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: logs_sistema_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.logs_sistema_id_seq OWNED BY public.logs_sistema.id;


--
-- Name: noise_patterns; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.noise_patterns (
    id integer NOT NULL,
    patron character varying(255) NOT NULL,
    descripcion character varying(255),
    activo boolean DEFAULT true
);


--
-- Name: noise_patterns_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.noise_patterns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: noise_patterns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.noise_patterns_id_seq OWNED BY public.noise_patterns.id;


--
-- Name: tutelas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutelas (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    radicado character varying(50) NOT NULL,
    accionante character varying(255) NOT NULL,
    juzgado character varying(255),
    fecha_notificacion date,
    fecha_vencimiento date,
    estado character varying(20) DEFAULT 'Pendiente'::character varying,
    contenido_original text,
    contestacion_generada text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    responsable_id integer,
    fecha_recepcion date DEFAULT CURRENT_DATE,
    prioridad character varying(20) DEFAULT 'Media'::character varying,
    area_responsable character varying(50),
    observaciones text,
    dias_termino integer DEFAULT 2,
    resultado_fallo character varying(50),
    derecho_vulnerado character varying(100),
    is_active boolean DEFAULT true,
    area_id integer,
    CONSTRAINT tutelas_estado_check CHECK (((estado)::text = ANY (ARRAY[('Pendiente'::character varying)::text, ('En Proceso'::character varying)::text, ('Contestada'::character varying)::text, ('Vencida'::character varying)::text, ('Respondida'::character varying)::text, ('Aprobada'::character varying)::text, ('Aprendida'::character varying)::text])))
);


--
-- Name: COLUMN tutelas.dias_termino; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tutelas.dias_termino IS 'D├¡as h├íbiles para dar respuesta a la tutela';


--
-- Name: COLUMN tutelas.derecho_vulnerado; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.tutelas.derecho_vulnerado IS 'El derecho fundamental que se alega vulnerado (Salud, Petici├│n, etc.)';


--
-- Name: abogados id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abogados ALTER COLUMN id SET DEFAULT nextval('public.abogados_id_seq'::regclass);


--
-- Name: areas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas ALTER COLUMN id SET DEFAULT nextval('public.areas_id_seq'::regclass);


--
-- Name: base_conocimiento_enel id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.base_conocimiento_enel ALTER COLUMN id SET DEFAULT nextval('public.base_conocimiento_enel_id_seq'::regclass);


--
-- Name: categorias_juridicas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_juridicas ALTER COLUMN id SET DEFAULT nextval('public.categorias_juridicas_id_seq'::regclass);


--
-- Name: configuracion_roi id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_roi ALTER COLUMN id SET DEFAULT nextval('public.configuracion_roi_id_seq'::regclass);


--
-- Name: historial_acciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_acciones ALTER COLUMN id SET DEFAULT nextval('public.historial_acciones_id_seq'::regclass);


--
-- Name: logs_sistema id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_sistema ALTER COLUMN id SET DEFAULT nextval('public.logs_sistema_id_seq'::regclass);


--
-- Name: noise_patterns id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noise_patterns ALTER COLUMN id SET DEFAULT nextval('public.noise_patterns_id_seq'::regclass);


--
-- Name: abogados abogados_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abogados
    ADD CONSTRAINT abogados_email_key UNIQUE (email);


--
-- Name: abogados abogados_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.abogados
    ADD CONSTRAINT abogados_pkey PRIMARY KEY (id);


--
-- Name: areas areas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_nombre_key UNIQUE (nombre);


--
-- Name: areas areas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);


--
-- Name: base_conocimiento_enel base_conocimiento_enel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.base_conocimiento_enel
    ADD CONSTRAINT base_conocimiento_enel_pkey PRIMARY KEY (id);


--
-- Name: categorias_juridicas categorias_juridicas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_juridicas
    ADD CONSTRAINT categorias_juridicas_nombre_key UNIQUE (nombre);


--
-- Name: categorias_juridicas categorias_juridicas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categorias_juridicas
    ADD CONSTRAINT categorias_juridicas_pkey PRIMARY KEY (id);


--
-- Name: configuracion_roi configuracion_roi_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuracion_roi
    ADD CONSTRAINT configuracion_roi_pkey PRIMARY KEY (id);


--
-- Name: historial_acciones historial_acciones_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_acciones
    ADD CONSTRAINT historial_acciones_pkey PRIMARY KEY (id);


--
-- Name: logs_sistema logs_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_sistema
    ADD CONSTRAINT logs_sistema_pkey PRIMARY KEY (id);


--
-- Name: noise_patterns noise_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.noise_patterns
    ADD CONSTRAINT noise_patterns_pkey PRIMARY KEY (id);


--
-- Name: tutelas tutelas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutelas
    ADD CONSTRAINT tutelas_pkey PRIMARY KEY (id);


--
-- Name: tutelas tutelas_radicado_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutelas
    ADD CONSTRAINT tutelas_radicado_key UNIQUE (radicado);


--
-- Name: base_conocimiento_enel_embedding_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX base_conocimiento_enel_embedding_idx ON public.base_conocimiento_enel USING hnsw (embedding public.vector_cosine_ops);


--
-- Name: idx_base_conocimiento_documento; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_base_conocimiento_documento ON public.base_conocimiento_enel USING btree (documento_id);


--
-- Name: historial_acciones historial_acciones_tutela_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.historial_acciones
    ADD CONSTRAINT historial_acciones_tutela_id_fkey FOREIGN KEY (tutela_id) REFERENCES public.tutelas(id) ON DELETE CASCADE;


--
-- Name: logs_sistema logs_sistema_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_sistema
    ADD CONSTRAINT logs_sistema_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.abogados(id);


--
-- Name: tutelas tutelas_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutelas
    ADD CONSTRAINT tutelas_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- Name: tutelas tutelas_responsable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutelas
    ADD CONSTRAINT tutelas_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES public.abogados(id);


--
-- PostgreSQL database dump complete
--

 INSERT INTO public.abogados (nombre, email, password_hash,
     is_admin, is_approved,rol)
    VALUES ('Alejandro', 'alejandro.marin@enel.com',
     '$2b$10$vJSdic5KyHS3l0zDeTptK.v.EmFgq3zflOvozOID/LMQswc2KlpMO'
     , true, true, 'super_admin')
    ON CONFLICT (email) DO NOTHING;