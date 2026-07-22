/**
 * Edge Function: crear-usuario
 * Solo invocable por usuarios con rol 'admin'
 *
 * Recibe: { nombre, correo, password, rol }
 * Hace:
 *   1. Verifica que quien llama sea admin (via JWT)
 *   2. Crea el usuario en Supabase Auth
 *   3. Inserta el perfil en la tabla `perfiles`
 *
 * Deploy:
 *   supabase functions deploy crear-usuario --no-verify-jwt
 *   (el JWT se verifica manualmente adentro para mayor control)
 *
 * Variables de entorno necesarias en Supabase Dashboard:
 *   SUPABASE_URL            — auto-disponible en Edge Functions
 *   SUPABASE_SERVICE_ROLE_KEY — agregar manualmente en Settings > Edge Functions
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Roles que el admin puede asignar — nunca puede crear otro admin desde aquí
// Para crear admins hay que hacerlo directo en Supabase Dashboard
const ROLES_PERMITIDOS = ['medico', 'asistente', 'recepcionista', 'paciente']

Deno.serve(async (req) => {

  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS })
  }

  try {
    // ── 1. Verificar que quien llama es admin ─────────────────
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: 'No autorizado' }, 401)
    }

    // Cliente con el JWT del usuario que llama
    const supabaseCliente = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user }, error: authError } = await supabaseCliente.auth.getUser()
    if (authError || !user) return json({ error: 'No autorizado' }, 401)

    // Verificar rol admin en la tabla perfiles
    const { data: perfil } = await supabaseCliente
      .from('perfiles')
      .select('rol')
      .eq('id', user.id)
      .single()

    if (perfil?.rol !== 'admin') {
      return json({ error: 'Solo los administradores pueden crear usuarios' }, 403)
    }

    // ── 2. Validar el body ────────────────────────────────────
    const body = await req.json()
    const { nombre, correo, password, rol } = body

    if (!nombre?.trim())   return json({ error: 'El nombre es requerido' }, 400)
    if (!correo?.trim())   return json({ error: 'El correo es requerido' }, 400)
    if (!password)         return json({ error: 'La contraseña es requerida' }, 400)
    if (password.length < 8) return json({ error: 'La contraseña debe tener al menos 8 caracteres' }, 400)
    if (!ROLES_PERMITIDOS.includes(rol)) {
      return json({ error: `Rol inválido. Opciones: ${ROLES_PERMITIDOS.join(', ')}` }, 400)
    }

    // ── 3. Crear usuario con service_role (privilegiado) ──────
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data: nuevoUsuario, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email:             correo.trim().toLowerCase(),
      password,
      email_confirm:     true,   // confirmar email automáticamente
      user_metadata:     { nombre: nombre.trim() },
    })

    if (createError) {
      // Mensaje de error más amigable para duplicados
      if (createError.message.includes('already registered')) {
        return json({ error: 'Ya existe un usuario con ese correo' }, 409)
      }
      throw createError
    }

    // ── 4. Insertar perfil en la tabla perfiles ───────────────
    const { error: perfilError } = await supabaseAdmin
      .from('perfiles')
      .insert({
        id:     nuevoUsuario.user.id,
        nombre: nombre.trim(),
        rol,
        activo: true,
      })

    if (perfilError) {
      // Si falla el perfil, eliminar el usuario para no dejar basura
      await supabaseAdmin.auth.admin.deleteUser(nuevoUsuario.user.id)
      throw perfilError
    }

    // ── 5. Respuesta exitosa ──────────────────────────────────
    return json({
      ok: true,
      usuario: {
        id:     nuevoUsuario.user.id,
        nombre: nombre.trim(),
        correo: correo.trim().toLowerCase(),
        rol,
      }
    }, 201)

  } catch (err) {
    console.error('[crear-usuario]', err)
    return json({ error: err.message ?? 'Error interno' }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}
