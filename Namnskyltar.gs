/**
 * Namnskyltar – skapar namnskylts-presentation från namnlista i Google Sheets.
 *
 * INSTALLATION
 * 1. Öppna Google Sheet-filen med namnlistan.
 * 2. Tillägg (Extensions) > Apps Script.
 * 3. Klistra in hela detta innehåll i Code.gs (ersätt det som finns där).
 * 4. Justera konstanterna i CONFIG-blocket nedan vid behov.
 * 5. Spara (Ctrl/Cmd+S) och stäng Apps Script-fliken.
 * 6. Ladda om Sheet-fliken i webbläsaren. En ny meny "Namnskyltar" dyker upp.
 * 7. Namnskyltar > Skapa namnskyltar.
 *
 * Första gången du kör scriptet ber Google om behörighet (det är ditt eget
 * Google-konto som kör det, ingenting skickas till någon extern tjänst).
 */

// ----------------- CONFIG -----------------

// ID för Google Presentations-mallen "Mall, namnskylt".
// Hittas i adressfältet när mallen är öppen:
// https://docs.google.com/presentation/d/DETTA_ÄR_ID:T/edit
var TEMPLATE_PRESENTATION_ID = '1M1emr26O2jk7SZX5oU0Ih54DGPTZe7yWWfYM4YBfBK8';

// Mapp i Drive dit nya namnskylt-presentationer ska sparas.
// Lämna tom sträng ('') för att spara i samma mapp som mallen ligger i.
var DEST_FOLDER_ID = '11gBU3E2qK6csBEp7VtWcq257SjxzttZq';

// Namnet på fliken i Sheet:et som listan står i. Tom sträng = den flik
// som är aktiv (öppen) när du kör scriptet.
var SHEET_NAME = '';

// Vilken kolumn namnen står i (1 = A, 2 = B, osv).
// Namnen förväntas stå i formatet "Efternamn, Förnamn" (som i klasslistorna) –
// scriptet plockar automatiskt ut det som står efter kommat till namnskylten.
var NAME_COLUMN = 1;

// Hur många rader överst som är rubrikrader och ska hoppas över.
var HEADER_ROWS = 1;

// -------------------------------------------

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Namnskyltar')
    .addItem('Skapa namnskyltar', 'skapaNamnskyltar')
    .addToUi();
}

function skapaNamnskyltar() {
  var ui = SpreadsheetApp.getUi();
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

  var templateFile = DriveApp.getFileById(TEMPLATE_PRESENTATION_ID);
  var destFolder = DEST_FOLDER_ID
    ? DriveApp.getFolderById(DEST_FOLDER_ID)
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
  slide.getShapes().forEach(function (shape) {
    var textRange = shape.getText();
    if (textRange && textRange.asString().trim() !== '') {
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
