# namnskyltar

Google Apps Script som skapar namnskylt-presentationer (Google Presentationer)
från en namnlista i Google Sheets, baserat på mallen "Mall, namnskylt".

Scriptet körs helt inne i Google (bundet till Sheet-filen med namnen) – inga
namn eller elevlistor laddas någonsin upp till det här repot.

## Installation

1. Öppna Google Sheet-filen med namnlistan (namn i kolumn A, format
   "Efternamn, Förnamn", inga rubrikrader).
2. Tillägg (Extensions) > Apps Script.
3. Klistra in innehållet i [`Namnskyltar.gs`](./Namnskyltar.gs) i `Code.gs`.
4. Spara och ladda om Sheet-fliken i webbläsaren.
5. Sheetet har en flik per klass/grupp – klicka på fliken för den klass du
   vill skapa namnskyltar för (scriptet läser den flik som är öppen/aktiv).
6. Använd den nya menyn **Namnskyltar > Skapa namnskyltar**.

Standardinställningarna (kolumn A, inga rubrikrader, aktiv flik) matchar
strukturen på klasslistorna. Om du någon gång ändrar strukturen kan du
justera konstanterna i `CONFIG`-blocket överst i scriptet.

Scriptet skapar då en ny kopia av mall-presentationen (mallen i sig ändras
aldrig) med en namnskylt-bild per namn i listan, och visar en länk till den
färdiga presentationen.
