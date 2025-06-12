---
name: Custom issue template
about: Proponer cambios
title: ''
labels: ''
assignees: ''

---

## Descripción del Issue

[Explicación clara de la propuesta.]

_Ejemplo:_  
"Los usuarios no pueden restablecer contraseña. El endpoint `/api/auth/reset-password` devuelve 500 cuando el email no está registrado (debería retornar 404)."

## Tipo de Issue

- [ ] `feat` - Nueva funcionalidad _(feature branch)_
- [ ] `refactor` - Mejora técnica sin cambiar funcionalidad _(refacto branch)_
- [ ] `perf` - Problema de rendimiento
- [ ] `security` - Vulnerabilidad
- [ ] `tech-debt` - Deuda técnica (SonarQube)

## Entorno Afectado

- [ ] Frontend (Next.js pages/components)
- [ ] API Routes (`app/api`)
- [ ] Base de datos (Supabase)
- [ ] CI/CD (autofix.yml / ci.yml)
- [ ] Testing (Jest)

## Criterios de Aceptación

[Lista de requisitos para considerar resuelto el issue]  
_Ejemplo:_  
- [ ] Nuevo endpoint `/api/auth/reset-password` retorna 404 si email no existe  
- [ ] Prueba de integración en `auth.test.js`  
- [ ] Coverage > 80% en el módulo
