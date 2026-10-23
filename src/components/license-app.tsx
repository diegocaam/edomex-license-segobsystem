import { useEffect, useRef, useState, type FormEvent } from 'react'
import {
  ShieldCheck,
  LayoutDashboard,
  IdCard,
  ScanLine,
  Settings,
  LogOut,
  ArrowUpRight,
  Plus,
  Search,
  ChevronRight,
  Download,
  FileCheck2,
  Clock3,
  CircleAlert,
  X,
  Upload,
  Check,
  LockKeyhole,
  ArrowRight,
  Menu,
  Pencil,
  ExternalLink,
  UserRound,
  RefreshCw,
} from 'lucide-react'
import {
  getUser,
  login,
  signup,
  AuthError,
  logout,
  handleAuthCallback,
  acceptInvite,
  updateUser,
  requestPasswordRecovery,
  type User,
} from '@netlify/identity'
import QRCode from 'qrcode'
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from './ui/dialog'
import {
  type License,
  status,
  dateLabel,
  today,
  licenseTypes,
  licenseDescription,
} from '../lib/licenses'

async function api(path: string, options?: RequestInit) {
  const r = await fetch(path, options)
  const data = await r.json()
  if (!r.ok) throw new Error(data.error || 'No se pudo completar la solicitud.')
  return data
}
const publicLink = (l: License) =>
  `${window.location.origin}/?verificar=${l.token}`
const photoUrl = (l: License) => `/api/photos?token=${l.token}`
function Badge({ license }: { license: License }) {
  const s = status(license)
  return (
    <span className={`status status-${s.replace(' ', '').toLowerCase()}`}>
      <span />
      {s}
    </span>
  )
}
function Brand() {
  return (
    <div className="brand">
      <div className="brand-icon">
        <ShieldCheck size={26} strokeWidth={1.6} />
      </div>
      <div>
        <strong>
          edoméx<span>.</span>
        </strong>
        <small>CONTROL DE LICENCIAS</small>
      </div>
    </div>
  )
}

export function LicenseApp() {
  const [user, setUser] = useState<User | null>(null)
  const [rows, setRows] = useState<License[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [section, setSection] = useState('Resumen general')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('Todas')
  const [editor, setEditor] = useState<License | 'new' | null>(null)
  const [detail, setDetail] = useState<License | null>(null)
  const [auth, setAuth] = useState(false)
  const [authMode, setAuthMode] = useState('login')
  const [invite, setInvite] = useState('')
  const [busy, setBusy] = useState(false)
  const [publicToken, setPublicToken] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [mobile, setMobile] = useState(false)
  const [page, setPage] = useState(1)
  async function load() {
    setLoading(true)
    setError('')
    try {
      setRows(await api('/api/licenses'))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    async function init() {
      const token = new URLSearchParams(window.location.search).get('verificar')
      setPublicToken(token)
      setReady(true)
      if (token) return
      try {
        const callback = await handleAuthCallback()
        if (callback?.type === 'invite') {
          setInvite(callback.token)
          setAuthMode('invite')
          setAuth(true)
        }
        if (callback?.type === 'recovery') {
          setAuthMode('reset')
          setAuth(true)
        }
        const u = await getUser()
        setUser(u)
      } catch {
        setNotice(
          'No se pudo restaurar la sesión de tu cuenta. Puedes continuar sin iniciar sesión.',
        )
      }
      await load()
    }
    void init()
  }, [])
  const filtered = rows.filter(
    (l) =>
      `${l.name} ${l.folio}`.toLowerCase().includes(query.toLowerCase()) &&
      (filter === 'Todas' || status(l) === filter),
  )
  const pages = Math.max(1, Math.ceil(filtered.length / 6))
  const visible = filtered.slice(
    (Math.min(page, pages) - 1) * 6,
    Math.min(page, pages) * 6,
  )
  const active = rows.filter((l) => status(l) === 'Vigente').length
  const ending = rows.filter(
    (l) =>
      status(l) === 'Vigente' &&
      Math.ceil((Date.parse(l.expires) - Date.parse(today())) / 86400000) <= 30,
  ).length
  function create() {
    setEditor('new')
  }
  async function authSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (busy) return
    const f = new FormData(e.currentTarget)
    if (
      authMode === 'signup' &&
      f.get('password') !== f.get('confirmPassword')
    ) {
      setError('Las contraseñas no coinciden.')
      return
    }
    setBusy(true)
    setError('')
    setNotice('')
    try {
      if (authMode === 'signup') {
        const account = await signup(
          String(f.get('email')).trim(),
          String(f.get('password')),
        )
        setNotice(
          account.emailVerified
            ? 'Cuenta creada. Ya puedes registrar y modificar licencias con o sin sesión.'
            : 'Revisa tu correo y abre el enlace para confirmar tu cuenta. Puedes administrar las licencias sin iniciar sesión.',
        )
        setUser(account.emailVerified ? await getUser() : null)
        setAuth(false)
        setAuthMode('login')
        return
      } else if (authMode === 'invite')
        await acceptInvite(invite, String(f.get('password')))
      else if (authMode === 'reset')
        await updateUser({ password: String(f.get('password')) })
      else if (authMode === 'recover') {
        await requestPasswordRecovery(String(f.get('email')))
        setNotice('Revisa tu correo para recuperar el acceso.')
        setAuth(false)
        return
      } else await login(String(f.get('email')), String(f.get('password')))
      setUser(await getUser())
      setAuth(false)
      await load()
    } catch (error) {
      setError(
        authMode === 'signup'
          ? error instanceof AuthError && error.status === 403
            ? 'El registro de cuentas está deshabilitado. Solicita una invitación al administrador.'
            : 'No se pudo crear la cuenta. Revisa el correo y usa una contraseña de al menos 10 caracteres. Si ya tienes cuenta, inicia sesión o recupera tu acceso.'
          : 'No se pudo completar el acceso. Revisa tus datos y confirma tu correo o solicita una invitación.',
      )
    } finally {
      setBusy(false)
    }
  }
  if (ready && publicToken) return <PublicLicense token={publicToken} />
  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobile ? 'mobile-open' : ''}`}>
        <Brand />
        <div className="workspace-label">ESPACIO DE TRABAJO</div>
        <nav>
          {[
            { name: 'Resumen general', icon: LayoutDashboard },
            { name: 'Licencias', icon: IdCard },
            { name: 'Verificación QR', icon: ScanLine },
          ].map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={section === name ? 'nav-active' : ''}
              onClick={() => {
                setSection(name)
                setMobile(false)
                setPage(1)
              }}
            >
              <Icon size={19} />
              {name}
              {section === name && <span className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="secure-card">
            <ShieldCheck size={23} />
            <strong>Acceso compartido</strong>
            <p>
              Cualquier persona con el enlace puede registrar y modificar todas
              las licencias.
            </p>
            <span>
              <i /> Sin inicio de sesión
            </span>
          </div>
          <button
            className="settings-link"
            onClick={() => {
              setSection('Configuración')
              setMobile(false)
            }}
          >
            <Settings size={18} />
            Configuración
          </button>
          <div className="sidebar-foot">
            SISTEMA INTERNO · EDOMÉX
            <br />
            <span>Gestión de movilidad</span>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="mobile-menu"
              aria-label="Abrir menú"
              onClick={() => setMobile(!mobile)}
            >
              <Menu size={20} />
            </button>
            <span>Panel de control</span>
            <ChevronRight size={14} />
            <strong>{section}</strong>
          </div>
          <div className="top-actions">
            <span className="internal">
              <i /> Sistema interno
            </span>
            <div className="user-avatar">DC</div>
            <div className="user-info">
              <strong>{user?.name || 'Dcamargo'}</strong>
              <small>{user ? 'Cuenta conectada' : 'Acceso sin sesión'}</small>
            </div>
            <button
              className="icon-button"
              aria-label={user ? 'Cerrar sesión' : 'Iniciar sesión'}
              onClick={async () => {
                if (user) {
                  await logout()
                  setUser(null)
                  setNotice('Sesión cerrada.')
                } else setAuth(true)
              }}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>
        <main className="dashboard">
          <div className="page-heading">
            <div>
              <div className="eyebrow">PANEL INTERNO DE CONTROL</div>
              <h1>
                {section === 'Resumen general'
                  ? 'Cada registro, bajo control.'
                  : section}
              </h1>
              <p>
                {section === 'Resumen general'
                  ? 'Administra las licencias y consulta su vigencia en un solo lugar.'
                  : 'Gestiona y verifica los registros de tu sistema interno.'}
              </p>
            </div>
            <button className="primary" onClick={create}>
              <Plus size={18} />
              Nueva licencia
            </button>
          </div>
          {notice && (
            <div role="status" className="notice">
              <Check size={16} />
              {notice}
              <button aria-label="Cerrar aviso" onClick={() => setNotice('')}>
                <X size={16} />
              </button>
            </div>
          )}
          {error && !auth && (
            <div role="alert" className="error-box">
              {error}
              <button onClick={() => void load()}>Reintentar</button>
            </div>
          )}
          {section === 'Configuración' ? (
            <section className="panel settings-panel">
              <h2>Acceso y privacidad</h2>
              <p>
                Cualquier persona con el enlace de la aplicación puede
                consultar, registrar y modificar todas las licencias y sus
                fotografías, sin iniciar sesión ni solicitar permisos.
              </p>
              <p>
                Las notas también son visibles desde el listado compartido. La
                consulta por QR muestra nombre, fotografía, folio, categoría y
                fechas, y excluye las notas.
              </p>
              <p>
                Las cuentas son opcionales y no cambian el acceso a los
                registros.
              </p>
              <button className="primary" onClick={() => setAuth(true)}>
                <LockKeyhole size={16} />
                Cuenta opcional
              </button>
            </section>
          ) : section === 'Verificación QR' ? (
            <section className="panel qr-guide">
              <div className="guide-icon">
                <ScanLine size={40} />
              </div>
              <div className="eyebrow">CONSULTA PÚBLICA</div>
              <h2>Un código. El estado actualizado.</h2>
              <p>
                Cada licencia tiene un QR único. Al escanearlo, cualquier
                persona puede consultar la información del conductor y la
                vigencia del registro sin iniciar sesión.
              </p>
              <div className="steps">
                <span>01 · Registra al conductor</span>
                <span>02 · Descarga su QR</span>
                <span>03 · Comparte y verifica</span>
              </div>
              <button
                className="primary"
                onClick={() => setSection('Licencias')}
              >
                Ver licencias
                <ArrowRight size={17} />
              </button>
            </section>
          ) : (
            <>
              <section className="stats">
                <Stat
                  label="Total de licencias"
                  value={rows.length}
                  text="Registros en el sistema"
                  icon={<IdCard />}
                  accent="wine"
                />
                <Stat
                  label="Licencias vigentes"
                  value={active}
                  text="Con vigencia activa"
                  icon={<FileCheck2 />}
                  accent="green"
                />
                <Stat
                  label="Por vencer"
                  value={ending}
                  text="En los próximos 30 días"
                  icon={<Clock3 />}
                  accent="gold"
                />
                <Stat
                  label="No vigentes"
                  value={
                    rows.filter((l) =>
                      ['Vencida', 'Suspendida'].includes(status(l)),
                    ).length
                  }
                  text="Vencidas o suspendidas"
                  icon={<CircleAlert />}
                  accent="red"
                />
              </section>
              <section className="overview-banner">
                <div className="banner-emblem">
                  <ShieldCheck size={40} strokeWidth={1.3} />
                </div>
                <div>
                  <span>CONTROL QUE GENERA CONFIANZA</span>
                  <h2>Verificación al alcance de un escaneo.</h2>
                  <p>
                    Cada licencia cuenta con un código QR único para consultar
                    su estado.
                  </p>
                </div>
                <button onClick={() => setSection('Verificación QR')}>
                  Conocer la verificación
                  <ArrowUpRight size={17} />
                </button>
                <div className="banner-lines" />
              </section>
              <section className="panel records">
                <div className="panel-heading">
                  <div>
                    <h2>
                      Registro de licencias <span>{rows.length}</span>
                    </h2>
                    <p>
                      Consulta, actualiza y verifica la información de cada
                      conductor.
                    </p>
                  </div>
                  <button className="text-button" onClick={() => void load()}>
                    <RefreshCw size={15} />
                    {loading ? 'Actualizando' : 'Actualizar'}
                  </button>
                </div>
                <div className="table-toolbar">
                  <div className="tabs">
                    {['Todas', 'Vigente', 'Vencida', 'Suspendida'].map((f) => (
                      <button
                        key={f}
                        onClick={() => {
                          setFilter(f)
                          setPage(1)
                        }}
                        className={filter === f ? 'selected' : ''}
                      >
                        {f === 'Vigente'
                          ? 'Vigentes'
                          : f === 'Vencida'
                            ? 'Vencidas'
                            : f === 'Suspendida'
                              ? 'Suspendidas'
                              : f}
                      </button>
                    ))}
                  </div>
                  <div className="search">
                    <Search size={17} />
                    <input
                      aria-label="Buscar por nombre o folio"
                      placeholder="Buscar nombre o folio…"
                      value={query}
                      onChange={(e) => {
                        setQuery(e.target.value)
                        setPage(1)
                      }}
                    />
                  </div>
                </div>
                <div className="table-scroll">
                  <table>
                    <thead>
                      <tr>
                        <th>CONDUCTOR</th>
                        <th>FOLIO / LICENCIA</th>
                        <th>TIPO</th>
                        <th>VENCIMIENTO</th>
                        <th>ESTATUS</th>
                        <th className="right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading
                        ? [1, 2, 3].map((i) => (
                            <tr key={i}>
                              <td colSpan={6}>
                                <div className="skeleton" />
                              </td>
                            </tr>
                          ))
                        : visible.map((l) => (
                            <tr key={l.id}>
                              <td>
                                <div className="driver">
                                  <img src={photoUrl(l)} alt="" />
                                  <div>
                                    <strong>{l.name}</strong>
                                    <small>Conductor registrado</small>
                                  </div>
                                </div>
                              </td>
                              <td className="folio">{l.folio}</td>
                              <td>
                                <span className="type-tag">Tipo {l.type}</span>
                              </td>
                              <td>{dateLabel(l.expires)}</td>
                              <td>
                                <Badge license={l} />
                              </td>
                              <td>
                                <div className="row-actions">
                                  <button
                                    aria-label={`Ver QR de ${l.name}`}
                                    onClick={() => setDetail(l)}
                                  >
                                    <ScanLine size={18} />
                                  </button>
                                  <button
                                    aria-label={`Editar ${l.name}`}
                                    onClick={() => setEditor(l)}
                                  >
                                    <Pencil size={16} />
                                  </button>
                                  <button
                                    aria-label={`Consultar ${l.name}`}
                                    onClick={() =>
                                      window.open(
                                        publicLink(l),
                                        '_blank',
                                        'noopener,noreferrer',
                                      )
                                    }
                                  >
                                    <ArrowUpRight size={18} />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
                {!loading && !visible.length && (
                  <div className="empty">
                    <div className="empty-icon">
                      <IdCard size={31} />
                    </div>
                    <h3>
                      {query || filter !== 'Todas'
                        ? 'Sin coincidencias'
                        : 'Tu primer registro empieza aquí'}
                    </h3>
                    <p>
                      {query || filter !== 'Todas'
                        ? 'Prueba otro nombre, folio o estatus.'
                        : 'Agrega una licencia para generar su QR de consulta.'}
                    </p>
                    <button
                      className="secondary"
                      onClick={
                        query || filter !== 'Todas'
                          ? () => {
                              setQuery('')
                              setFilter('Todas')
                            }
                          : create
                      }
                    >
                      {query || filter !== 'Todas'
                        ? 'Limpiar filtros'
                        : 'Registrar licencia'}
                      <ArrowRight size={16} />
                    </button>
                  </div>
                )}
                <div className="table-footer">
                  <span>
                    {filtered.length
                      ? `${(Math.min(page, pages) - 1) * 6 + 1}–${Math.min(page * 6, filtered.length)} de ${filtered.length} registros`
                      : '0 registros'}
                    <span className="footer-dot">·</span>Información actualizada
                    al consultar
                  </span>
                  <div>
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Anterior
                    </button>
                    <b>{Math.min(page, pages)}</b>
                    <button
                      disabled={page >= pages}
                      onClick={() => setPage(page + 1)}
                    >
                      Siguiente
                    </button>
                  </div>
                </div>
              </section>
              <div className="below-grid">
                <div className="tip-card">
                  <div className="tip-icon">
                    <ScanLine size={24} />
                  </div>
                  <div>
                    <h3>Comparte la certeza, no los documentos.</h3>
                    <p>Descarga el QR desde las acciones de cada registro.</p>
                  </div>
                  <button
                    aria-label="Ver instrucciones QR"
                    onClick={() => setSection('Verificación QR')}
                  >
                    <ArrowUpRight size={21} />
                  </button>
                </div>
                <div className="privacy-note">
                  <LockKeyhole size={19} />
                  <p>
                    <strong>Registro y edición con acceso compartido.</strong>
                    <br />
                    Cualquier persona con el enlace puede consultar y modificar
                    los registros.
                  </p>
                </div>
              </div>
            </>
          )}
          <footer className="main-footer">
            <span>
              © {new Date().getFullYear()} Edoméx · Control de licencias
            </span>
            <span>
              Registro interno independiente · Sin conexión al padrón oficial
            </span>
          </footer>
        </main>
      </div>
      <Dialog open={auth} onOpenChange={setAuth}>
        <DialogContent className="app-dialog">
          <div className="modal-icon">
            <LockKeyhole />
          </div>
          <DialogTitle>
            {authMode === 'invite'
              ? 'Activa tu cuenta'
              : authMode === 'reset'
                ? 'Nueva contraseña'
                : authMode === 'recover'
                  ? 'Recuperar acceso'
                  : authMode === 'signup'
                    ? 'Registrar usuario'
                    : 'Cuenta opcional'}
          </DialogTitle>
          <DialogDescription>
            {authMode === 'signup'
              ? 'Crea tu cuenta con correo y contraseña. Confirma tu correo para iniciar sesión.'
              : 'Perfil Dcamargo · Iniciar sesión es opcional'}
          </DialogDescription>
          <form
            key={authMode}
            className="stack-form"
            onSubmit={authSubmit}
            aria-busy={busy}
          >
            {!['invite', 'reset'].includes(authMode) && (
              <label>
                Correo de tu cuenta
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="username"
                  placeholder="correo@ejemplo.com"
                />
              </label>
            )}
            {authMode !== 'recover' && (
              <label>
                Contraseña
                <input
                  name="password"
                  type="password"
                  required
                  minLength={authMode === 'login' ? 1 : 10}
                  autoComplete={
                    authMode === 'login' ? 'current-password' : 'new-password'
                  }
                />
              </label>
            )}
            {authMode === 'signup' && (
              <label>
                Confirmar contraseña
                <input
                  name="confirmPassword"
                  type="password"
                  required
                  minLength={10}
                  autoComplete="new-password"
                />
                <small className="form-help">Usa al menos 10 caracteres.</small>
              </label>
            )}
            {error && (
              <p role="alert" className="error-box">
                {error}
              </p>
            )}
            <button className="primary" disabled={busy}>
              {busy
                ? 'Procesando…'
                : authMode === 'recover'
                  ? 'Enviar enlace'
                  : authMode === 'signup'
                    ? 'Crear cuenta'
                    : 'Continuar'}
              <ArrowRight size={16} />
            </button>
            {authMode === 'login' && (
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setError('')
                  setAuthMode('signup')
                }}
              >
                Registrarse
              </button>
            )}
            {authMode === 'login' && (
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setError('')
                  setAuthMode('recover')
                }}
              >
                Olvidé mi contraseña
              </button>
            )}
            {['recover', 'signup'].includes(authMode) && (
              <button
                type="button"
                className="text-button"
                disabled={busy}
                onClick={() => {
                  setError('')
                  setAuthMode('login')
                }}
              >
                Volver al acceso
              </button>
            )}
            <p className="form-help">
              Puedes consultar, registrar y modificar todas las licencias sin
              crear una cuenta ni iniciar sesión.
            </p>
          </form>
        </DialogContent>
      </Dialog>
      <Dialog open={!!editor} onOpenChange={(v) => !v && setEditor(null)}>
        <DialogContent className="app-dialog editor-dialog">
          <DialogTitle>
            {editor === 'new' ? 'Registrar nueva licencia' : 'Editar licencia'}
          </DialogTitle>
          <DialogDescription>
            La información del conductor será visible al escanear el QR.
          </DialogDescription>
          {editor && (
            <LicenseForm
              key={typeof editor === 'string' ? 'new' : editor.id}
              initial={editor === 'new' ? null : editor}
              onCancel={() => setEditor(null)}
              onSave={async () => {
                setEditor(null)
                setNotice('Registro guardado. Su QR ya está disponible.')
                await load()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="app-dialog">
          <DialogTitle>Código de verificación</DialogTitle>
          <DialogDescription>
            {detail?.name} · {detail?.folio}
          </DialogDescription>
          {detail && <QRDetail license={detail} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
function Stat({
  label,
  value,
  text,
  icon,
  accent,
}: {
  label: string
  value: number
  text: string
  icon: React.ReactNode
  accent: string
}) {
  return (
    <article className={`stat ${accent}`}>
      <div className="stat-top">
        <span>{label}</span>
        <div>{icon}</div>
      </div>
      <strong>{String(value).padStart(2, '0')}</strong>
      <p>
        <span className="stat-dot" />
        {text}
      </p>
    </article>
  )
}

function LicenseForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: License | null
  onSave: () => Promise<void>
  onCancel: () => void
}) {
  const [photo, setPhoto] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    if (!photo) return
    const src = URL.createObjectURL(photo)
    setPreview(src)
    return () => URL.revokeObjectURL(src)
  }, [photo])
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setError('')
    try {
      let photoId = initial?.photo
      if (photo) {
        const bitmap = await createImageBitmap(photo)
        const canvas = document.createElement('canvas')
        const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height))
        canvas.width = Math.round(bitmap.width * scale)
        canvas.height = Math.round(bitmap.height * scale)
        const context = canvas.getContext('2d')
        if (!context) throw new Error('No se pudo procesar la foto.')
        context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
        bitmap.close()
        const blob = await new Promise<Blob>((resolve, reject) =>
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Fotografía inválida.'))),
            'image/jpeg',
            0.86,
          ),
        )
        photoId = (await api('/api/photos', { method: 'POST', body: blob })).id
      }
      if (!photoId) throw new Error('Agrega la fotografía del conductor.')
      await api('/api/licenses', {
        method: initial ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: initial?.id,
          name: f.get('name'),
          curp: f.get('curp'),
          folio: f.get('folio'),
          type: f.get('type'),
          issued: f.get('issued'),
          expires: f.get('expires'),
          suspended: f.get('suspended') === 'on',
          photo: photoId,
          notes: f.get('notes'),
        }),
      })
      await onSave()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <form className="stack-form" onSubmit={save}>
      <div className="photo-upload">
        {preview || initial ? (
          <img
            src={preview || photoUrl(initial!)}
            alt="Fotografía del conductor"
          />
        ) : (
          <UserRound size={30} />
        )}
        <div>
          <button
            type="button"
            className="secondary"
            onClick={() => fileRef.current?.click()}
          >
            <Upload size={15} />{' '}
            {initial || photo ? 'Cambiar fotografía' : 'Subir fotografía'}
          </button>
          <small>JPG, PNG o WebP · Máximo 8 MB de origen</small>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (
              file &&
              file.size <= 8_000_000 &&
              ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
            ) {
              setPhoto(file)
              setError('')
            } else
              setError('Selecciona una imagen JPG, PNG o WebP de hasta 8 MB.')
          }}
        />
      </div>
      <label>
        Nombre completo del conductor
        <input
          name="name"
          required
          minLength={3}
          maxLength={120}
          defaultValue={initial?.name}
          placeholder="Nombre y apellidos"
        />
      </label>
      <label>
        CURP del conductor <small>(opcional; visible en el QR)</small>
        <input
          name="curp"
          minLength={18}
          maxLength={18}
          pattern="[A-Za-z0-9]{18}"
          defaultValue={initial?.curp || ''}
          placeholder="CURP de 18 caracteres"
          autoCapitalize="characters"
        />
      </label>
      <div className="form-grid">
        <label>
          Folio / número de licencia
          <input
            name="folio"
            required
            pattern="[A-Za-z0-9\-]{4,30}"
            maxLength={30}
            defaultValue={initial?.folio}
            placeholder="L12345678"
          />
        </label>
        <label>
          Tipo de licencia
          <select name="type" defaultValue={initial?.type || 'A'}>
            {Object.entries(licenseTypes).map(([type, description]) => (
              <option key={type} value={type}>
                {type} · {description}
              </option>
            ))}
          </select>
        </label>
        <label>
          Fecha de expedición
          <input
            type="date"
            name="issued"
            required
            defaultValue={initial?.issued || today()}
          />
        </label>
        <label>
          Fecha de vencimiento
          <input
            type="date"
            name="expires"
            required
            defaultValue={initial?.expires}
          />
        </label>
      </div>
      <label>
        Notas internas <small>(no se publican)</small>
        <textarea
          name="notes"
          maxLength={1000}
          defaultValue={initial?.notes}
          placeholder="Observaciones del registro…"
        />
      </label>
      <label className="checkbox-label">
        <input
          type="checkbox"
          name="suspended"
          defaultChecked={initial?.suspended}
        />
        Suspender este registro
      </label>
      <label className="checkbox-label">
        <input type="checkbox" required />
        Confirmo la autorización para publicar nombre, CURP, fotografía y datos
        de la licencia mediante el QR y compartir el registro y sus notas con
        quienes tengan el enlace de la aplicación.
      </label>
      {error && (
        <p className="error-box" role="alert">
          {error}
        </p>
      )}
      <div className="form-actions">
        <button type="button" className="secondary" onClick={onCancel}>
          Cancelar
        </button>
        <button className="primary" disabled={busy}>
          {busy
            ? 'Guardando…'
            : initial
              ? 'Guardar cambios'
              : 'Guardar y generar QR'}
          <Check size={16} />
        </button>
      </div>
    </form>
  )
}
function QRDetail({ license }: { license: License }) {
  const [qr, setQr] = useState('')
  const [copied, setCopied] = useState(false)
  useEffect(() => {
    void QRCode.toDataURL(publicLink(license), {
      width: 700,
      margin: 3,
      errorCorrectionLevel: 'M',
      color: { dark: '#52192d', light: '#ffffff' },
    }).then(setQr)
  }, [license])
  return (
    <div className="qr-detail">
      {qr && <img src={qr} alt="Código QR para consultar esta licencia" />}
      <Badge license={license} />
      <p>El enlace siempre muestra el estado actual del registro.</p>
      <div className="form-actions">
        <a className="primary" href={qr} download={`QR-${license.folio}.png`}>
          <Download size={16} />
          Descargar QR
        </a>
        <a
          className="secondary"
          href={publicLink(license)}
          target="_blank"
          rel="noreferrer"
        >
          <ExternalLink size={16} />
          Abrir
        </a>
      </div>
      <button
        className="text-button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(publicLink(license))
            setCopied(true)
          } catch {
            setCopied(false)
          }
        }}
      >
        {copied ? 'Enlace copiado' : 'Copiar enlace de consulta'}
      </button>
    </div>
  )
}
function PublicLicense({ token }: { token: string }) {
  const [license, setLicense] = useState<License | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  async function fetchLicense() {
    setLoading(true)
    setError('')
    try {
      setLicense(await api(`/api/licenses?token=${encodeURIComponent(token)}`))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }
  useEffect(() => {
    void fetchLicense()
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex,nofollow'
    document.head.appendChild(meta)
    return () => meta.remove()
  }, [token])
  return (
    <div className="public-page">
      <header>
        <Brand />
        <span>CONSULTA DE REGISTRO</span>
      </header>
      <main className="public-card">
        <div className="eyebrow">VERIFICACIÓN POR CÓDIGO QR</div>
        <h1>Información de la licencia</h1>
        {loading ? (
          <div className="skeleton" />
        ) : error ? (
          <div role="alert" className="error-box">
            {error}
            <button onClick={() => void fetchLicense()}>Reintentar</button>
          </div>
        ) : (
          license && (
            <>
              <div className="public-person">
                <img
                  src={photoUrl(license)}
                  alt={`Fotografía de ${license.name}`}
                />
                <div>
                  <Badge license={license} />
                  <h2>{license.name}</h2>
                  <span>Conductor registrado</span>
                </div>
              </div>
              <dl>
                {[
                  ['Folio de licencia', license.folio],
                  ['CURP', license.curp || 'No registrada'],
                  ['Tipo de licencia', license.type],
                  ['Descripción', licenseDescription(license.type)],
                  ['Expedición', dateLabel(license.issued)],
                  ['Vencimiento', dateLabel(license.expires)],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt>{k}</dt>
                    <dd>{v}</dd>
                  </div>
                ))}
              </dl>
              <p className="public-message">
                <ShieldCheck size={20} />
                {status(license) === 'Vigente'
                  ? 'Este registro está vigente conforme a las fechas capturadas.'
                  : 'Este registro no cuenta con vigencia activa en este momento.'}
              </p>
              <small>
                Consulta realizada el {dateLabel(today())}. Estado calculado con
                la fecha del centro de México.
              </small>
              <button className="secondary" onClick={() => void fetchLicense()}>
                <RefreshCw size={16} />
                Actualizar consulta
              </button>
            </>
          )
        )}
        <p className="public-disclaimer">
          Consulta de un registro interno independiente. No acredita
          autenticidad ni sustituye la validación de la autoridad emisora.
        </p>
      </main>
      <footer>Control de licencias · Edoméx</footer>
    </div>
  )
}
