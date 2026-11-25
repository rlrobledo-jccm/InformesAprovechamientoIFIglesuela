# Aprovechamientos tras incendio

App web para el móvil que sirve para preparar los informes de aprovechamiento forestal de las parcelas quemadas:

1. **Mapa:** se seleccionan las parcelas quemadas de cada solicitud sobre la ortofoto PNOA.
2. **Madera:** calcula el volumen a extraer a partir de la distancia media entre pies y del % de pies y de extracción por clase diamétrica. Usa las tarifas y alturas del IFN3.
3. **Informe:** rellena el modelo de *Informe de Aprovechamiento Forestal – Modificación de Cubierta Vegetal* y lo descarga en Word, con un croquis sobre ortofoto PNOA al final.

Se puede instalar en el móvil como una app (PWA). No necesita tienda de aplicaciones.

## Contenido del repositorio

| Archivo | Qué es |
| --- | --- |
| `index.html` | La app |
| `js/core.js` | Cálculo de volúmenes (IFN3) y generación del Word |
| `data/parcelas.json` | Parcelas quemadas (generado desde el KML) |
| `data/plantilla.json` | Modelo de informe Word preparado con marcadores |
| `manifest.webmanifest`, `sw.js`, `icons/` | Lo necesario para instalarla en el móvil y usarla con poca cobertura |
| `tools/kml_a_json.py` | Convierte un KML nuevo en `data/parcelas.json` |
| `tools/preparar_plantilla.py` | Convierte el modelo .docx en `data/plantilla.json` |

## 1. Publicarla en GitHub Pages

1. En GitHub, crea un repositorio nuevo (por ejemplo `aprovechamientos-incendio`).
2. Pulsa **Add file → Upload files** y arrastra **todo el contenido** de esta carpeta, con sus subcarpetas. Pulsa **Commit changes**.
3. Ve a **Settings → Pages**. En *Build and deployment* elige **Deploy from a branch**, rama **main** y carpeta **/ (root)**. Guarda.
4. Al cabo de uno o dos minutos la app estará en `https://TU-USUARIO.github.io/aprovechamientos-incendio/`.

> **Privacidad.** Con una cuenta gratuita, GitHub Pages solo publica repositorios públicos. Lo que se publica son las parcelas quemadas (datos catastrales) y el modelo de informe. Las solicitudes que se rellenan (titulares, teléfonos…) **no se suben a ningún sitio**: se guardan solo en el navegador de cada dispositivo. Si el repositorio tiene que ser privado, hace falta un plan de pago de GitHub o alojar la carpeta en un servidor propio (vale cualquiera con HTTPS).

## 2. Instalarla en el móvil

Abre la dirección de la app con cobertura y:

- **Android (Chrome):** menú ⋮ → **Instalar aplicación** (o *Añadir a pantalla de inicio*).
- **iPhone (Safari):** botón **Compartir** → **Añadir a pantalla de inicio**.

Aparecerá el icono del pino y se abrirá a pantalla completa, como una app.

### Recortar parcelas (pastos y otras zonas que no se aprovechan)

Cuando una parcela quemada incluye pastos u otras zonas sin pinar, se recorta en el mapa:

1. Toca la parcela (ya añadida a la solicitud) y pulsa **✂ Recortar**.
2. Elige el modo:
   - **Excluir zona:** se dibuja el contorno de los pastos, que se restan.
   - **Conservar solo zona:** se dibuja el contorno del pinar y se descarta el resto.
3. Toca el mapa punto a punto siguiendo el contorno. **◎ Mi posición** añade un punto donde estás, para ir recorriendo el límite a pie, y **↶ Punto** borra el último.
4. Pulsa **Aplicar**.

Se pueden hacer varios recortes en una misma parcela; **Quitar recortes** devuelve la parcela a su forma original.

Desde ese momento solo cuenta la superficie recortada: la superficie de la parcela, los pies y el volumen a extraer, las UTM (centro de la zona recortada) y el informe. En Observaciones de la localización se anota la superficie excluida. En el croquis, las zonas excluidas aparecen rayadas en gris.

### Ortofoto sin conexión

Antes de ir a una zona sin cobertura, pulsa **⤓ Foto** en el mapa:

- **Zona:** las parcelas de la solicitud, la vista actual o todo el incendio.
- **Detalle:** el recomendado es el zoom 18 (~0,5 m). La app indica cuántas fotos y cuántos MB va a bajar.

Lo descargado se ve en el mapa sin conexión y sirve también para hacer el croquis. Se guarda en el móvil hasta que pulses **Borrar descargas**.

### Dictado por voz

Cada campo de texto tiene un botón de micrófono. Al pulsarlo se dicta en español; al volver a pulsarlo, o al dejar de hablar, se para.

- **Textos largos** (observaciones): se puede decir «coma», «punto», «punto y seguido», «punto y aparte» o «nueva línea».
- **Números** (por ejemplo, la distancia entre pies): «cuatro coma cinco» se escribe 4,5.
- **Permisos y conexión:** la primera vez el móvil pide permiso para el micrófono. El dictado necesita conexión, porque usa el servicio de voz de Google o de Apple.
- **Si el botón no aparece o no funciona** (pasa en algunos iPhone con la app instalada): usa el micrófono del propio teclado, que funciona en todos los campos.

### Uso con poca cobertura

- **La primera vez:** abre la app con conexión para que se guarde en el móvil.
- **Sin cobertura:** funcionan el formulario, los cálculos y la descarga del Word.
- **Mapa:** usa la ortofoto descargada con **⤓ Foto** y, además, las zonas ya vistas con conexión (hasta unas 3.000 fotos).
- **Croquis:** con conexión descarga la ortofoto del IGN. Sin conexión, usa las fotos descargadas; si no hay, sale sin ortofoto.
- **Copias:** las solicitudes se guardan en cada dispositivo. Para pasarlas a otro, usa *Informe → Exportar copia* y luego *Importar copia* en el otro.

## 3. Actualizar las parcelas (otro incendio o un KML corregido)

Necesitas Python 3 en el ordenador.

```bash
python tools/kml_a_json.py QuemadoxParcelaCatastral.kml data/parcelas.json
```

El KML debe traer por cada recinto los campos `MASA` (polígono) y `PARCELA`, y la superficie quemada en `Shape_Area` (ha) o en `AREA` (m²). Si no trae `COORX`/`COORY`, se calculan las UTM (ETRS89, huso 30) del centro de cada recinto.

Después:

1. Abre `sw.js` y sube la versión: `const VERSION = 'v2';`. Así los móviles descargan los datos nuevos.
2. Sube a GitHub `data/parcelas.json` y `sw.js`.

En los móviles, al abrir la app se vacían las parcelas de las solicitudes guardadas, porque ya no corresponden a la capa nueva. La app avisa.

> Desde la propia app, *Informe → Cargar otro KML* sirve para una prueba rápida, pero ese KML solo dura hasta que se recarga la app.

## 4. Cambiar el modelo de informe

```bash
python tools/preparar_plantilla.py modelo.docx data/plantilla.json
```

El script está hecho para la maqueta actual del modelo, la de 2026. Si cambia la estructura de las tablas del Word, hay que adaptarlo.

## Cálculo del volumen

- **Pies/ha:** 10.000 / d² en marco cuadrado, y 10.000 / (d² · √3/2) al tresbolillo. d es la distancia media entre pies, en metros.
- **Pies por clase diamétrica:** pies/ha × % estimado de esa clase.
- **Volumen con corteza por pie:** V (dm³) = p · d(mm)^q · h(m)^r. Es el modelo 11 del IFN3, forma de cubicación 2.

| Especie | p | q | r | Tarifa y alturas |
| --- | --- | --- | --- | --- |
| *Pinus pinaster* | 0,0004474 | 2,01474 | 0,87153 | IFN3 Toledo |
| *Pinus pinea* | 0,0016180 | 1,72090 | 1,02968 | IFN3 Toledo |
| *Pinus halepensis* | 0,0011788 | 1,89153 | 0,71216 | IFN3 Cuenca (en Toledo no tiene tarifa propia) |

- **Altura:** sale del listado 406 del IFN3 (altura media por especie, clase diamétrica y calidad). Por defecto se usa la calidad "Todas". Si se indica una altura medida, tiene prioridad.
- **Clases del informe:** las clases diamétricas del IFN (10, 15, 20…) se pasan a las del informe: <20, 20–24, 25–29, … y ≥50.

Fuentes: [IFN3 Toledo](https://www.miteco.gob.es/content/dam/miteco/es/biodiversidad/servicios/banco-datos-naturaleza/45_Toledo_tcm30-293894.pdf) · [IFN3 Cuenca](https://www.miteco.gob.es/content/dam/miteco/es/biodiversidad/servicios/banco-datos-naturaleza/16_Cuenca_tcm30-293887.pdf) · Ortofoto y mapa base: © IGN-CNIG (PNOA).

## Opcional: generar una app instalable (.apk) para Android

Con la app ya publicada en GitHub Pages:

1. Entra en [pwabuilder.com](https://www.pwabuilder.com) y pega la dirección de la app.
2. Elige **Android → Generate package**. Te da un .apk/.aab que se puede instalar directamente o subir a Google Play.

Para iPhone no hace falta: basta con *Añadir a pantalla de inicio*.
