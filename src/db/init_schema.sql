--
-- PostgreSQL database dump
--


-- Dumped from database version 15.4 (Debian 15.4-2.pgdg120+1)
-- Dumped by pg_dump version 18.3

-- Started on 2026-05-25 13:36:33

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 16385)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 3566 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- TOC entry 3 (class 3079 OID 16396)
-- Name: vector; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;


--
-- TOC entry 3567 (class 0 OID 0)
-- Dependencies: 3
-- Name: EXTENSION vector; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION vector IS 'vector data type and ivfflat and hnsw access methods';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 216 (class 1259 OID 16495)
-- Name: abogados; Type: TABLE; Schema: public; Owner: icebreaker
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


ALTER TABLE public.abogados OWNER TO icebreaker;

--
-- TOC entry 3568 (class 0 OID 0)
-- Dependencies: 216
-- Name: COLUMN abogados.is_admin; Type: COMMENT; Schema: public; Owner: icebreaker
--

COMMENT ON COLUMN public.abogados.is_admin IS 'Define si el abogado tiene privilegios de administrador para gestionar otros usuarios';


--
-- TOC entry 3569 (class 0 OID 0)
-- Dependencies: 216
-- Name: COLUMN abogados.is_approved; Type: COMMENT; Schema: public; Owner: icebreaker
--

COMMENT ON COLUMN public.abogados.is_approved IS 'Define si el abogado ha sido aprobado por un administrador para acceder al sistema';


--
-- TOC entry 217 (class 1259 OID 16505)
-- Name: abogados_id_seq; Type: SEQUENCE; Schema: public; Owner: icebreaker
--

CREATE SEQUENCE public.abogados_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.abogados_id_seq OWNER TO icebreaker;

--
-- TOC entry 3570 (class 0 OID 0)
-- Dependencies: 217
-- Name: abogados_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: icebreaker
--

ALTER SEQUENCE public.abogados_id_seq OWNED BY public.abogados.id;


--
-- TOC entry 218 (class 1259 OID 16506)
-- Name: areas; Type: TABLE; Schema: public; Owner: icebreaker
--

CREATE TABLE public.areas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    activo boolean DEFAULT true
);


ALTER TABLE public.areas OWNER TO icebreaker;

--
-- TOC entry 219 (class 1259 OID 16510)
-- Name: areas_id_seq; Type: SEQUENCE; Schema: public; Owner: icebreaker
--

CREATE SEQUENCE public.areas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.areas_id_seq OWNER TO icebreaker;

--
-- TOC entry 3571 (class 0 OID 0)
-- Dependencies: 219
-- Name: areas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: icebreaker
--

ALTER SEQUENCE public.areas_id_seq OWNED BY public.areas.id;


--
-- TOC entry 220 (class 1259 OID 16511)
-- Name: base_conocimiento_enel; Type: TABLE; Schema: public; Owner: icebreaker
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


ALTER TABLE public.base_conocimiento_enel OWNER TO icebreaker;

--
-- TOC entry 221 (class 1259 OID 16519)
-- Name: base_conocimiento_enel_id_seq; Type: SEQUENCE; Schema: public; Owner: icebreaker
--

CREATE SEQUENCE public.base_conocimiento_enel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.base_conocimiento_enel_id_seq OWNER TO icebreaker;

--
-- TOC entry 3572 (class 0 OID 0)
-- Dependencies: 221
-- Name: base_conocimiento_enel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: icebreaker
--

ALTER SEQUENCE public.base_conocimiento_enel_id_seq OWNED BY public.base_conocimiento_enel.id;


--
-- TOC entry 222 (class 1259 OID 16520)
-- Name: categorias_juridicas; Type: TABLE; Schema: public; Owner: icebreaker
--

CREATE TABLE public.categorias_juridicas (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    palabras_clave text[] NOT NULL,
    activo boolean DEFAULT true
);


ALTER TABLE public.categorias_juridicas OWNER TO icebreaker;

--
-- TOC entry 223 (class 1259 OID 16526)
-- Name: categorias_juridicas_id_seq; Type: SEQUENCE; Schema: public; Owner: icebreaker
--

CREATE SEQUENCE public.categorias_juridicas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categorias_juridicas_id_seq OWNER TO icebreaker;

--
-- TOC entry 3573 (class 0 OID 0)
-- Dependencies: 223
-- Name: categorias_juridicas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: icebreaker
--

ALTER SEQUENCE public.categorias_juridicas_id_seq OWNED BY public.categorias_juridicas.id;


--
-- TOC entry 224 (class 1259 OID 16527)
-- Name: configuracion_roi; Type: TABLE; Schema: public; Owner: icebreaker
--

CREATE TABLE public.configuracion_roi (
    id integer NOT NULL,
    tiempo_ahorrado_minutos integer DEFAULT 100,
    costo_hora_juridico numeric(10,2) DEFAULT 50.00
);


ALTER TABLE public.configuracion_roi OWNER TO icebreaker;

--
-- TOC entry 225 (class 1259 OID 16532)
-- Name: configuracion_roi_id_seq; Type: SEQUENCE; Schema: public; Owner: icebreaker
--

CREATE SEQUENCE public.configuracion_roi_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.configuracion_roi_id_seq OWNER TO icebreaker;

--
-- TOC entry 3574 (class 0 OID 0)
-- Dependencies: 225
-- Name: configuracion_roi_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: icebreaker
--

ALTER SEQUENCE public.configuracion_roi_id_seq OWNED BY public.configuracion_roi.id;


--
-- TOC entry 226 (class 1259 OID 16533)
-- Name: historial_acciones; Type: TABLE; Schema: public; Owner: icebreaker
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


ALTER TABLE public.historial_acciones OWNER TO icebreaker;

--
-- TOC entry 3575 (class 0 OID 0)
-- Dependencies: 226
-- Name: COLUMN historial_acciones.fecha_seguimiento; Type: COMMENT; Schema: public; Owner: icebreaker
--

COMMENT ON COLUMN public.historial_acciones.fecha_seguimiento IS 'Fecha en la que el sistema debe alertar sobre esta gestión específica';


--
-- TOC entry 227 (class 1259 OID 16539)
-- Name: historial_acciones_id_seq; Type: SEQUENCE; Schema: public; Owner: icebreaker
--

CREATE SEQUENCE public.historial_acciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.historial_acciones_id_seq OWNER TO icebreaker;

--
-- TOC entry 3576 (class 0 OID 0)
-- Dependencies: 227
-- Name: historial_acciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: icebreaker
--

ALTER SEQUENCE public.historial_acciones_id_seq OWNED BY public.historial_acciones.id;


--
-- TOC entry 228 (class 1259 OID 16540)
-- Name: logs_sistema; Type: TABLE; Schema: public; Owner: icebreaker
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


ALTER TABLE public.logs_sistema OWNER TO icebreaker;

--
-- TOC entry 229 (class 1259 OID 16546)
-- Name: logs_sistema_id_seq; Type: SEQUENCE; Schema: public; Owner: icebreaker
--

CREATE SEQUENCE public.logs_sistema_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.logs_sistema_id_seq OWNER TO icebreaker;

--
-- TOC entry 3577 (class 0 OID 0)
-- Dependencies: 229
-- Name: logs_sistema_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: icebreaker
--

ALTER SEQUENCE public.logs_sistema_id_seq OWNED BY public.logs_sistema.id;


--
-- TOC entry 230 (class 1259 OID 16547)
-- Name: noise_patterns; Type: TABLE; Schema: public; Owner: icebreaker
--

CREATE TABLE public.noise_patterns (
    id integer NOT NULL,
    patron character varying(255) NOT NULL,
    descripcion character varying(255),
    activo boolean DEFAULT true
);


ALTER TABLE public.noise_patterns OWNER TO icebreaker;

--
-- TOC entry 231 (class 1259 OID 16553)
-- Name: noise_patterns_id_seq; Type: SEQUENCE; Schema: public; Owner: icebreaker
--

CREATE SEQUENCE public.noise_patterns_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.noise_patterns_id_seq OWNER TO icebreaker;

--
-- TOC entry 3578 (class 0 OID 0)
-- Dependencies: 231
-- Name: noise_patterns_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: icebreaker
--

ALTER SEQUENCE public.noise_patterns_id_seq OWNED BY public.noise_patterns.id;


--
-- TOC entry 236 (class 1259 OID 33027)
-- Name: requerimientos_internos; Type: TABLE; Schema: public; Owner: icebreaker
--

CREATE TABLE public.requerimientos_internos (
    id integer NOT NULL,
    tutela_id uuid,
    area_destino character varying(100) NOT NULL,
    descripcion text NOT NULL,
    estado character varying(20) DEFAULT 'Pendiente'::character varying,
    fecha_solicitud timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    fecha_respuesta timestamp with time zone,
    oficio_generado text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    respuesta_texto text
);


ALTER TABLE public.requerimientos_internos OWNER TO icebreaker;

--
-- TOC entry 235 (class 1259 OID 33026)
-- Name: requerimientos_internos_id_seq; Type: SEQUENCE; Schema: public; Owner: icebreaker
--

CREATE SEQUENCE public.requerimientos_internos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.requerimientos_internos_id_seq OWNER TO icebreaker;

--
-- TOC entry 3579 (class 0 OID 0)
-- Dependencies: 235
-- Name: requerimientos_internos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: icebreaker
--

ALTER SEQUENCE public.requerimientos_internos_id_seq OWNED BY public.requerimientos_internos.id;


--
-- TOC entry 234 (class 1259 OID 33009)
-- Name: system_config; Type: TABLE; Schema: public; Owner: icebreaker
--

CREATE TABLE public.system_config (
    id integer NOT NULL,
    key character varying(100) NOT NULL,
    value jsonb NOT NULL,
    description text,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.system_config OWNER TO icebreaker;

--
-- TOC entry 233 (class 1259 OID 33008)
-- Name: system_config_id_seq; Type: SEQUENCE; Schema: public; Owner: icebreaker
--

CREATE SEQUENCE public.system_config_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.system_config_id_seq OWNER TO icebreaker;

--
-- TOC entry 3580 (class 0 OID 0)
-- Dependencies: 233
-- Name: system_config_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: icebreaker
--

ALTER SEQUENCE public.system_config_id_seq OWNED BY public.system_config.id;


--
-- TOC entry 237 (class 1259 OID 33043)
-- Name: tutela_responsables; Type: TABLE; Schema: public; Owner: icebreaker
--

CREATE TABLE public.tutela_responsables (
    tutela_id uuid NOT NULL,
    abogado_id integer NOT NULL
);


ALTER TABLE public.tutela_responsables OWNER TO icebreaker;

--
-- TOC entry 232 (class 1259 OID 16554)
-- Name: tutelas; Type: TABLE; Schema: public; Owner: icebreaker
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
    sharepoint_link text,
    CONSTRAINT tutelas_estado_check CHECK (((estado)::text = ANY (ARRAY[('Pendiente'::character varying)::text, ('En Proceso'::character varying)::text, ('Contestada'::character varying)::text, ('Vencida'::character varying)::text, ('Respondida'::character varying)::text, ('Aprobada'::character varying)::text, ('Aprendida'::character varying)::text])))
);


ALTER TABLE public.tutelas OWNER TO icebreaker;

--
-- TOC entry 3581 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN tutelas.dias_termino; Type: COMMENT; Schema: public; Owner: icebreaker
--

COMMENT ON COLUMN public.tutelas.dias_termino IS 'Días hábiles para dar respuesta a la tutela';


--
-- TOC entry 3582 (class 0 OID 0)
-- Dependencies: 232
-- Name: COLUMN tutelas.derecho_vulnerado; Type: COMMENT; Schema: public; Owner: icebreaker
--

COMMENT ON COLUMN public.tutelas.derecho_vulnerado IS 'El derecho fundamental que se alega vulnerado (Salud, Petición, etc.)';


--
-- TOC entry 3338 (class 2604 OID 24816)
-- Name: abogados id; Type: DEFAULT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.abogados ALTER COLUMN id SET DEFAULT nextval('public.abogados_id_seq'::regclass);


--
-- TOC entry 3344 (class 2604 OID 24817)
-- Name: areas id; Type: DEFAULT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.areas ALTER COLUMN id SET DEFAULT nextval('public.areas_id_seq'::regclass);


--
-- TOC entry 3346 (class 2604 OID 24818)
-- Name: base_conocimiento_enel id; Type: DEFAULT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.base_conocimiento_enel ALTER COLUMN id SET DEFAULT nextval('public.base_conocimiento_enel_id_seq'::regclass);


--
-- TOC entry 3350 (class 2604 OID 24819)
-- Name: categorias_juridicas id; Type: DEFAULT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.categorias_juridicas ALTER COLUMN id SET DEFAULT nextval('public.categorias_juridicas_id_seq'::regclass);


--
-- TOC entry 3352 (class 2604 OID 24820)
-- Name: configuracion_roi id; Type: DEFAULT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.configuracion_roi ALTER COLUMN id SET DEFAULT nextval('public.configuracion_roi_id_seq'::regclass);


--
-- TOC entry 3355 (class 2604 OID 24821)
-- Name: historial_acciones id; Type: DEFAULT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.historial_acciones ALTER COLUMN id SET DEFAULT nextval('public.historial_acciones_id_seq'::regclass);


--
-- TOC entry 3357 (class 2604 OID 24822)
-- Name: logs_sistema id; Type: DEFAULT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.logs_sistema ALTER COLUMN id SET DEFAULT nextval('public.logs_sistema_id_seq'::regclass);


--
-- TOC entry 3359 (class 2604 OID 24823)
-- Name: noise_patterns id; Type: DEFAULT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.noise_patterns ALTER COLUMN id SET DEFAULT nextval('public.noise_patterns_id_seq'::regclass);


--
-- TOC entry 3371 (class 2604 OID 33030)
-- Name: requerimientos_internos id; Type: DEFAULT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.requerimientos_internos ALTER COLUMN id SET DEFAULT nextval('public.requerimientos_internos_id_seq'::regclass);


--
-- TOC entry 3369 (class 2604 OID 33012)
-- Name: system_config id; Type: DEFAULT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.system_config ALTER COLUMN id SET DEFAULT nextval('public.system_config_id_seq'::regclass);


--
-- TOC entry 3377 (class 2606 OID 16577)
-- Name: abogados abogados_email_key; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.abogados
    ADD CONSTRAINT abogados_email_key UNIQUE (email);


--
-- TOC entry 3379 (class 2606 OID 16579)
-- Name: abogados abogados_pkey; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.abogados
    ADD CONSTRAINT abogados_pkey PRIMARY KEY (id);


--
-- TOC entry 3381 (class 2606 OID 16581)
-- Name: areas areas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_nombre_key UNIQUE (nombre);


--
-- TOC entry 3383 (class 2606 OID 16583)
-- Name: areas areas_pkey; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.areas
    ADD CONSTRAINT areas_pkey PRIMARY KEY (id);


--
-- TOC entry 3386 (class 2606 OID 16585)
-- Name: base_conocimiento_enel base_conocimiento_enel_pkey; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.base_conocimiento_enel
    ADD CONSTRAINT base_conocimiento_enel_pkey PRIMARY KEY (id);


--
-- TOC entry 3389 (class 2606 OID 16587)
-- Name: categorias_juridicas categorias_juridicas_nombre_key; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.categorias_juridicas
    ADD CONSTRAINT categorias_juridicas_nombre_key UNIQUE (nombre);


--
-- TOC entry 3391 (class 2606 OID 16589)
-- Name: categorias_juridicas categorias_juridicas_pkey; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.categorias_juridicas
    ADD CONSTRAINT categorias_juridicas_pkey PRIMARY KEY (id);


--
-- TOC entry 3393 (class 2606 OID 16591)
-- Name: configuracion_roi configuracion_roi_pkey; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.configuracion_roi
    ADD CONSTRAINT configuracion_roi_pkey PRIMARY KEY (id);


--
-- TOC entry 3395 (class 2606 OID 16593)
-- Name: historial_acciones historial_acciones_pkey; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.historial_acciones
    ADD CONSTRAINT historial_acciones_pkey PRIMARY KEY (id);


--
-- TOC entry 3397 (class 2606 OID 16595)
-- Name: logs_sistema logs_sistema_pkey; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.logs_sistema
    ADD CONSTRAINT logs_sistema_pkey PRIMARY KEY (id);


--
-- TOC entry 3399 (class 2606 OID 16597)
-- Name: noise_patterns noise_patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.noise_patterns
    ADD CONSTRAINT noise_patterns_pkey PRIMARY KEY (id);


--
-- TOC entry 3409 (class 2606 OID 33037)
-- Name: requerimientos_internos requerimientos_internos_pkey; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.requerimientos_internos
    ADD CONSTRAINT requerimientos_internos_pkey PRIMARY KEY (id);


--
-- TOC entry 3405 (class 2606 OID 33019)
-- Name: system_config system_config_key_key; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_key_key UNIQUE (key);


--
-- TOC entry 3407 (class 2606 OID 33017)
-- Name: system_config system_config_pkey; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.system_config
    ADD CONSTRAINT system_config_pkey PRIMARY KEY (id);


--
-- TOC entry 3411 (class 2606 OID 33047)
-- Name: tutela_responsables tutela_responsables_pkey; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.tutela_responsables
    ADD CONSTRAINT tutela_responsables_pkey PRIMARY KEY (tutela_id, abogado_id);


--
-- TOC entry 3401 (class 2606 OID 16599)
-- Name: tutelas tutelas_pkey; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.tutelas
    ADD CONSTRAINT tutelas_pkey PRIMARY KEY (id);


--
-- TOC entry 3403 (class 2606 OID 16601)
-- Name: tutelas tutelas_radicado_key; Type: CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.tutelas
    ADD CONSTRAINT tutelas_radicado_key UNIQUE (radicado);


--
-- TOC entry 3384 (class 1259 OID 16602)
-- Name: base_conocimiento_enel_embedding_idx; Type: INDEX; Schema: public; Owner: icebreaker
--

CREATE INDEX base_conocimiento_enel_embedding_idx ON public.base_conocimiento_enel USING hnsw (embedding public.vector_cosine_ops);


--
-- TOC entry 3387 (class 1259 OID 16603)
-- Name: idx_base_conocimiento_documento; Type: INDEX; Schema: public; Owner: icebreaker
--

CREATE INDEX idx_base_conocimiento_documento ON public.base_conocimiento_enel USING btree (documento_id);


--
-- TOC entry 3412 (class 2606 OID 16604)
-- Name: historial_acciones historial_acciones_tutela_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.historial_acciones
    ADD CONSTRAINT historial_acciones_tutela_id_fkey FOREIGN KEY (tutela_id) REFERENCES public.tutelas(id) ON DELETE CASCADE;


--
-- TOC entry 3413 (class 2606 OID 16609)
-- Name: logs_sistema logs_sistema_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.logs_sistema
    ADD CONSTRAINT logs_sistema_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.abogados(id);


--
-- TOC entry 3416 (class 2606 OID 33038)
-- Name: requerimientos_internos requerimientos_internos_tutela_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.requerimientos_internos
    ADD CONSTRAINT requerimientos_internos_tutela_id_fkey FOREIGN KEY (tutela_id) REFERENCES public.tutelas(id) ON DELETE CASCADE;


--
-- TOC entry 3417 (class 2606 OID 33053)
-- Name: tutela_responsables tutela_responsables_abogado_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.tutela_responsables
    ADD CONSTRAINT tutela_responsables_abogado_id_fkey FOREIGN KEY (abogado_id) REFERENCES public.abogados(id) ON DELETE CASCADE;


--
-- TOC entry 3418 (class 2606 OID 33048)
-- Name: tutela_responsables tutela_responsables_tutela_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.tutela_responsables
    ADD CONSTRAINT tutela_responsables_tutela_id_fkey FOREIGN KEY (tutela_id) REFERENCES public.tutelas(id) ON DELETE CASCADE;


--
-- TOC entry 3414 (class 2606 OID 16614)
-- Name: tutelas tutelas_area_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.tutelas
    ADD CONSTRAINT tutelas_area_id_fkey FOREIGN KEY (area_id) REFERENCES public.areas(id);


--
-- TOC entry 3415 (class 2606 OID 16619)
-- Name: tutelas tutelas_responsable_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: icebreaker
--

ALTER TABLE ONLY public.tutelas
    ADD CONSTRAINT tutelas_responsable_id_fkey FOREIGN KEY (responsable_id) REFERENCES public.abogados(id);


-- Completed on 2026-05-25 13:36:33

--
-- PostgreSQL database dump complete
--


 INSERT INTO public.abogados (nombre, email, password_hash,
     is_admin, is_approved,rol)
    VALUES ('Alejandro', 'alejandro.marin@enel.com',
     '$2b$10$vJSdic5KyHS3l0zDeTptK.v.EmFgq3zflOvozOID/LMQswc2KlpMO'
     , true, true, 'super_admin')
    ON CONFLICT (email) DO NOTHING;



