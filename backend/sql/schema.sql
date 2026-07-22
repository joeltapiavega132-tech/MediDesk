-- ============================================================
-- MediDesk — Schema Supabase v1
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- ============================================================

-- Extensión para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- PERFILES (extiende auth.users de Supabase)
-- ─────────────────────────────────────────────
CREATE TABLE perfiles (
  id        UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre    TEXT        NOT NULL,
  rol       TEXT        NOT NULL DEFAULT 'asistente' CHECK (rol IN ('admin', 'asistente')),
  activo    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- MÉDICOS
-- ─────────────────────────────────────────────
CREATE TABLE medicos (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre        TEXT        NOT NULL,
  especialidad  TEXT,
  email         TEXT,
  telefono      TEXT,
  firma_url     TEXT,   -- URL de imagen de firma en Supabase Storage
  activo        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PACIENTES
-- ─────────────────────────────────────────────
CREATE TABLE pacientes (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          TEXT        NOT NULL,
  cedula          TEXT        UNIQUE,
  fecha_nacimiento DATE,
  telefono        TEXT,
  correo          TEXT,
  direccion       TEXT,
  notas           TEXT,
  consentimiento_lopdp BOOLEAN NOT NULL DEFAULT FALSE,
  consentimiento_fecha TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger: actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pacientes_updated_at
  BEFORE UPDATE ON pacientes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ─────────────────────────────────────────────
-- TIPOS DE SERVICIO (configurable)
-- ─────────────────────────────────────────────
CREATE TABLE tipos_servicio (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nombre          TEXT    NOT NULL,
  duracion_minutos INT    NOT NULL DEFAULT 30,
  color           TEXT    NOT NULL DEFAULT '#0D9488',
  activo          BOOLEAN NOT NULL DEFAULT TRUE
);

-- Datos iniciales
INSERT INTO tipos_servicio (nombre, duracion_minutos, color) VALUES
  ('Consulta general',      30,  '#0D9488'),
  ('Cirugía estética',      120, '#7C3AED'),
  ('Tratamiento láser',     60,  '#2563EB'),
  ('Cuidado de piel',       45,  '#059669'),
  ('Control post-operatorio', 30, '#D97706'),
  ('Certificado médico',    15,  '#6B7280');

-- ─────────────────────────────────────────────
-- CITAS
-- ─────────────────────────────────────────────
CREATE TABLE citas (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id       UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id         UUID REFERENCES medicos(id),
  tipo_servicio     TEXT NOT NULL,
  fecha_hora        TIMESTAMPTZ NOT NULL,
  duracion_minutos  INT  NOT NULL DEFAULT 30,
  estado            TEXT NOT NULL DEFAULT 'AGENDADA'
                    CHECK (estado IN ('AGENDADA','CONFIRMADA','ATENDIDA','CANCELADA','NO_ASISTIO')),
  sala              TEXT,
  notas             TEXT,
  recordatorio_enviado BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_citas_updated_at
  BEFORE UPDATE ON citas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_citas_fecha ON citas (fecha_hora);
CREATE INDEX idx_citas_paciente ON citas (paciente_id);

-- ─────────────────────────────────────────────
-- CERTIFICADOS MÉDICOS
-- ─────────────────────────────────────────────
CREATE TABLE certificados (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id     UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  medico_id       UUID REFERENCES medicos(id),
  tipo            TEXT NOT NULL CHECK (tipo IN ('REPOSO','APTITUD','PROCEDIMIENTO','GENERICO')),
  motivo          TEXT,
  fecha_emision   DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_caducidad DATE,
  notas_adicionales TEXT,
  pdf_url         TEXT,   -- URL del PDF generado en Storage
  enviado_correo  BOOLEAN NOT NULL DEFAULT FALSE,
  correo_destino  TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certificados_paciente ON certificados (paciente_id);

-- ─────────────────────────────────────────────
-- FOTOS BEFORE/AFTER
-- ─────────────────────────────────────────────
CREATE TABLE fotos_paciente (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  paciente_id   UUID NOT NULL REFERENCES pacientes(id) ON DELETE CASCADE,
  tipo          TEXT NOT NULL CHECK (tipo IN ('ANTES', 'DESPUES')),
  procedimiento TEXT,
  url           TEXT NOT NULL,
  fecha         DATE NOT NULL DEFAULT CURRENT_DATE,
  notas         TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_fotos_paciente ON fotos_paciente (paciente_id);

-- ─────────────────────────────────────────────
-- CONTABILIDAD
-- ─────────────────────────────────────────────
CREATE TABLE transacciones (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tipo        TEXT    NOT NULL CHECK (tipo IN ('INGRESO', 'EGRESO')),
  monto       NUMERIC(10,2) NOT NULL CHECK (monto > 0),
  categoria   TEXT    NOT NULL,
  descripcion TEXT,
  fecha       DATE    NOT NULL DEFAULT CURRENT_DATE,
  cita_id     UUID    REFERENCES citas(id),
  paciente_id UUID    REFERENCES pacientes(id),
  comprobante_url TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transacciones_fecha ON transacciones (fecha);
CREATE INDEX idx_transacciones_tipo  ON transacciones (tipo);

-- ─────────────────────────────────────────────
-- LOG DE AUDITORÍA (LOPDP)
-- ─────────────────────────────────────────────
CREATE TABLE audit_log (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  usuario_id  UUID REFERENCES auth.users(id),
  accion      TEXT NOT NULL,
  tabla       TEXT,
  registro_id UUID,
  detalle     JSONB,
  ip          TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY (RLS)
-- ─────────────────────────────────────────────
ALTER TABLE perfiles       ENABLE ROW LEVEL SECURITY;
ALTER TABLE pacientes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE citas          ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificados   ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones  ENABLE ROW LEVEL SECURITY;
ALTER TABLE medicos        ENABLE ROW LEVEL SECURITY;
ALTER TABLE fotos_paciente ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log      ENABLE ROW LEVEL SECURITY;

-- Política base: solo usuarios autenticados pueden leer/escribir
CREATE POLICY "auth_only" ON pacientes     FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_only" ON citas         FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_only" ON certificados  FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_only" ON transacciones FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_only" ON medicos       FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_only" ON fotos_paciente FOR ALL USING (auth.role() = 'authenticated');
CREATE POLICY "auth_only" ON tipos_servicio FOR ALL USING (auth.role() = 'authenticated');

-- Perfiles: cada usuario solo ve el suyo (admin ve todos vía service_role)
CREATE POLICY "own_profile" ON perfiles FOR ALL USING (auth.uid() = id);
