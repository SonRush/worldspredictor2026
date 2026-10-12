# Worlds 2026 Predictor

SPA estática (Vite + TypeScript + Tailwind) que sigue, simula y predice el **League of Legends World Championship 2026**: Play-In, Swiss Stage, Playoffs, simulador H2H y Monte Carlo. Corre entera en el navegador y se publica en GitHub Pages. Una GitHub Action mantiene los datos al día.

> Proyecto de fans, sin afiliación con Riot Games. Las probabilidades salen de un modelo Elo y son estimaciones.

## Funcionalidades

| Pestaña | Qué hace |
|---|---|
| **Swiss Stage** | Cuadro del Play-In (doble eliminación Bo5) y matriz del Swiss por rondas y pools (0-0 … 2-2), con columnas de clasificados/eliminados. Click en un equipo = tu pick; los emparejamientos futuros se proyectan respetando las reglas. |
| **Playoffs** | Cuadro de 8 equipos a Bo5, con la probabilidad de cada serie. Se puede editar con picks y muestra el campeón proyectado y los favoritos por Monte Carlo. |
| **H2H Simulator** | Dos equipos cualesquiera + Bo1/Bo3/Bo5: % de victoria, distribución de marcadores, marcador más probable, factores determinantes y rosters. |
| **Power Rankings** | Elo efectivo, Δ por resultados, series/mapas, forma y % de Swiss / Playoffs / Final / Campeón (Monte Carlo de 500 a 10 000 iteraciones en un Web Worker). |

Los escudos son los logos oficiales de cada equipo (`public/logos/<ID>.webp`, tomados de LoL Esports); si uno no carga, se muestra el hexágono con el código. El botón ☀/🌙 de la cabecera alterna tema claro y oscuro: respeta tu sistema por defecto y recuerda tu elección.

Al pulsar **Simular torneo**, además de las probabilidades, las vistas muestran un *escenario simulado* (una corrida concreta con esa semilla), con botones para ver otro o volver a los favoritos. El Play-In y los cuartos/semis/final muestran quién gana más veces cada serie (`Sim`), y el Swiss añade una tabla con el récord final de cada equipo.

Los picks y preferencias se guardan en `localStorage` del navegador. Los datos se vuelven a pedir cada 5 minutos.

## Formato implementado (oficial Worlds 2026)

- **Play-In** (Los Ángeles, 15–18 oct): FURIA, MVK, Cloud9 KIA y Karmine Corp. Doble eliminación con todas las series a Bo5 (R1 → upper final / lower R1 → lower final → final de clasificación). Solo pasa 1 equipo.
- **Swiss** (Allen TX, 23–31 oct): 16 equipos. Con 3 victorias clasificas y con 3 derrotas quedas eliminado.
  - La ronda 1 se sortea por tiers: T1 vs T4 y T2 vs T3, sin cruces de la misma región. El clasificado del Play-In entra en el Tier 4.
  - Las demás rondas se sortean dentro de cada pool, sin revanchas (emparejamiento por backtracking).
  - Las series son Bo1, salvo las de clasificación (2-x) y las de eliminación (x-2), que son Bo3.
- **Knockout** (3–14 nov; la final es en el Barclays Center, NY): todo a Bo5. Los dos 3-0 van a mitades opuestas contra equipos 3-2 y el resto se sortea, evitando cruces de la misma región si se puede.

## Modelo de predicción (`src/simulator.ts`)

- **Mapa:** `P(A) = 1 / (1 + 10^((R_B − R_A)/400))`
- **Rating efectivo** = Elo base + resultados oficiales de Worlds 2026 (actualización Elo por mapa, K=24) + peso regional (LCK +15, LPL +10, LEC 0, LCS/LCP −10, CBLOL −20) + forma (±4 por victoria neta en los últimos 5 mapas).
- **Series:** la distribución exacta de marcadores sale de una binomial negativa, y el % de serie de la binomial acumulada.
- **Monte Carlo** (`src/montecarlo.ts`): simula el resto del torneo partiendo del estado real. Las series en vivo continúan desde su marcador actual y tus picks se incluyen si lo eliges. Usa un PRNG con semilla (mulberry32), así que cada ejecución es reproducible.

El Elo base de `teams.json` es una estimación de partida, hecha según la región, el tier del sorteo y el rendimiento de 2026. Puedes ajustarlo a mano.

## Estructura

```
index.html                  entrada de Vite (shell + pestañas)
vite.config.ts              base: './' → rutas relativas en todos los assets
public/data/teams.json      equipos, región, tier, Elo base, roster, alias
public/data/tournament.json calendario, cruces, estado y marcadores
public/data/schema.json     JSON Schema (draft 2020-12) de ambos ficheros
public/logos/               logos de los equipos (WebP 160×160, nombre = id del equipo)
src/simulator.ts            motor probabilístico (puro, sin DOM)
src/tournament.ts           lógica de formato: Play-In, Swiss, Knockout
src/montecarlo.ts           simulación global + mc.worker.ts
src/ui/*                    vistas de cada pestaña
scripts/sync_worlds.mjs     ingesta (Leaguepedia Cargo + LoL Esports opcional)
scripts/lib/merge.mjs       merge incremental (puro, testeado)
scripts/validate.mjs        validación con schema + checks semánticos
tests/                      vitest (motor, formato, Monte Carlo, sync)
.github/workflows/          deploy.yml (Pages) · sync_data.yml (cron)
```

## Probar en local

Requiere Node ≥ 22.18. El script de sync importa módulos `.ts` usando el type stripping nativo de Node.

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # tests unitarios
npm run validate     # valida public/data/*.json
npm run build        # genera dist/
npm run preview      # sirve dist/ como en producción
```

Para comprobar que el build funciona bajo un sub-path, como en Pages:

```bash
npm run build && mkdir -p /tmp/pages && cp -r dist /tmp/pages/worldspredictor2026
python3 -m http.server -d /tmp/pages 8080   # abre http://localhost:8080/worldspredictor2026/
```

### Sincronización de datos

```bash
npm run sync                                   # Leaguepedia + LoL Esports
node scripts/sync_worlds.mjs --dry-run         # muestra los cambios sin escribir nada
node scripts/sync_worlds.mjs --fixture=scripts/fixtures/sample_upstream.json --dry-run
```

Cómo funciona el script:

- **Incremental:** solo toca las partidas cuyo estado avanzó (`SCHEDULED → IN_PROGRESS → FINISHED`) o cuyo marcador cambió. Nunca hace retroceder una partida terminada, y los huecos del cuadro (Play-In/Playoffs) se rellenan según avanza el torneo.
- **Fallo seguro:** si hay un error de red, una respuesta vacía o mal formada, o el resultado no pasa la validación, los JSON no se tocan. El script sale con código 0 y deja un `::warning::` en Actions. La escritura es atómica (fichero temporal + rename).

## Deploy en GitHub Pages

`deploy.yml` corre en cada push a `main` (o manualmente): instala, valida, testea, compila y publica `dist/` en la rama **`gh-pages`**. GitHub activa Pages automáticamente al existir esa rama (Settings → Pages → *Deploy from a branch: gh-pages*), sin configuración manual.

URL: `https://sonrush.github.io/worldspredictor2026/`. Con `base: './'` todas las URLs son relativas, así que no interfiere con otras páginas del dominio.

### Sync automático

- `sync_data.yml` corre 5 veces al día (11:00, 14:00, 17:00, 20:00 y 23:00 hora CST de México = UTC-6) del 13 de octubre al 15 de noviembre, y también a mano con **Run workflow**. Cada ejecución puede retrasarse unos minutos por la cola de GitHub.
- En cada ejecución: hace el fetch, el merge y la validación con `schema.json`. Si hay cambios, commitea `chore(data): … [skip ci]` y lanza `deploy.yml` con `gh workflow run`, porque los pushes hechos con `GITHUB_TOKEN` no disparan otros workflows.
- LoL Esports usa por defecto la key pública del frontend de lolesports.com (no oficial). Si Riot la cambia: abre lolesports.com → F12 → Network → filtra `persisted/gw` → copia la cabecera `x-api-key` y guárdala como secret `LOLESPORTS_API_KEY`.
- Los cron de GitHub se leen de la rama por defecto, pero el job siempre hace checkout y push sobre `main`, así que funciona sea cual sea la rama por defecto.

## Datos iniciales

Los equipos, rosters, el sorteo del Play-In (FUR vs MVK, C9 vs KC) y los tiers del Swiss se cargaron el 12/10/2026 a partir de Leaguepedia, Wikipedia, Inven Global y GosuGamers. Las métricas de liga (`splitWinRate`, `gdAt15`, `kda`) quedan en `null` hasta que se rellenen. Los horarios del Play-In son provisionales y el sync los corrige.
