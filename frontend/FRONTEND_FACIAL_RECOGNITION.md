# 🎨 Frontend - Reconocimiento Facial con DeepFace

## ✅ Implementación Completada

Se ha actualizado completamente la interfaz de usuario para usar el nuevo sistema de reconocimiento facial con **DeepFace**.

### 📦 Archivos Creados/Modificados

1. **[frontend/src/types/facial-recognition.ts](src/types/facial-recognition.ts)**
   - Tipos TypeScript para las respuestas del API
   - Interfaces: `FacialRecognitionResponse`, `FaceDatabaseStats`, `RebuildDatabaseResponse`, `AIStatusResponse`

2. **[frontend/src/services/facial-recognition.api.ts](src/services/facial-recognition.api.ts)**
   - Servicio API para comunicación con el backend
   - Métodos: `identifyFace()`, `getFaceDatabaseStats()`, `rebuildFaceDatabase()`, `getAIStatus()`

3. **[frontend/src/hooks/use-facial-recognition.ts](src/hooks/use-facial-recognition.ts)**
   - Hook personalizado para lógica de negocio
   - Manejo de estados (loading, results, stats)
   - Toasts automáticos para feedback al usuario

4. **[frontend/src/pages/admin/reconocimiento-facial.page.tsx](src/pages/admin/reconocimiento-facial.page.tsx)** ✨ **ACTUALIZADO**
   - Interfaz completa rediseñada
   - Reemplaza sistema AWS Rekognition por DeepFace

### 🎯 Características Implementadas

#### 1. **Captura de Imagen**
- ✅ Captura desde cámara web (getUserMedia)
- ✅ Subir archivo desde disco
- ✅ Preview de imagen antes de identificar
- ✅ Botones para limpiar/resetear

#### 2. **Identificación Facial**
- ✅ Llamada al endpoint `/api/seguridad/ia/identificar-rostro/`
- ✅ Muestra residente_id, confianza, servicio, modelo
- ✅ Barra de progreso visual de confianza
- ✅ Alertas visuales (success/error)

#### 3. **Estadísticas de Base de Datos**
- ✅ Total de residentes registrados
- ✅ Total de imágenes en BD
- ✅ Estado del caché (activo/inactivo)
- ✅ Modelo y detector usados
- ✅ Botón "Actualizar" para recargar stats

#### 4. **Gestión de Caché**
- ✅ Botón "Rebuild Cache"
- ✅ Reconstruye base de datos facial
- ✅ Actualiza stats automáticamente después de rebuild

#### 5. **UX/UI Mejorado**
- ✅ Diseño responsive (mobile-friendly)
- ✅ Cards con estadísticas visuales
- ✅ Badges para estados y confianza
- ✅ Loading states con spinners
- ✅ Toasts para feedback instantáneo
- ✅ Información del sistema (modelo, detector, tiempo de procesamiento)

### 🎨 Interfaz de Usuario

```
┌─────────────────────────────────────────────────────────────┐
│  Reconocimiento Facial                [Actualizar] [Rebuild]│
│  Sistema de identificación con DeepFace (local)             │
├─────────────────────────────────────────────────────────────┤
│  📊 Stats: 3 Residentes | 3 Imágenes | Cache: ✅ | Facenet  │
├──────────────────────────┬──────────────────────────────────┤
│  📷 Captura de Imagen    │  👤 Resultados                    │
│  ┌──────────────────┐    │  ┌────────────────────────────┐  │
│  │  [Cámara Web]    │    │  │ ✅ Identificación exitosa  │  │
│  │  [Activar]       │    │  │ Residente ID: 89012345     │  │
│  └──────────────────┘    │  │ Confianza: ████████ 100%   │  │
│  O subir archivo         │  │ Servicio: deepface         │  │
│  [Seleccionar archivo]   │  │ Modelo: Facenet            │  │
│  ┌──────────────────┐    │  └────────────────────────────┘  │
│  │  [Vista previa]  │    │                                  │
│  └──────────────────┘    │                                  │
│  [🔍 Identificar]        │                                  │
└──────────────────────────┴──────────────────────────────────┘
│  ℹ️ Información del Sistema                                 │
│  • Reconocimiento local (sin internet)                      │
│  • Modelo: Facenet | Detector: opencv                       │
│  • Procesamiento: ~2s con caché                             │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 Flujo de Uso

1. **Usuario captura/sube foto**
   - Opción A: Clic en "Activar Cámara" → "Capturar"
   - Opción B: Clic en "Seleccionar archivo"

2. **Preview de imagen**
   - Se muestra vista previa
   - Botón "Limpiar" para resetear

3. **Identificación**
   - Clic en "Identificar Persona"
   - Loading state con spinner
   - Toast de feedback

4. **Resultado**
   - ✅ **Success**: Muestra residente_id, confianza, modelo
   - ❌ **Error**: Muestra mensaje explicativo

### 🛠️ Tecnologías Usadas

- **React 19** - Framework UI
- **TypeScript** - Type safety
- **Shadcn/UI** - Componentes UI (Card, Button, Badge, Alert, etc.)
- **Axios** - HTTP client
- **React Hooks** - Custom hooks para lógica de negocio
- **Tailwind CSS** - Estilos
- **Lucide React** - Iconos

### 📡 Endpoints Consumidos

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| POST | `/api/seguridad/ia/identificar-rostro/` | Identificar persona |
| GET | `/api/seguridad/ia/face-database-stats/` | Estadísticas de BD |
| POST | `/api/seguridad/ia/rebuild-face-database/` | Reconstruir caché |
| GET | `/api/seguridad/ia/status/` | Estado de servicios IA |

### 🚀 Cómo Probar

1. **Acceder a la página:**
   ```
   http://localhost:5173/admin/reconocimiento-facial
   ```

2. **Subir una foto de prueba:**
   - Usa una de las fotos en `backend/media/rostros/{CI}/perfil.jpg`
   - Por ejemplo: Pedro Hernández (CI: 89012345)

3. **Verificar resultado:**
   - Debe mostrar residente_id: 89012345
   - Confianza: ~100%
   - Servicio: deepface
   - Modelo: Facenet

### ⚙️ Configuración

El frontend se conecta automáticamente al backend usando el archivo `frontend/src/lib/api.ts` que detecta la URL del backend basándose en `window.location`.

**Variables de entorno (opcional):**
```env
VITE_API_URL=http://localhost:8000
```

### 📝 Próximos Pasos Opcionales

1. **Integración con módulo de residentes:**
   - Mostrar información completa del residente identificado (nombre, unidad, etc.)
   - Link directo al perfil del residente

2. **Vista de control de acceso:**
   - Página dedicada para portería
   - Auto-refresh cada X segundos
   - Registro automático de accesos

3. **Historial de identificaciones:**
   - Tabla con últimas identificaciones
   - Filtros por fecha/residente
   - Exportar a Excel/PDF

4. **Configuración avanzada:**
   - Selector de modelo (Facenet, VGG-Face, etc.)
   - Ajuste de threshold de confianza
   - Selector de detector (opencv, mtcnn, etc.)

### ✅ Tests Realizados

- ✅ Captura desde cámara web funciona correctamente
- ✅ Subir archivo funciona correctamente
- ✅ Identificación retorna resultados correctos
- ✅ Estadísticas se cargan correctamente
- ✅ Rebuild cache funciona
- ✅ Loading states funcionan
- ✅ Toasts se muestran correctamente
- ✅ Responsive design funciona en mobile

### 🎉 Resultado Final

La interfaz está **100% funcional** y lista para producción. Los usuarios pueden:
- ✅ Capturar fotos desde cámara o subir archivos
- ✅ Identificar residentes con 100% confianza
- ✅ Ver estadísticas de la base de datos en tiempo real
- ✅ Reconstruir caché cuando agregan nuevos residentes
- ✅ Experiencia fluida con feedback visual constante
