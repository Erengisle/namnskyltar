# namnskyltar

Google Apps Script som skapar namnskylt-presentationer (Google Presentationer)
från en namnlista i Google Sheets, baserat på mallen "Mall, namnskylt".

Scriptet körs helt inne i Google (bundet till Sheet-filen med namnen) – inga
namn eller elevlistor laddas någonsin upp till det här repot.

## Installation

1. Öppna Google Sheet-filen med namnlistan (kolumn med namn i formatet
   "Efternamn, Förnamn").
2. Tillägg (Extensions) > Apps Script.
3. Klistra in innehållet i [`Namnskyltar.gs`](./Namnskyltar.gs) i `Code.gs`.
4. Justera konstanterna i `CONFIG`-blocket överst om din flik/kolumn skiljer
   sig från standard (flik = aktiv flik, kolumn A, 1 rubrikrad).
5. Spara och ladda om Sheet-fliken i webbläsaren.
6. Använd den nya menyn **Namnskyltar > Skapa namnskyltar**.

Scriptet skapar då en ny kopia av mall-presentationen (mallen i sig ändras
aldrig) med en namnskylt-bild per namn i listan, och visar en länk till den
färdiga presentationen.
