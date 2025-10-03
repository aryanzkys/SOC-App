CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom type for attendance status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status') THEN
    CREATE TYPE attendance_status AS ENUM ('Hadir', 'Alfa', 'Izin');
  END IF;
END $$;

-- Create attendance table
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  nisn TEXT NOT NULL,
  date DATE NOT NULL,
  status attendance_status NOT NULL DEFAULT 'Hadir',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS attendance_user_id_idx ON attendance (user_id);
CREATE INDEX IF NOT EXISTS attendance_date_idx ON attendance (date);
