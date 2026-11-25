-- Material de apoyo del ejercicio (secuencia de eventos, variables sugeridas y una
-- sugerencia), que ya existía en Base44 aunque no figuraba en el esquema de la entidad.
ALTER TABLE EJERCICIO ADD COLUMN apoyo JSON NULL AFTER consigna_html;
