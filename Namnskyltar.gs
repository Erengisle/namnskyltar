/**
 * Namnskyltar – skapar namnskylts-presentation från namnlista i Google Sheets.
 *
 * INSTALLATION
 * 1. Öppna Google Sheet-filen med namnlistan.
 * 2. Tillägg (Extensions) > Apps Script.
 * 3. Klistra in hela detta innehåll i Code.gs (ersätt det som finns där).
 * 4. Justera konstanterna i CONFIG-blocket nedan vid behov (mall och mapp
 *    ställs INTE in här – det görs via menyn, se nedan).
 * 5. Spara (Ctrl/Cmd+S) och stäng Apps Script-fliken.
 * 6. Ladda om Sheet-fliken i webbläsaren. En ny meny "Namnskyltar" dyker upp.
 * 7. Namnskyltar > Ange mall och mapp... – klistra in länken till
 *    Presentations-mallen och (valfritt) länken till mappen där nya
 *    namnskylt-presentationer ska sparas. Sparas per Sheet-fil, så en
 *    kollega som får en kopia av detta Sheet gör bara detta steg själv –
 *    ingen kodändring behövs.
 * 8. Namnskyltar > Skapa namnskyltar.
 *
 * Första gången du kör scriptet ber Google om behörighet (det är ditt eget
 * Google-konto som kör det, ingenting skickas till någon extern tjänst).
 */

// ----------------- CONFIG -----------------

// Namnet på fliken i Sheet:et som listan står i. Tom sträng = den flik
// som är aktiv (öppen) när du kör scriptet.
var SHEET_NAME = '';

// Vilken kolumn namnen står i (1 = A, 2 = B, osv).
// Namnen förväntas stå i formatet "Efternamn, Förnamn" (som i klasslistorna) –
// scriptet plockar automatiskt ut det som står efter kommat till namnskylten.
var NAME_COLUMN = 1;

// Hur många rader överst som är rubrikrader och ska hoppas över.
var HEADER_ROWS = 0;

// -------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Namnskyltar')
    .addItem('Skapa namnskyltar', 'skapaNamnskyltar')
    .addItem('Ange mall och mapp...', 'angeMallOchMapp')
    .addToUi();
}

// Frågar efter länkarna till mall-presentationen och destinationsmappen,
// och sparar dem (som ID:n) i det här Sheet-dokumentets egna inställningar.
// Returnerar true om båda sparades, false om dialogen avbröts.
function angeMallOchMapp() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getDocumentProperties();

  var templateResp = ui.prompt(
    'Mall-presentation',
    'Klistra in länken till Google Presentations-mallen (t.ex. "Mall, namnskylt"):',
    ui.ButtonSet.OK_CANCEL
  );
  if (templateResp.getSelectedButton() !== ui.Button.OK) return false;

  var templateId = extractDriveId(templateResp.getResponseText());
  if (!templateId) {
    ui.alert('Kunde inte tolka länken till mallen. Kontrollera att du klistrat in hela URL:en och försök igen.');
    return false;
  }

  var folderResp = ui.prompt(
    'Mapp för nya namnskyltar',
    'Klistra in länken till mappen där nya namnskylt-presentationer ska sparas.\n' +
    'Lämna tomt för att spara i samma mapp som mallen ligger i.',
    ui.ButtonSet.OK_CANCEL
  );
  if (folderResp.getSelectedButton() !== ui.Button.OK) return false;

  var folderText = folderResp.getResponseText().trim();
  var folderId = '';
  if (folderText) {
    folderId = extractDriveId(folderText);
    if (!folderId) {
      ui.alert('Kunde inte tolka länken till mappen. Kontrollera att du klistrat in hela URL:en och försök igen.');
      return false;
    }
  }

  props.setProperty('TEMPLATE_ID', templateId);
  props.setProperty('DEST_FOLDER_ID', folderId);
  ui.alert('Sparat! Du kan nu köra "Skapa namnskyltar".');
  return true;
}

// Plockar ut Drive-filens/mappens ID ur en Google Drive/Docs/Slides-URL.
// Fungerar även om man klistrar in ett bart ID direkt.
function extractDriveId(input) {
  var s = String(input || '').trim();
  var m = s.match(/\/d\/([a-zA-Z0-9_-]{10,})/) || // .../d/<ID>/... (dokument/mall/sheet)
    s.match(/\/folders\/([a-zA-Z0-9_-]{10,})/) || // .../folders/<ID>
    s.match(/[?&]id=([a-zA-Z0-9_-]{10,})/); // ...?id=<ID>
  if (m) return m[1];
  if (/^[a-zA-Z0-9_-]{10,}$/.test(s)) return s; // redan ett bart ID
  return null;
}

function skapaNamnskyltar() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getDocumentProperties();
  var templateId = props.getProperty('TEMPLATE_ID');

  if (!templateId) {
    ui.alert('Du behöver ange mall och mapp först.');
    if (!angeMallOchMapp()) return;
    templateId = props.getProperty('TEMPLATE_ID');
    if (!templateId) return;
  }
  var destFolderId = props.getProperty('DEST_FOLDER_ID'); // kan vara '' (samma mapp som mallen)

  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = SHEET_NAME ? ss.getSheetByName(SHEET_NAME) : ss.getActiveSheet();

  if (!sheet) {
    ui.alert('Hittade ingen flik som heter "' + SHEET_NAME + '".');
    return;
  }

  var names = readNames(sheet);
  if (names.length === 0) {
    ui.alert(
      'Inga namn hittades i kolumn ' + columnToLetter(NAME_COLUMN) +
      ' (efter ' + HEADER_ROWS + ' rubrikrad(er)) på fliken "' + sheet.getName() + '".'
    );
    return;
  }

  var response = ui.prompt(
    'Namnge presentationen',
    'Vad ska den nya namnskylt-presentationen heta? (t.ex. klassnamn)',
    ui.ButtonSet.OK_CANCEL
  );
  if (response.getSelectedButton() !== ui.Button.OK) return;

  var outputName = response.getResponseText().trim();
  if (!outputName) {
    outputName = 'Namnskyltar ' + Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }

  var templateFile = DriveApp.getFileById(templateId);
  var destFolder = destFolderId
    ? DriveApp.getFolderById(destFolderId)
    : templateFile.getParents().next();

  var copyFile = templateFile.makeCopy(outputName, destFolder);
  var presentation = SlidesApp.openById(copyFile.getId());
  var slides = presentation.getSlides();

  if (slides.length === 0) {
    ui.alert('Mallen saknar bilder – avbryter.');
    return;
  }

  // Använd första bilden som mall-layout för alla namnskyltar,
  // ta bort övriga exempel-bilder i kopian.
  var masterSlide = slides[0];
  for (var i = slides.length - 1; i >= 1; i--) {
    slides[i].remove();
  }

  names.forEach(function (name) {
    var newSlide = masterSlide.duplicate();
    setNameOnSlide(newSlide, name);
  });

  // Ta bort den ursprungliga mall-bilden (den med exempel-namnet kvar).
  masterSlide.remove();

  presentation.saveAndClose();

  ui.alert(
    'Klart! ' + names.length + ' namnskyltar skapades.\n\nÖppna presentationen:\n' + copyFile.getUrl()
  );
}

function readNames(sheet) {
  var data = sheet.getDataRange().getValues();
  var names = [];
  for (var row = HEADER_ROWS; row < data.length; row++) {
    var raw = data[row][NAME_COLUMN - 1];
    if (raw !== null && raw !== undefined && String(raw).trim() !== '') {
      names.push(extractFirstName(raw));
    }
  }
  return names;
}

// Namnen i listan står som "Efternamn, Förnamn" – returnerar bara det
// som står efter kommat (förnamnet, ev. med mellannamn). Om det saknas
// komma antas formatet vara "Förnamn Efternamn" och första ordet används.
function extractFirstName(raw) {
  var s = String(raw).trim();
  var commaIndex = s.indexOf(',');
  if (commaIndex !== -1) {
    return s.substring(commaIndex + 1).trim();
  }
  return s.split(/\s+/)[0];
}

function setNameOnSlide(slide, name) {
  // getShapes() ger bara textbärande former (linjer/bilder har egna typer
  // och räknas inte hit) – på namnskylts-mallen är det de två textrutorna
  // med namnet, så det är säkert att alltid skriva in namnet i dem, oavsett
  // om de redan har text eller är tomma.
  slide.getShapes().forEach(function (shape) {
    var textRange = shape.getText();
    if (textRange) {
      textRange.setText(name);
    }
  });
}

function columnToLetter(column) {
  var letter = '';
  while (column > 0) {
    var remainder = (column - 1) % 26;
    letter = String.fromCharCode(65 + remainder) + letter;
    column = Math.floor((column - remainder - 1) / 26);
  }
  return letter;
}
