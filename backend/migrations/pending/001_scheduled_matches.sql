-- ==============================================================================
-- MIGRACIÓN PENDIENTE (REGLA 2: NO EJECUTAR EN PRODUCCIÓN AUTOMÁTICAMENTE)
-- Archivo: 001_scheduled_matches.sql
-- Propósito: Permitir que homeTeam y awayTeam sean NULL en base de datos
--           y añadir columna opcional 'field' (cancha/lugar) de forma aditiva.
-- Estado: PENDIENTE / ADITIVA / NULLABLE / REVERSIBLE
-- ==============================================================================

-- 1. MIGRACIÓN HACIA ADELANTE (UP)
-- Permitir valores nulos en homeTeam y awayTeam para partidos programados
ALTER TABLE "Matches" ALTER COLUMN "homeTeam" DROP NOT NULL;
ALTER TABLE "Matches" ALTER COLUMN "awayTeam" DROP NOT NULL;

-- Añadir columna opcional para cancha/lugar (aditiva y nullable)
ALTER TABLE "Matches" ADD COLUMN IF NOT EXISTS "field" VARCHAR(255) NULL DEFAULT '';

-- Actualizar filas existentes que tengan cadenas vacías a NULL si se desea (opcional)
-- UPDATE "Matches" SET "homeTeam" = NULL WHERE "homeTeam" = '';
-- UPDATE "Matches" SET "awayTeam" = NULL WHERE "awayTeam" = '';


-- 2. REVERSIÓN / ROLLBACK (DOWN)
-- En caso de necesitar revertir esta migración:
-- UPDATE "Matches" SET "homeTeam" = 'Por definir' WHERE "homeTeam" IS NULL;
-- UPDATE "Matches" SET "awayTeam" = 'Por definir' WHERE "awayTeam" IS NULL;
-- ALTER TABLE "Matches" ALTER COLUMN "homeTeam" SET NOT NULL;
-- ALTER TABLE "Matches" ALTER COLUMN "awayTeam" SET NOT NULL;
-- ALTER TABLE "Matches" DROP COLUMN IF EXISTS "field";
