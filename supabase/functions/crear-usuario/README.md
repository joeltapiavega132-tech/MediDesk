# Edge Function: crear-usuario

## Deploy (una sola vez)

```bash
# 1. Instalar Supabase CLI si no la tienes
npm install -g supabase

# 2. Login
supabase login

# 3. Linkear al proyecto
supabase link --project-ref TU_PROJECT_REF
# El project-ref lo encuentras en: Supabase Dashboard → Settings → General → Reference ID

# 4. Agregar el secret de service_role
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui

# 5. Deploy de la función
supabase functions deploy crear-usuario

# 6. Verificar que quedó activa
supabase functions list
```

## Variables de entorno
SUPABASE_URL y SUPABASE_ANON_KEY son auto-inyectadas por Supabase.
Solo necesitas agregar manualmente:
- SUPABASE_SERVICE_ROLE_KEY (paso 4 arriba)

## Seguridad
- Solo usuarios con rol 'admin' en la tabla `perfiles` pueden invocarla
- No se puede crear otro admin desde aquí (solo desde el Dashboard de Supabase)
- La service_role key NUNCA sale del servidor (vive en Deno.env)
