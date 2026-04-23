# Madrid Data Sources

## Highest-confidence MVP sources

### GTFS EMT Madrid
- url: `https://datos.emtmadrid.es/dataset/gtfs-de-emtmadrid`
- coverage: EMT bus network in Madrid city
- format: `GTFS ZIP`
- auth: no visible for static feed
- use: static planner base for EMT

### EMT MobilityLabs API
- url: `https://mobilitylabs.emtmadrid.es/`
- docs: `https://apidocs.emtmadrid.es/`
- coverage: dynamic EMT mobility services
- format: `REST API`
- auth: yes, app identifier
- use: realtime enrichment, EMT service context

### BiciMAD stations
- url: `https://datos.emtmadrid.es/dataset/estaciones-de-bicimad`
- coverage: BiciMAD station network
- format: `CSV / GeoJSON / KML / SHP`
- auth: no visible
- use: first mile and last mile layer

### Aparcamientos EMT
- url: `https://datos.emtmadrid.es/dataset/aparcamientos-emt`
- coverage: municipal parking managed by EMT
- format: `CSV / GeoJSON / KML / SHP`
- auth: no visible
- use: park-and-ride and car-plus-transit flows

### Incidencias Ayuntamiento de Madrid
- url: `http://datos.madrid.es/egob/catalogo/202062-0-trafico-incidencias-viapublica.xml`
- coverage: public roads and M-30 within Madrid
- format: `XML`
- auth: no visible
- use: urban disruption context

### DGT DATEX II incidents
- url: `https://nap.dgt.es/datex2/v3/dgt/SituationPublication/datex2_v36.xml`
- coverage: state road network with impact on Madrid access
- format: `DATEX II v3.6 XML`
- auth: no visible
- use: regional road context for entries and exits to Madrid

## Research lane

### CRTM open data
- url: `https://datos.crtm.es/`
- status: `research`
- use: potential expansion to regional network, Metro and Cercanias if reusable feeds exist

## Planned lane

### Taxi, moto sharing and other operators
- status: `planned`
- rule: integrate each provider via its own connector and license review

## Important note

El enlace externo del NAP compartido en la conversacion no se ha tratado como endpoint real porque no apunta a una API valida reusable. Las integraciones del NAP deben entrar como configuracion externa verificada y documentada por fuente.
