# Ojo con las Sanciones - Scraper SFP

Web scraper para el Directorio de Proveedores y Contratistas Sancionados de la Secretaría de la Función Pública de México. Utilizado por el proyecto [Ojo con las Sanciones](https://ojosanciones.sociedad.info/).

### Usp

```
node index.js
```

### Detalles

Este scraper utiliza [Puppeteer](https://pptr.dev/) para extraer la información de sanciones del sitio web de la SFP, y la coloca en un archivo JSON dentro del directorio *data* del script.

Los datos extraídos se pasan por la [transformadora de datos](https://gitlab.com/anticoding/ojosanciones-transformer) del proyecto para unificarlos con las otras fuentes y alimentar el [sitio web oficial](https://ojosanciones.sociedad.info) del proyecto.
