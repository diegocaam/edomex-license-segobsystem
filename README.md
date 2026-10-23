# Edoméx · Control de licencias

Sistema interno en español para registrar y editar licencias, subir la fotografía del conductor, suspender registros y descargar códigos QR. Cada QR dirige a una consulta pública con nombre, foto, folio, categoría, fechas y estado actualizado. No hay integración con el padrón oficial y la consulta no acredita autenticidad oficial.

## Tecnologías

React 19, TypeScript, TanStack Start, Vite, Tailwind CSS, Lucide, Radix Dialog y QRCode. Netlify Functions protege las operaciones administrativas; Netlify Identity gestiona las cuentas, Netlify Database con Drizzle almacena registros y Netlify Blobs guarda fotografías JPEG.

## Desarrollo local

Requiere Node 22.13+ y pnpm. Instala dependencias con `pnpm install` y ejecuta `netlify dev --port 8889` con el proyecto vinculado a Netlify. Las funciones y el almacenamiento necesitan el entorno Netlify. Las migraciones de `netlify/database/migrations` se aplican automáticamente al desplegar; no ejecutarlas manualmente.

## Activar el acceso de Dcamargo

Identity está habilitado. En el panel del proyecto, abre Identity, invita el correo del administrador y acepta la invitación desde ese correo. Establece la contraseña en la página de aceptación. Luego asigna a esa cuenta el rol `admin` en Identity. El nombre del perfil es Dcamargo; el acceso usa el correo verificado. No se creó automáticamente una cuenta ni se incorporó ninguna contraseña al repositorio. Para restringir altas adicionales, configura Identity como solo por invitación. La API exige el rol admin aunque existan otras cuentas.

## Uso

Inicia sesión, selecciona Nueva licencia, carga una foto e introduce los datos y fechas. Confirma la autorización para su publicación. El folio es único y las notas son privadas. Desde la fila puedes editar, abrir la consulta y descargar el QR PNG o copiar su enlace. Una suspensión o cambio de fechas se refleja en la misma URL de consulta sin regenerar el QR. El estado usa la fecha de America/Mexico_City; la licencia es vigente hasta el final de la fecha de vencimiento. Un registro con expedición futura aparece como Por iniciar.

Las fotografías se convierten en el navegador a JPEG de hasta 800 píxeles por lado antes de enviarlas. El servidor admite JPEG de hasta 2 MB. La consulta pública requiere el identificador aleatorio del QR; no existe una búsqueda pública por nombre o folio. Quien tenga el enlace puede consultar sus datos, por lo que debe compartirse con autorización.

No se ejecutaron comandos locales de compilación o pruebas en esta sesión; la plataforma valida el proyecto al desplegar.
