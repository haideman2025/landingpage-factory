/**
 * ONIIZ COD → Google Sheet — Apps Script Web App
 * Nhận đơn từ form landing page (POST) và ghi vào sheet "Orders".
 */
function doPost(e) {
  var lock = LockService.getScriptLock();
  try { lock.waitLock(5000); } catch (err) {}
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName('Orders') || ss.insertSheet('Orders');
    if (sh.getLastRow() === 0) {
      sh.appendRow(['Thoi gian', 'Landing Page', 'Ho ten', 'SDT', 'Dia chi', 'Mui', 'So luong']);
    }
    var p = (e && e.parameter) ? e.parameter : {};
    sh.appendRow([
      new Date(),
      p.lp || '',
      p.name || '',
      p.phone || '',
      p.address || '',
      p.fav || '',
      p.qty || ''
    ]);
    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
}

// (tuy chon) test nhanh khi mo URL bang GET
function doGet() {
  return ContentService.createTextOutput('ONIIZ COD endpoint OK');
}
