# 🌊 Tu Salto Misiones

**Tu Salto Misiones** es una plataforma web interactiva desarrollada con **Next.js**, orientada a la **promoción y gestión de destinos naturales** como saltos y cascadas en la provincia de **Misiones, Argentina**.

La plataforma está diseñada para:

- **Usuarios visitantes**: que desean explorar y conocer estos sitios turísticos.
- **Administradores**: encargados de la gestión y actualización de la información de los destinos.

---

## 🚀 Cómo clonar y ejecutar el proyecto

### 1. Clonar el repositorio

```bash
git clone https://github.com/VeraMatiasE/tu-salto-misiones.git
cd tu-salto-misiones
```

### 2. Instalar dependencias

Utiliza el gestor de paquetes de tu preferencia:

```bash
npm install
# o
yarn install
# o
pnpm install
# o
bun install
```

### 3. Ejecutar el servidor de desarrollo

```bash
npm run dev
# o
yarn dev
# o
pnpm dev
# o
bun dev
```

Abre tu navegador en [http://localhost:3000](http://localhost:3000) para ver el proyecto en funcionamiento.

---

## 🔧 Configuración de Integración Continua (CI)

El proyecto utiliza **GitHub Actions** para la integración continua. Puedes encontrar la configuración en:

👉 [`./.github/workflows/ci.yml`](./.github/workflows/ci.yml)

Este archivo define el flujo de trabajo que automatiza los procesos de pruebas y despliegue del proyecto.

---

## ⚙️ ¿Cómo funciona la integración continua?
La integración continua está diseñada para ejecutarse automáticamente en los siguientes casos:

- Cuando se hace **push** a las ramas `prod` o `dev`.
- Cuando se crea un **pull request** hacia `prod` o `dev`.

El flujo de trabajo definido realiza las siguientes tareas:

1. **Clona el repositorio.**
2. **Configura Node.js** con caché para mayor eficiencia.
3. **Instala las dependencias** usando `npm ci`.
4. **Ejecuta el linter** con `npm run lint` para asegurar buenas prácticas.
5. **Ejecuta pruebas** con `npm run test`.
6. **Construye la aplicación** con `npm run build`.

Esto garantiza que cada cambio pase por validaciones automáticas antes de ser fusionado, manteniendo alta calidad y estabilidad.

---

## 🧱 Tecnologías principales

- [Next.js](https://nextjs.org/) – Framework de React para aplicaciones web.
- [React](https://reactjs.org/) – Biblioteca para construir interfaces de usuario.
- [TypeScript](https://www.typescriptlang.org/) – Superset de JavaScript que añade tipado estático.
- [Tailwind CSS](https://tailwindcss.com/) – Framework de CSS para estilos utilitarios.
- [GitHub Actions](https://github.com/features/actions) – Automatización de flujos de trabajo de CI/CD.

---

## 🌐 Despliegue

La aplicación está desplegada en **Vercel** y accesible en:

👉 [https://tu-salto-misiones.vercel.app](https://tu-salto-misiones.vercel.app)

Vercel proporciona un entorno de hosting optimizado para aplicaciones Next.js, facilitando el despliegue continuo y la escalabilidad.

---

## 📍 Funcionalidades destacadas

- **Exploración de destinos**: Muestra una lista de saltos y cascadas con información detallada.
- **Gestión de contenido**: Permite a los administradores agregar, editar y eliminar información de los destinos.
- **Interfaz responsiva**: Diseño adaptado para dispositivos móviles y de escritorio.
- **Optimización de rendimiento**: Uso de técnicas de carga diferida y optimización de imágenes.

---

## 📬 Contacto

Para consultas, sugerencias o contribuciones, por favor abre un issue en el repositorio o contacta directamente al autor:

- GitHub: [@VeraMatiasE](https://github.com/VeraMatiasE)

---

¡Gracias por apoyar el turismo sostenible y el desarrollo digital de Misiones! 🇦🇷💧
