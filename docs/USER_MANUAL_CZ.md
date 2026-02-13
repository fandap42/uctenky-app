# Uživatelský manuál - Systém správy účtenek (4FIS)

## Obsah

1. [Úvod](#úvod)
2. [Přihlášení a první kroky](#přihlášení-a-první-kroky)
3. [Sekce pro uživatele (Member)](#sekce-pro-uživatele-member)
4. [Sekce pro vedoucí (Head)](#sekce-pro-vedoucí-head)
5. [Sekce pro Finance / Adminy](#sekce-pro-finance--adminy)
6. [Pravidla a workflow](#pravidla-a-workflow)
7. [Často kladené dotazy (FAQ)](#často-kladené-dotazy-faq)

---

## Úvod

Aplikace **4FIS Účtenky** slouží ke správě výdajových žádostí a účtenek v rámci studentské organizace. Umožňuje členům podávat žádosti o proplacení nákladů, nahrávat účtenky a vedení organizace tyto žádosti schvalovat a spravovat.

---

## Přihlášení a první kroky

### Způsoby přihlášení

**Slack** - přihlášení pomocí 4fis Slack účtu.

### Onboarding (první přihlášení)

Při prvním přihlášení se zobrazí **uvítací dialog**, ve kterém mohou vyplnit údaje o bankovním účtu:

1. **Číslo účtu** - povinné (1-10 číslic).
2. **Kód banky** - vyberte svou banku ze seznamu.
3. **Předčíslí** - nepovinné (1-6 číslic).

Tyto údaje jsou **šifrovány** (AES-256-GCM) a slouží k vygenerování QR kódů pro platby.

> Bankovní údaje lze později doplnit nebo změnit v sekci **Nastavení**.

---

## Sekce pro uživatele (Member)

Běžný člen organizace má přístup k následujícím funkcím:

### Dashboard (Přehled)

Po přihlášení se zobrazí hlavní přehled s vašimi žádostmi.

### Vytvoření nové žádosti

1. Klikněte na tlačítko **Nová žádost**.
2. Vyplňte formulář:
   - **Sekce** - vyberte sekci, pod kterou žádost spadá.
   - **Účel** - popište, na co budou peníze použity.
   - **Rozpočet** - zadejte předpokládanou částku v Kč.
   - **Cílové datum** - datum, ke kterému peníze potřebujete.
3. Odešlete žádost ke schválení.

> **Důležité:** Žádost musí být vytvořena **minimálně 7 dní** před cílovým datem.

### Stavy žádosti

| Stav | Význam |
|------|--------|
| **Čeká na schválení** | Žádost byla odeslána a čeká na posouzení administrátorem. |
| **Schváleno** | Žádost byla schválena. Nyní můžete nakupovat a nahrávat účtenky. |
| **Ověřování** | Účtenky byly odeslány k ověření administrátorem. |
| **Dokončeno** | Žádost byla uzavřena a vyřízena. |
| **Zamítnuto** | Žádost byla zamítnuta. |

### Nahrání účtenek

Po schválení žádosti můžete nahrávat účtenky:

1. Otevřete schválenou žádost.
2. Klikněte na **Přidat účtenku**.
3. Vyplňte údaje:
   - **Obchod** - název obchodu.
   - **Datum** - datum nákupu (uvedené na účtence).
   - **Částka** - celková částka na účtence.
   - **Typ výdaje** - materiál nebo služba.
   - **Fotografie účtenky** - nahrajte fotografii nebo sken.
4. Po nahrání všech účtenek klikněte na **Odeslat k ověření**.

#### Podporované formáty souborů

- JPG, PNG, GIF, WebP, HEIC, HEIF, PDF
- Maximální velikost souboru: **20 MB**
- Formát HEIC (iPhone fotografie) je automaticky převeden na JPEG.

### Nastavení

V sekci **Nastavení** můžete:

- Upravit údaje bankovního účtu.

---

## Sekce pro Finance / Adminy

Uživatelé s rolí **ADMIN** mají plný přístup ke všem funkcím aplikace.

### Správa žádostí

- **Schvalování/zamítání** žádostí od členů.
- **Přidání poznámky** k žádosti (důvod zamítnutí apod.).
- **Změna stavu** žádosti v celém workflow.
- **Označení jako založeno** - po fyzickém založení dokumentů.

### Ověřování účtenek

Když člen odešle účtenky k ověření:

1. Otevřete žádost ve stavu **Ověřování**.
2. Zkontrolujte každou účtenku:
   - Je datum na účtence platné?
   - Je částka čitelná a odpovídá?
   - Je viditelný název obchodu?
   - Je na účtence potvrzení o platbě **v hotovosti**?
3. Schvalte nebo zamítněte jednotlivé účtenky.
4. Po ověření všech účtenek posuňte žádost do stavu **Dokončeno**.

### QR platby

U dokončených žádostí lze vygenerovat **QR kód pro platbu**:

1. Otevřete dokončenou žádost.
2. Klikněte na tlačítko **QR platba**.
3. Systém vygeneruje QR kód s bankovními údaji žadatele a částkou k proplacení.
4. QR kód můžete použít k úhradě v bankovní aplikaci.

### Pokladna (Cash Register)

Sekce **Pokladna** slouží ke sledování finančních toků organizace:

- **Vklady** - evidence příjmů do pokladny.
- **Účtenky** - přehled všech proplacených výdajů.
- **Chyby dluhu** - evidence účetních nesrovnalostí.
- **Hotovost v pokladně** - aktuální stav fyzické hotovosti.

#### Výpočty v pokladně

| Hodnota | Výpočet |
|---------|---------|
| Počáteční zůstatek | Předchozí vklady - Předchozí proplacené účtenky |
| Aktuální zůstatek | Celkové vklady - Celkové proplacené výdaje |
| Reálná hotovost | Aktuální zůstatek - Chyby dluhu - Hotovost v pokladně |

Data v pokladně jsou organizována podle **semestrů**.

### Správa uživatelů

- Zobrazení seznamu všech uživatelů.
- Přidělování rolí a sekcí.
- Vytváření a mazání uživatelských účtů.

### Rozpočet

- Přehled výdajů po sekcích za aktuální semestr.
- Celkové součty rozpočtů.

---

## Pravidla a workflow

### Workflow žádosti (krok za krokem)

```
Člen vytvoří žádost
        |
        v
  ČEKÁ NA SCHVÁLENÍ
        |
   Admin posoudí
      /       \
     v         v
 SCHVÁLENO   ZAMÍTNUTO
     |
     v
 Člen nakoupí a nahraje účtenky
     |
     v
 Člen odešle k ověření
     |
     v
   OVĚŘOVÁNÍ
     |
   Admin zkontroluje účtenky
     |
     v
  DOKONČENO
     |
   Admin vygeneruje QR platbu
     |
     v
  PROPLACENO
```

### Kritická pravidla

#### 1. Minimální lhůta pro vytvoření žádosti

**Žádost musí být vytvořena minimálně 7 dní před cílovým datem nákupu.**

Toto pravidlo zajišťuje, že vedení má dostatek času na posouzení a schválení žádosti.

#### 2. Platby výhradně v hotovosti

**Veškeré platby v rámci schválených žádostí musí probíhat výhradně v hotovosti.**

- Platby kartou, převodem nebo jinými způsoby **nejsou akceptovány**.
- Na účtence musí být jasně viditelné potvrzení o platbě v hotovosti.

#### 3. Pravidla pro účtenky

Každá nahraná účtenka musí splňovat následující podmínky:

| Pravidlo | Popis |
|----------|-------|
| **Datum na účtence** | Datum na účtence **nesmí být starší** než datum vytvoření žádosti (ticketu). Účtenka z doby před podáním žádosti nebude akceptována. |
| **Čitelné datum** | Na fotografii účtenky musí být jasně čitelné datum nákupu. |
| **Čitelná částka** | Celková částka musí být na fotografii čitelná a musí odpovídat zadané hodnotě. |
| **Název obchodu** | Na účtence musí být čitelný název obchodu nebo prodejce. |
| **Potvrzení o hotovostní platbě** | Na účtence musí být viditelný údaj potvrzující, že platba proběhla v hotovosti (např. "Hotově", "CASH" apod.). |

#### 4. Kvalita fotografie účtenky

- Fotografie musí být ostrá a dobře osvětlená.
- Všechny požadované údaje (datum, částka, obchod, způsob platby) musí být čitelné.
- Podporované formáty: JPG, PNG, GIF, WebP, HEIC, HEIF, PDF.
- Maximální velikost: 20 MB.

---

## Často kladené dotazy (FAQ)

### Jak změním svůj bankovní účet?

Přejděte do **Nastavení** v levém menu a aktualizujte údaje bankovního účtu.

### Co dělat, když mi byla žádost zamítnuta?

Zkontrolujte poznámku administrátora u zamítnuté žádosti. Upravte žádost podle připomínek a vytvořte novou.

### Mohu nahrát více účtenek k jedné žádosti?

Ano, k jedné žádosti můžete nahrát libovolný počet účtenek. Součet částek na účtenkách by neměl překročit schválený rozpočet.

### Jaké formáty fotografií jsou podporovány?

JPG, PNG, GIF, WebP, HEIC (iPhone), HEIF a PDF. Maximální velikost jednoho souboru je 20 MB. Fotografie z iPhone (HEIC) jsou automaticky převedeny na JPEG.

### Jak dlouho trvá schválení žádosti?

Doba schválení závisí na vytíženosti administrátorů. Žádost vytvořte s dostatečným předstihem (minimálně 7 dní).

### Co znamenají zkratky semestrů?

- **ZS** = Zimní semestr (září - leden)
- **LS** = Letní semestr (únor - srpen)
