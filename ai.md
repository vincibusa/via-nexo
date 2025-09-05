# Sistema AI di Via Nexo

## 📋 Panoramica Generale

Via Nexo è una piattaforma turistica avanzata che utilizza l'Intelligenza Artificiale per fornire raccomandazioni personalizzate agli utenti. Il sistema combina diverse tecnologie AI moderne per creare un assistente turistico conversazionale capace di comprendere le richieste degli utenti e fornire suggerimenti mirati.

L'architettura è basata su un flusso che parte dall'interfaccia utente React, passa attraverso API routes specializzate, utilizza agenti AI di OpenAI per processare le richieste, e accede a un database Supabase con capacità di ricerca vettoriale per recuperare informazioni sui partner turistici.

Il sistema è progettato per essere scalabile, sicuro e performante, con gestione avanzata degli errori e meccanismi di rate limiting per prevenire abusi.

---

## 🤖 Gli Agenti AI

Il cuore del sistema è rappresentato da due agenti AI specializzati, costruiti utilizzando l'OpenAI Agents SDK e alimentati dal modello GPT-5-mini.

### Search Agent - L'Esperto di Ricerca

Il Search Agent è specializzato nella ricerca intelligente di partner turistici. Questo agente è stato progettato specificamente per interpretare richieste di ricerca complesse e trovare i migliori hotel, ristoranti, tour e servizi di trasporto che corrispondono alle esigenze dell'utente.

Le sue capacità principali includono la comprensione di query in linguaggio naturale, l'applicazione intelligente di filtri basati su preferenze espresse o implicite, e la capacità di spiegare perché ha scelto determinati risultati. Quando una richiesta è troppo vaga o ambigua, l'agente sa porre domande di chiarimento per ottenere informazioni più specifiche.

L'agente utilizza tecniche di ricerca semantica, che significa che può comprendere il significato dietro le parole dell'utente, non solo le parole letterali. Ad esempio, se un utente cerca "un posto romantico per cena", l'agente capisce che sta cercando un ristorante con atmosfera intima, probabilmente con buona valutazione e prezzo medio-alto.

### Chat Agent - L'Assistente Conversazionale

Il Chat Agent è l'interfaccia conversazionale principale del sistema. È progettato per essere amichevole, professionale e molto competente in materia di viaggi e turismo. La sua personalità è stata calibrata per essere calorosa ed entusiasta, sempre pronta ad aiutare con pianificazioni di viaggio complesse.

Questo agente mantiene il contesto della conversazione, ricordando quello che è stato detto nelle interazioni precedenti e utilizzando queste informazioni per fornire risposte sempre più personalizzate. Può gestire richieste complesse che richiedono più passaggi, come pianificare un intero weekend romantico che include hotel, ristorante e attività.

L'agente è anche capace di adattare il suo stile di comunicazione alle preferenze dell'utente, fornendo suggerimenti per diverse tipologie di viaggiatori: dai backpacker ai viaggiatori luxury, dalle famiglie alle coppie.

---

## 🔧 Strumenti Specializzati

Gli agenti AI hanno accesso a due strumenti potenti che permettono loro di accedere e processare le informazioni sui partner turistici.

### Strumento di Ricerca Vettoriale

Questo strumento permette agli agenti di effettuare ricerche semantiche nel database. Quando l'utente formula una richiesta, il sistema converte la richiesta in un "embedding vettoriale" - una rappresentazione matematica del significato della richiesta. Questo embedding viene poi confrontato con gli embedding di tutti i partner turistici nel database per trovare le corrispondenze più significative.

La potenza di questo approccio sta nel fatto che può trovare corrispondenze basate sul significato, non solo sulle parole esatte. Ad esempio, una ricerca per "colazione abbondante" può trovare hotel che descrivono il loro buffet come "ricco e variegato" anche se non usano la parola "abbondante".

### Strumento di Filtri Tradizionali

Questo strumento complementa la ricerca semantica permettendo agli agenti di applicare filtri precisi e tradizionali. Può filtrare per tipo di partner (hotel, ristorante, tour, shuttle), posizione geografica, valutazione minima, fascia di prezzo, e servizi specifici.

Questo è particolarmente utile quando l'utente ha requisiti molto specifici, come "solo hotel 4 stelle a Roma sotto i 200 euro" o "ristoranti vegetariani a Firenze con valutazione superiore a 4.5".

---

## 🎯 Sistema RAG - Generazione Aumentata da Recupero

Il sistema implementa una pipeline RAG sofisticata che combina il recupero di informazioni pertinenti con la generazione di risposte personalizzate.

### Come Funziona la Pipeline

Il processo inizia quando l'utente fa una domanda o richiesta. Il sistema prima analizza e pulisce la richiesta, estraendo i concetti chiave e identificando il tipo di informazione richiesta.

Successivamente, genera un embedding vettoriale della richiesta utilizzando il modello di embedding di OpenAI. Questo embedding viene utilizzato per cercare nel database i partner più rilevanti utilizzando tecniche di similarità vettoriale.

Una volta recuperati i partner pertinenti, il sistema costruisce un contesto ricco che include non solo i dati dei partner, ma anche le preferenze dell'utente espresse in precedenza e la storia recente della conversazione.

Infine, tutto questo contesto viene fornito al modello GPT-5-mini che genera una risposta personalizzata, spiegando non solo quali partner raccomandare, ma anche perché sono adatti alle esigenze specifiche dell'utente.

### Personalizzazione Intelligente

Il sistema RAG tiene conto di diversi fattori per personalizzare le risposte:

- Le preferenze esplicite dell'utente (budget, interessi, stile di viaggio)
- Il contesto conversazionale (cosa è stato discusso in precedenza)
- I pattern di comportamento impliciti (tipi di luoghi ricercati frequentemente)
- Il momento e la stagione (per raccomandazioni contestuali)

---

## 📊 Ricerca Vettoriale e Embeddings

### Il Potere degli Embeddings

Il sistema utilizza embeddings vettoriali per rappresentare sia le richieste degli utenti che le descrizioni dei partner turistici in uno spazio matematico multidimensionale a 1536 dimensioni. Ogni dimensione cattura un aspetto diverso del significato del testo.

Questa rappresentazione permette al sistema di capire relazioni semantiche complesse. Ad esempio, "luna di miele" e "romantico" saranno vicini nello spazio vettoriale, così come "economico" e "budget-friendly".

### Database Vettoriale con pgvector

Il database utilizza l'estensione pgvector di PostgreSQL per gestire gli embeddings in modo efficiente. Ogni hotel, ristorante, tour e servizio di shuttle ha il suo embedding vettoriale che rappresenta le sue caratteristiche uniche.

La ricerca vettoriale funziona calcolando la similarità coseno tra l'embedding della richiesta dell'utente e gli embeddings dei partner nel database. I partner con la similarità più alta sono considerati i più rilevanti.

### Funzionalità Avanzate di Ricerca

Il sistema può gestire ricerche complesse che combinano elementi semantici e filtri tradizionali. Ad esempio, può cercare semanticamente "posto tranquillo per rilassarsi" e contemporaneamente applicare filtri geografici per "Roma" e filtri di prezzo per "medio-alto".

La soglia di similarità è configurabile, permettendo di bilanciare precisione e ricchezza dei risultati. Una soglia più alta restituisce risultati molto pertinenti ma potenzialmente in numero minore, mentre una soglia più bassa offre più opzioni ma con rilevanza variabile.

---

## 🚀 Interfacce API Specializzate

Il sistema espone cinque API endpoint principali, ciascuno ottimizzato per casi d'uso specifici.

### API di Conversazione Chat

Questa è l'API principale utilizzata dall'interfaccia chat dell'utente. Gestisce conversazioni complete includendo tutto il contesto necessario per mantenere una discussione coerente e personalizzata.

L'API accetta una serie di messaggi che rappresentano la conversazione fino a quel momento, insieme a preferenze opzionali dell'utente. Restituisce risposte generate dall'AI che tengono conto di tutto il contesto fornito.

### API di Ricerca Intelligente

Questa API è ottimizzata per ricerche specifiche e dirette. È ideale quando l'utente ha già un'idea chiara di cosa sta cercando e vuole risultati mirati senza una conversazione estesa.

Accetta parametri di ricerca strutturati e utilizza l'agente di ricerca per trovare i migliori match, fornendo anche spiegazioni dettagliate delle scelte fatte.

### API di Ricerca Vettoriale

Questa è un'API più tecnica che espone direttamente le funzionalità di ricerca vettoriale del sistema. Offre due modalità: ricerca puramente semantica basata su similarità vettoriale, e ricerca filtrata che combina embeddings con filtri tradizionali.

È particolarmente utile per integrazioni avanzate o per sviluppatori che vogliono un controllo più granulare sui parametri di ricerca.

### API RAG Avanzata

Questa API implementa la pipeline RAG completa con tutte le sue sofisticazioni. È l'opzione più potente ma anche la più costosa computazionalmente, ideale per query complesse che richiedono analisi approfondite e risposte molto elaborate.

Include funzionalità avanzate come caching intelligente delle query frequenti e gestione del contesto conversazionale esteso.

### API di Generazione Embeddings

Questa API utility permette la generazione diretta di embeddings per testi forniti. È utile per testing, debugging, o per applicazioni che vogliono pre-processare contenuti per ottimizzare le ricerche successive.

---

## 🗄️ Architettura del Database

### Schema Unificato Intelligente

Il database è strutturato con quattro tabelle specializzate - una per ogni tipo di partner (hotel, ristoranti, tour, shuttle) - che vengono unificate attraverso una VIEW PostgreSQL. Questa architettura permette di mantenere la specializzazione dei dati (ogni tabella può avere campi specifici per il suo tipo di business) mentre offre un'interfaccia unificata per le ricerche.

Attualmente il database contiene:

- 14 hotel rappresentativi di diverse fasce di prezzo e località italiane
- 12 ristoranti che spaziano da street food a stelle Michelin
- 11 tour che coprono esperienze culturali, gastronomiche e d'avventura
- 5 servizi di shuttle per trasporti aeroportuali e intercity

### Ottimizzazioni per le Performance

Ogni tabella ha indici specializzati sia per la ricerca vettoriale (usando indici ivfflat ottimizzati per la similarità coseno) che per i filtri tradizionali (indici B-tree su location, rating, price_range).

La funzione PostgreSQL `match_partners` è ottimizzata per eseguire ricerche vettoriali efficienti, restituendo non solo i risultati ma anche il punteggio di similarità per ogni match.

---

## ⚡ Sicurezza e Gestione degli Errori

### Sistema di Rate Limiting Avanzato

Il sistema implementa un rate limiting sofisticato che traccia le richieste per indirizzo IP. Diversi endpoint hanno limiti diversi basati sulla loro intensità computazionale: le API di chat hanno limiti più generosi (100 richieste per 15 minuti), mentre l'API RAG ha limiti più restrittivi (50 richieste per 15 minuti) data la sua natura resource-intensive.

Il sistema di rate limiting è intelligente e include funzionalità di reset automatico delle finestre temporali e cleanup della memoria per prevenire memory leaks.

### Gestione Errori Categorizzata

Il sistema categorizza gli errori e fornisce risposte appropriate per ogni categoria:

**Errori di Timeout**: Quando le operazioni richiedono troppo tempo, il sistema restituisce messaggi user-friendly suggerendo di semplificare la query.

**Errori di Rate Limiting**: Quando gli utenti superano i limiti di richieste, ricevono messaggi chiari sui tempi di attesa.

**Errori di Autenticazione**: Problemi con le API key OpenAI vengono gestiti senza esporre dettagli tecnici sensibili.

**Errori di Database**: Problemi di connettività o query vengono mascherati con messaggi generici per non rivelare dettagli dell'architettura interna.

### Validazione Rigorosa

Tutti gli input vengono validati utilizzando schemi Zod rigorosi che controllano non solo la presenza dei campi richiesti ma anche i loro formati, lunghezze, e valori permessi. Questo previene attacchi injection e garantisce la coerenza dei dati.

---

## 🎯 Integrazione Frontend

### Gestione dello Stato della Conversazione

Il frontend utilizza un hook React personalizzato che gestisce tutto lo stato della conversazione. Questo include i messaggi scambiati, lo stato di caricamento, eventuali errori, e funzionalità avanzate come il retry automatico e l'annullamento delle richieste.

L'hook mantiene riferimenti agli ultimi messaggi utente per permettere funzionalità di retry, e gestisce l'abort delle richieste HTTP per prevenire problemi quando l'utente cambia pagina o fa nuove richieste prima che le precedenti siano completate.

### User Experience Ottimizzata

L'interfaccia utente è progettata per fornire feedback immediato e gestire elegantemente gli stati di errore. Quando si verificano errori, invece di fallire silenziosamente o andare in loop infiniti, il sistema mostra messaggi chiari all'utente con opzioni per riprovare o resettare la conversazione.

Gli indicatori di caricamento sono contestuali e informativi, mostrando all'utente cosa sta succedendo in background ("Elaborando...", "Cercando partner...", ecc.).

---

## 📈 Performance e Ottimizzazioni

### Metriche di Performance

Il sistema è ottimizzato per diverse tipologie di operazioni:

**Ricerca Vettoriale**: Mediamente completa in 200-400ms, ottimizzata per query singole con risultati immediati.

**Pipeline RAG Completa**: Richiede 800-1500ms ma fornisce risposte molto più elaborate e contestualizzate.

**API Chat Standard**: Bilancia velocità e qualità con tempi di risposta di 500-1000ms.

**Generazione Embeddings**: Operazione veloce di 100-200ms, spesso utilizzata come building block per operazioni più complesse.

### Strategie di Caching Intelligente

Il sistema implementa diverse strategie di caching:

**Query Caching**: Le query RAG più comuni vengono cacheate per 15 minuti, riducendo significativamente i tempi di risposta per richieste simili.

**Embedding Caching**: Gli embeddings già generati vengono mantenuti in cache per evitare chiamate ripetute all'API OpenAI.

**Rate Limit Tracking**: Il tracking dei limiti utilizza strutture dati in-memory ottimizzate con cleanup automatico per prevenire memory leaks.

---

## 🔄 Flusso Operativo Completo

### Dal Click dell'Utente alla Risposta AI

Il processo inizia quando l'utente digita un messaggio nell'interfaccia chat. Il messaggio viene immediatamente validato lato client e poi inviato attraverso l'hook useChat all'API di conversazione.

L'API riceve il messaggio, lo valida rigorosamente, applica rate limiting, e poi lo inoltra all'agente AI appropriato insieme a tutto il contesto conversazionale necessario.

L'agente AI analizza la richiesta, decide quali strumenti utilizzare, ed esegue le ricerche necessarie nel database. Se serve una ricerca vettoriale, genera prima l'embedding della query e poi cerca i partner più simili.

I risultati vengono processati dall'agente che genera una risposta personalizzata utilizzando GPT-5-mini, tenendo conto non solo dei dati recuperati ma anche delle preferenze dell'utente e del contesto della conversazione.

La risposta finale viene inviata al frontend che aggiorna immediatamente l'interfaccia utente, mostrando la risposta dell'AI in un bubble di chat appropriato.

### Gestione degli Errori in Ogni Fase

Ogni fase del processo ha gestione degli errori dedicata. Se qualsiasi passaggio fallisce, il sistema non va in crash ma restituisce errori informativi che permettono all'utente di capire cosa è successo e cosa può fare per risolvere.

Il frontend è particolarmente robusto nella gestione degli errori, offrendo sempre all'utente opzioni per riprovare, resettare la conversazione, o contattare il supporto.

---

## 🛡️ Sicurezza e Privacy

### Protezione dei Dati Sensibili

Il sistema è progettato per non memorizzare o loggare informazioni personali degli utenti. Le conversazioni non vengono salvate permanentemente e i dati di rate limiting sono aggregati per IP senza tracciare comportamenti individuali specifici.

Tutti i parametri di configurazione sensibili (API keys, connection strings) sono gestiti attraverso environment variables e non sono mai esposti nel codice o nei log.

### Validazione e Sanitizzazione

Ogni input viene rigorosamente validato e sanitizzato prima di essere processato. Questo include controlli sulla lunghezza dei messaggi, filtri per contenuti potenzialmente dannosi, e validazione dei tipi di dati.

Le query al database utilizzano sempre parametrized queries per prevenire SQL injection, e tutti i risultati vengono sanitizzati prima di essere restituiti all'utente.

---

## 🚧 Considerazioni e Limitazioni Attuali

### Limitazioni Tecniche

Il sistema attualmente richiede una API key OpenAI valida per funzionare, il che comporta costi operativi che crescono con l'uso. Il database contiene un dataset limitato di 42 partner totali, sufficiente per dimostrazioni ma che richiederebbe espansione per un uso produttivo.

Le conversazioni sono limitate a 50 messaggi totali e il sistema mantiene in memoria solo gli ultimi 5 messaggi per il contesto, per bilanciare performance e memoria utilizzata.

### Considerazioni di Scalabilità

Il rate limiting attuale è implementato in-memory e non è condiviso tra istanze multiple dell'applicazione. Per un deployment produttivo su larga scala sarebbe necessario un sistema di rate limiting distribuito.

Gli indici del database sono ottimizzati per il dataset attuale, ma potrebbero necessitare di tuning per dataset significativamente più grandi.

I costi delle API OpenAI potrebbero diventare significativi con volumi alti di utilizzo, specialmente per le operazioni RAG che richiedono più token.

---

## 🔮 Visione Futura

### Sviluppi Pianificati

Il sistema è progettato per essere estensibile e migliorabile. I prossimi sviluppi potrebbero includere supporto multilingue con embeddings specializzati per diverse lingue, sistemi di caching più sofisticati utilizzando Redis per la distribuzione, e analytics avanzate per comprendere meglio i pattern di utilizzo.

La personalizzazione potrebbe essere migliorata con profili utente persistenti che apprendono dalle interazioni passate, e il sistema potrebbe essere esteso per supportare aggiornamenti in tempo reale quando nuovi partner vengono aggiunti al database.

### Potenziale di Integrazione

L'architettura modulare permette facile integrazione con altri sistemi esterni, come API di prenotazione, sistemi di pagamento, o piattaforme di recensioni. Ogni componente è progettato per essere indipendente e facilmente sostituibile o estendibile.

---

_Documento generato per Via Nexo Tourism Platform - Sistema AI avanzato per raccomandazioni turistiche personalizzate_
