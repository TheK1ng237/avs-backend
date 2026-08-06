--
-- PostgreSQL database dump
--

\restrict MG8qIssTHCaiZ5RbFK6jMvcWEOgCiOKYhpyHOyjV3FsO0n8bg032OSyVih9TaQS

-- Dumped from database version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.13 (Ubuntu 16.13-0ubuntu0.24.04.1)

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: ActivityAction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ActivityAction" AS ENUM (
    'CREATED',
    'UPDATED',
    'PUBLISHED',
    'COMMENTED',
    'REVIEWED',
    'DOWNLOADED',
    'FAVORITED'
);


ALTER TYPE public."ActivityAction" OWNER TO postgres;

--
-- Name: ArtisanSpecialty; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ArtisanSpecialty" AS ENUM (
    'KENTE',
    'BOGOLAN',
    'ADINKRA',
    'NDEBELE',
    'KUBA',
    'NDOP',
    'WAX'
);


ALTER TYPE public."ArtisanSpecialty" OWNER TO postgres;

--
-- Name: CommentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CommentType" AS ENUM (
    'PATTERN',
    'ARTISAN'
);


ALTER TYPE public."CommentType" OWNER TO postgres;

--
-- Name: PatternType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PatternType" AS ENUM (
    'KENTE',
    'BOGOLAN',
    'ADINKRA',
    'NDEBELE',
    'KUBA',
    'NDOP',
    'WAX',
    'BERBER'
);


ALTER TYPE public."PatternType" OWNER TO postgres;

--
-- Name: Role; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Role" AS ENUM (
    'VIEWER',
    'CONTRIBUTOR',
    'CURATOR',
    'ADMIN'
);


ALTER TYPE public."Role" OWNER TO postgres;

--
-- Name: Status; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Status" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'REVIEW',
    'REJECTED'
);


ALTER TYPE public."Status" OWNER TO postgres;

--
-- Name: TemplateCategory; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TemplateCategory" AS ENUM (
    'HERO',
    'GALLERY',
    'CARD',
    'FORM',
    'NAVIGATION',
    'FOOTER',
    'LAYOUT'
);


ALTER TYPE public."TemplateCategory" OWNER TO postgres;

--
-- Name: TemplateComplexity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TemplateComplexity" AS ENUM (
    'SIMPLE',
    'INTERMEDIATE',
    'ADVANCED'
);


ALTER TYPE public."TemplateComplexity" OWNER TO postgres;

--
-- Name: TemplateFramework; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TemplateFramework" AS ENUM (
    'REACT',
    'NEXT_JS',
    'VUE',
    'SVELTE',
    'ANGULAR'
);


ALTER TYPE public."TemplateFramework" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id text NOT NULL,
    "userId" text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    access_token text,
    refresh_token text,
    expires_at integer
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.activities (
    id text NOT NULL,
    "userId" text NOT NULL,
    action public."ActivityAction" NOT NULL,
    "targetId" text NOT NULL,
    "targetType" text NOT NULL,
    metadata jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.activities OWNER TO postgres;

--
-- Name: artisan_quotes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.artisan_quotes (
    id text NOT NULL,
    text text NOT NULL,
    author text NOT NULL,
    role text NOT NULL,
    country text NOT NULL,
    "patternId" text NOT NULL
);


ALTER TABLE public.artisan_quotes OWNER TO postgres;

--
-- Name: artisans; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.artisans (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    craft text NOT NULL,
    origin text NOT NULL,
    country text NOT NULL,
    bio text NOT NULL,
    specialties public."ArtisanSpecialty"[],
    "patternCount" integer DEFAULT 0 NOT NULL,
    rating double precision DEFAULT 0 NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.artisans OWNER TO postgres;

--
-- Name: color_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.color_tokens (
    id text NOT NULL,
    name text NOT NULL,
    hex text NOT NULL,
    meaning text NOT NULL,
    origin text NOT NULL,
    css text NOT NULL,
    "paletteId" text NOT NULL
);


ALTER TABLE public.color_tokens OWNER TO postgres;

--
-- Name: comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.comments (
    id text NOT NULL,
    content text NOT NULL,
    rating double precision,
    type public."CommentType" NOT NULL,
    "patternId" text,
    "artisanId" text,
    "userId" text NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.comments OWNER TO postgres;

--
-- Name: origins; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.origins (
    id text NOT NULL,
    people text NOT NULL,
    region text NOT NULL,
    country text NOT NULL,
    flag text NOT NULL,
    coords double precision[],
    "patternId" text NOT NULL
);


ALTER TABLE public.origins OWNER TO postgres;

--
-- Name: palettes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.palettes (
    id text NOT NULL,
    name text NOT NULL,
    origin text NOT NULL,
    description text NOT NULL,
    "patternCSS" text,
    "isPublished" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.palettes OWNER TO postgres;

--
-- Name: pattern_colors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pattern_colors (
    id text NOT NULL,
    hex text NOT NULL,
    name text NOT NULL,
    meaning text NOT NULL,
    "patternId" text NOT NULL
);


ALTER TABLE public.pattern_colors OWNER TO postgres;

--
-- Name: patterns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.patterns (
    id text NOT NULL,
    slug text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    ceremonial text NOT NULL,
    "cssClass" text NOT NULL,
    downloads integer DEFAULT 0 NOT NULL,
    era text,
    history text NOT NULL,
    license text,
    "nameLocal" text NOT NULL,
    sources text[],
    summary text NOT NULL,
    symbolism text NOT NULL,
    technique text NOT NULL,
    type public."PatternType" NOT NULL,
    views integer DEFAULT 0 NOT NULL,
    "imgUrl" text NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    name text NOT NULL,
    status public."Status" DEFAULT 'DRAFT'::public."Status" NOT NULL,
    "createdById" text DEFAULT 'yannick'::text NOT NULL
);


ALTER TABLE public.patterns OWNER TO postgres;

--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: symbols; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.symbols (
    id text NOT NULL,
    name text NOT NULL,
    "nameFr" text NOT NULL,
    "cssPreview" text NOT NULL,
    "imageUrl" text NOT NULL,
    meaning text NOT NULL,
    usage text NOT NULL,
    sacred boolean DEFAULT false NOT NULL,
    "patternId" text NOT NULL
);


ALTER TABLE public.symbols OWNER TO postgres;

--
-- Name: templates; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.templates (
    id text NOT NULL,
    name text NOT NULL,
    category public."TemplateCategory" NOT NULL,
    framework public."TemplateFramework" NOT NULL,
    complexity public."TemplateComplexity" NOT NULL,
    description text NOT NULL,
    code text NOT NULL,
    "isPublished" boolean DEFAULT false NOT NULL,
    "isFeatured" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.templates OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    name text,
    "passwordHash" text,
    role public."Role" DEFAULT 'VIEWER'::public."Role" NOT NULL,
    "emailVerified" timestamp(3) without time zone,
    bio text,
    location text,
    website text,
    github text,
    twitter text,
    specialty text,
    avatar text,
    verified boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
95bce0c6-f6e3-41b4-ad82-182ed92c0a38	06d56edb9bb5da9210851f13d8e25ea337a724e2bad776b4ae9d4ea2b02a4886	2026-04-04 12:52:45.28043+01	20260404115245_avs_db	\N	\N	2026-04-04 12:52:45.146423+01	1
f4b8e3ef-e7b0-4206-a5f4-280b0f340b41	05c840cc0d65d445a8a112b73ba5f2fe4d49f84728276c383ce118ab21e3f152	2026-05-17 01:29:56.105418+01	20260517002956_add_metadata_to_pattern	\N	\N	2026-05-17 01:29:56.097884+01	1
2f507af7-066d-41ff-a45d-1351d601d258	67ea315e91a0cc4558a0160e0a097bdc7099faffa0c6c0452245580d8d388821	2026-05-24 17:37:40.481199+01	20260524163740_update_pattern_structure	\N	\N	2026-05-24 17:37:40.337884+01	1
b14513dc-0b40-4252-898a-ef64b190eb96	d00cee7b46a55e0f0602561e37947fca8f48e2e11b9ac353644c56339f5a5eaf	2026-05-24 17:45:34.760838+01	20260524164534_make_pattern_fields_required	\N	\N	2026-05-24 17:45:34.750898+01	1
775c7de2-7929-4f53-8424-16a2d613fb3c	34b43e8296123c5bca966991224bdd1fdfdab5f7faad26b5aea83cfbfa112e4c	2026-05-26 20:49:37.347005+01	20260526194937_add_berber_pattern_type	\N	\N	2026-05-26 20:49:37.335954+01	1
2631428e-1572-459c-b3cb-8a4654e7fc7c	5b823024e4b0931135443fc1d1dddb5b951960fea29c48bb7b3307abd5d415b3	2026-05-27 07:50:28.319947+01	20260527065028_migratio1	\N	\N	2026-05-27 07:50:28.301181+01	1
5236beba-42ad-42fa-8d10-54807be66c82	25005e33099e28aa2f9804e40c6193bd4b16aa2cab40347d9bf44ebbeb5ce395	2026-05-27 08:04:02.572928+01	20260527070402_seed_db	\N	\N	2026-05-27 08:04:02.563344+01	1
a1b10f4a-d01a-4c86-a9d3-f006cdf83b76	b9747ed979c22931c87c89763fee6afeb5db6f4c5443bed2778d8d5132e062dc	2026-05-27 11:37:00.801822+01	20260527103700_	\N	\N	2026-05-27 11:37:00.783467+01	1
ff734e8f-d29d-41d2-a85e-10b86088107a	9aec85e2aa14efb49e3c6fe2fb10db28ee13b7effde4e66d3a6f3204b16732c5	2026-06-02 21:23:05.00221+01	20260602202304_update_createy	\N	\N	2026-06-02 21:23:04.979593+01	1
\.


--
-- Data for Name: accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.accounts (id, "userId", provider, "providerAccountId", access_token, refresh_token, expires_at) FROM stdin;
\.


--
-- Data for Name: activities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.activities (id, "userId", action, "targetId", "targetType", metadata, "createdAt") FROM stdin;
\.


--
-- Data for Name: artisan_quotes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.artisan_quotes (id, text, author, role, country, "patternId") FROM stdin;
cmpnq355j0007etbjybi53j5u	Chaque fil que je tisse raconte l'histoire de mes ancêtres. Le Kente n'est pas qu'un tissu, c'est une conversation avec le passé.	Kofi Mensah	Maître tisserand	Ghana	cmpnq355h0000etbjr5ovldjc
cmpnq357y000eetbj4vpfcj56	La boue que j'utilise vient de la même rivière que celle de ma grand-mère. C'est notre lien invisible avec la terre.	Aminata Coulibaly	Artisane Bogolan	Mali	cmpnq357y0008etbjt0xaym1v
cmpnq35a6000letbjha7alquk	Chaque symbole que je tamponne est une prière silencieuse. L'Adinkra parle quand les mots ne suffisent plus.	Kwame Asante	Maître imprimeur Adinkra	Ghana	cmpnq35a5000fetbjsfe2whp2
\.


--
-- Data for Name: artisans; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.artisans (id, "userId", name, craft, origin, country, bio, specialties, "patternCount", rating, verified, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: color_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.color_tokens (id, name, hex, meaning, origin, css, "paletteId") FROM stdin;
\.


--
-- Data for Name: comments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.comments (id, content, rating, type, "patternId", "artisanId", "userId", verified, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: origins; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.origins (id, people, region, country, flag, coords, "patternId") FROM stdin;
cmpnq355i0001etbjxze0goa5	Ashanti	Afrique de l'Ouest	Ghana	🇬🇭	{7.9465,-1.0232}	cmpnq355h0000etbjr5ovldjc
cmpnq357y0009etbjbeg651gw	Bamana	Afrique de l'Ouest	Mali	🇲🇱	{17.5707,-3.9962}	cmpnq357y0008etbjt0xaym1v
cmpnq35a5000getbjadwn6ojw	Akan	Afrique de l'Ouest	Ghana	🇬🇭	{7.9465,-1.0232}	cmpnq35a5000fetbjsfe2whp2
\.


--
-- Data for Name: palettes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.palettes (id, name, origin, description, "patternCSS", "isPublished", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: pattern_colors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pattern_colors (id, hex, name, meaning, "patternId") FROM stdin;
cmpnq355i0002etbjufc7gslf	#FFD700	Or	Royauté, richesse et fertilité	cmpnq355h0000etbjr5ovldjc
cmpnq355i0003etbj7cz0y8cs	#228B22	Vert forêt	Croissance, renouveau et prospérité	cmpnq355h0000etbjr5ovldjc
cmpnq355i0004etbjjjg5lcm7	#DC143C	Cramoisi	Sacrifice politique et passion spirituelle	cmpnq355h0000etbjr5ovldjc
cmpnq355i0005etbjo2hsw8ht	#000000	Noir	Maturité spirituelle et énergie ancestrale	cmpnq355h0000etbjr5ovldjc
cmpnq357y000aetbjdoa8pve8	#8B4513	Brun terre	La terre nourricière et les ancêtres	cmpnq357y0008etbjt0xaym1v
cmpnq357y000betbjsvz4x2qj	#F5DEB3	Beige coton	Pureté et origine naturelle du tissu	cmpnq357y0008etbjt0xaym1v
cmpnq357y000cetbjfg5vjob4	#000000	Noir boue	Protection spirituelle et force	cmpnq357y0008etbjt0xaym1v
cmpnq35a5000hetbj02i9ool1	#000000	Noir	Deuil, maturité spirituelle	cmpnq35a5000fetbjsfe2whp2
cmpnq35a5000ietbjfak0nrwb	#8B0000	Rouge sombre	Mort, sacrifice et sang ancestral	cmpnq35a5000fetbjsfe2whp2
cmpnq35a5000jetbjp9dpi538	#FFFFFF	Blanc	Purification et joie spirituelle	cmpnq35a5000fetbjsfe2whp2
\.


--
-- Data for Name: patterns; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.patterns (id, slug, "createdAt", "updatedAt", ceremonial, "cssClass", downloads, era, history, license, "nameLocal", sources, summary, symbolism, technique, type, views, "imgUrl", "isFeatured", name, status, "createdById") FROM stdin;
cmpnq357y0008etbjt0xaym1v	bogolan-mali	2026-05-27 07:08:27.31	2026-05-28 17:46:31.825	Traditionnellement porté par les femmes après l'excision, puis par les chasseurs pour se protéger des esprits.	pattern-bogolan	0	12ème siècle	Originaire du Mali, le Bogolan (littéralement "fait de boue" en Bambara) est une technique ancestrale transmise de génération en génération.	CC BY 4.0	Bògòlanfini	{https://en.wikipedia.org/wiki/Bogolanfini,https://africanstudies.org/bogolan}	Le Bogolan est un tissu teint à la boue fabriqué par les peuples Bamana du Mali, avec des motifs géométriques symboliques.	Les motifs géométriques encodent des messages et des histoires. Chaque symbole est lié à des événements historiques ou des proverbes.	Le tissu de coton est d'abord trempé dans une infusion de feuilles, puis des motifs sont peints avec de la boue fermentée riche en fer.	BOGOLAN	4	https://upload.wikimedia.org/wikipedia/commons/thumb/3/3e/Bogolan.jpg/320px-Bogolan.jpg	f	Bogolan du Mali	DRAFT	yannick
cmpnq355h0000etbjr5ovldjc	kente-ashanti	2026-05-27 07:08:27.222	2026-06-13 12:22:17.403	Porté lors des cérémonies importantes : mariages, funérailles royales, fêtes nationales.	pattern-kente	0	17ème siècle	Originaire du royaume Ashanti au Ghana, le Kente fut d'abord réservé à la royauté. Sa création remonte au 17ème siècle selon la tradition orale.	CC BY 4.0	Kente	{https://en.wikipedia.org/wiki/Kente_cloth,https://www.metmuseum.org/art/collection/search/317870}	Le Kente est un tissu traditionnel du peuple Ashanti du Ghana, reconnaissable à ses bandes colorées entrelacées.	Chaque couleur et motif a une signification précise : l'or représente la richesse, le vert la croissance, le rouge le sacrifice.	Tissage à la main sur métier à bandes étroites. Chaque bande est tissée séparément puis assemblée.	KENTE	10	https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/Kente-brand.png/320px-Kente-brand.png	t	Kente Ashanti	DRAFT	yannick
cmpnq35a5000fetbjsfe2whp2	adinkra-akan	2026-05-27 07:08:27.389	2026-05-28 17:41:54.651	Not specified	avs-pattern-adinkra-default	0	19ème siècle	History not provided	cc-by	Unknown	{}	Summary not provided	Plus de 100 symboles existent, chacun portant une signification philosophique, morale ou spirituelle profonde.	Technique not provided	ADINKRA	27	https://upload.wikimedia.org/wikipedia/commons/thumb/4/4a/Adinkra_symbols.jpg/320px-Adinkra_symbols.jpg	t	Adinkra Akan	DRAFT	yannick
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: symbols; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.symbols (id, name, "nameFr", "cssPreview", "imageUrl", meaning, usage, sacred, "patternId") FROM stdin;
cmpnq355i0006etbja9pibzzf	Oyokoman	Motif de la maison royale	bg-yellow-500	/symbols/oyokoman.svg	Représente la maison royale Oyoko du clan Ashanti	Réservé aux chefs et à la famille royale lors des cérémonies officielles	t	cmpnq355h0000etbjr5ovldjc
cmpnq357y000detbji2udymk9	Sankofa	Retour aux sources	bg-amber-800	/symbols/sankofa.svg	Il faut connaître son passé pour construire son avenir	Présent dans les vêtements de cérémonie et les rites de passage	f	cmpnq357y0008etbjt0xaym1v
cmpnq35a6000ketbjqqxz9zvy	Gye Nyame	Sauf Dieu	bg-black	/symbols/gye-nyame.svg	La suprématie de Dieu sur toutes choses — le symbole Adinkra le plus populaire	Omniprésent dans la culture Akan, sur les vêtements, bijoux et décorations	t	cmpnq35a5000fetbjsfe2whp2
\.


--
-- Data for Name: templates; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.templates (id, name, category, framework, complexity, description, code, "isPublished", "isFeatured", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, name, "passwordHash", role, "emailVerified", bio, location, website, github, twitter, specialty, avatar, verified, "createdAt", "updatedAt") FROM stdin;
cmnka03z70000661dsx7q5ahr	admin@avs.dev	Admin AVS	\N	ADMIN	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-04-04 11:55:28.676	2026-04-04 11:55:28.676
cmnket1x70000jrqhbxv9fslw	sipohe6596@elafans.com	ssdsdfadsadfsd	$2b$10$zkhHGmMUzOyNcMvhv4g13eXRRjVVbvqG5nbjey7gZ8L75sQ3BLcvG	VIEWER	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-04-04 14:09:57.499	2026-04-04 14:09:57.499
cmociochh00003ypzoqjk24jf	yannick.ndoh@kitabu.cm	Yannick Ndoh	$2b$10$lGIJFttyfNYMfkXLK1yicunEaxvZwiQ15t7hd70dim3OGWMCZ9L8m	VIEWER	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-04-24 06:15:49.302	2026-04-24 06:15:49.302
cmou31okg0000148y0l53up2l	kingtang337@gmail.com	Yannick Ndoh	$2b$10$N0arKZ6LHORp2jgHT62e.OXxu1SOTvF1WjqhBrGDaw.wFZfOd/EaS	VIEWER	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-05-06 13:18:08.801	2026-05-06 13:18:08.801
cmpw83nlw0000wafr3dkgafb4	7s3j6lege6@yzcalo.com	Yannick Ndoh	$2b$10$9EWsm8Jl2VBmLQG.YGpyg.asguhW0hgWe1s/Rc22pYbhB6uXus3rq	VIEWER	\N	\N	\N	\N	\N	\N	\N	\N	f	2026-06-02 05:54:53.633	2026-06-02 05:54:53.633
\.


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: artisan_quotes artisan_quotes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artisan_quotes
    ADD CONSTRAINT artisan_quotes_pkey PRIMARY KEY (id);


--
-- Name: artisans artisans_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artisans
    ADD CONSTRAINT artisans_pkey PRIMARY KEY (id);


--
-- Name: color_tokens color_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.color_tokens
    ADD CONSTRAINT color_tokens_pkey PRIMARY KEY (id);


--
-- Name: comments comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT comments_pkey PRIMARY KEY (id);


--
-- Name: origins origins_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.origins
    ADD CONSTRAINT origins_pkey PRIMARY KEY (id);


--
-- Name: palettes palettes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.palettes
    ADD CONSTRAINT palettes_pkey PRIMARY KEY (id);


--
-- Name: pattern_colors pattern_colors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pattern_colors
    ADD CONSTRAINT pattern_colors_pkey PRIMARY KEY (id);


--
-- Name: patterns patterns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.patterns
    ADD CONSTRAINT patterns_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: symbols symbols_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.symbols
    ADD CONSTRAINT symbols_pkey PRIMARY KEY (id);


--
-- Name: templates templates_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.templates
    ADD CONSTRAINT templates_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: accounts_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON public.accounts USING btree (provider, "providerAccountId");


--
-- Name: activities_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "activities_createdAt_idx" ON public.activities USING btree ("createdAt");


--
-- Name: activities_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "activities_userId_idx" ON public.activities USING btree ("userId");


--
-- Name: artisan_quotes_patternId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "artisan_quotes_patternId_key" ON public.artisan_quotes USING btree ("patternId");


--
-- Name: artisans_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "artisans_userId_key" ON public.artisans USING btree ("userId");


--
-- Name: comments_artisanId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "comments_artisanId_idx" ON public.comments USING btree ("artisanId");


--
-- Name: comments_patternId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "comments_patternId_idx" ON public.comments USING btree ("patternId");


--
-- Name: comments_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "comments_userId_idx" ON public.comments USING btree ("userId");


--
-- Name: origins_patternId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "origins_patternId_key" ON public.origins USING btree ("patternId");


--
-- Name: patterns_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX patterns_slug_idx ON public.patterns USING btree (slug);


--
-- Name: patterns_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX patterns_slug_key ON public.patterns USING btree (slug);


--
-- Name: patterns_type_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX patterns_type_idx ON public.patterns USING btree (type);


--
-- Name: sessions_sessionToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "sessions_sessionToken_key" ON public.sessions USING btree ("sessionToken");


--
-- Name: templates_category_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX templates_category_idx ON public.templates USING btree (category);


--
-- Name: templates_framework_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX templates_framework_idx ON public.templates USING btree (framework);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: accounts accounts_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activities activities_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: artisan_quotes artisan_quotes_patternId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artisan_quotes
    ADD CONSTRAINT "artisan_quotes_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES public.patterns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: artisans artisans_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.artisans
    ADD CONSTRAINT "artisans_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: color_tokens color_tokens_paletteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.color_tokens
    ADD CONSTRAINT "color_tokens_paletteId_fkey" FOREIGN KEY ("paletteId") REFERENCES public.palettes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_artisanId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_artisanId_fkey" FOREIGN KEY ("artisanId") REFERENCES public.artisans(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_patternId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES public.patterns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: comments comments_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.comments
    ADD CONSTRAINT "comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: origins origins_patternId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.origins
    ADD CONSTRAINT "origins_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES public.patterns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: pattern_colors pattern_colors_patternId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pattern_colors
    ADD CONSTRAINT "pattern_colors_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES public.patterns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: sessions sessions_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: symbols symbols_patternId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.symbols
    ADD CONSTRAINT "symbols_patternId_fkey" FOREIGN KEY ("patternId") REFERENCES public.patterns(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict MG8qIssTHCaiZ5RbFK6jMvcWEOgCiOKYhpyHOyjV3FsO0n8bg032OSyVih9TaQS

