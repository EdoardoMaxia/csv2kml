**Obiettivo**

Un tool (web app) che, dato un CSV, permette di:

- **Generare punti KML:**

  - scegliere quali colonne mappare come:

    - nome punto

    - latitudine

    - longitudine

    - descrizione (opzionale, composta da più colonne)

  - configurare stile (icona, colore, dimensione)

- **Generare collegamenti tra punti (linee):**

  - definire quali colonne rappresentano:

    - ID Punto A / Punt A lat / Punt A lon

    - ID Punto B / Punt B lat / Punt B lon

  - configurare stile della linea (colore, spessore, tratteggio)

  - definire eventuali informazioni associate al link

- **Salvare configurazioni (mapping + stili) per riuso su CSV simili.**

**Attori**

- User (engineer / planner di rete / smanettone)

**Casi d’uso principali (MVP - Minimum Viable Product)**

1. Caricare un CSV e visualizzarne l’anteprima.

2. Mappare colonne CSV → campi KML per i punti.

3. Mappare colonne CSV → campi KML per i collegamenti.

4. Configurare stile punti e linee.

5. Generare e scaricare il file KML.

6. Salvare e ricaricare una configurazione di mapping.