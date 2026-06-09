// Apps Script: 1 Google Sheet trung tâm cho TẤT CẢ landing page.
// Deploy: Extensions > Apps Script > dán > Deploy > Web app > Execute as Me > Anyone. Copy URL /exec.
const SHEET="Leads";
const COLS=["ts","lp_id","event_id","name","phone","address","qty","fav","utm_source","utm_medium","utm_campaign","utm_content","utm_term","fbc","fbp","ttclid","ttp","ip","url","ua"];
function doPost(e){
  var lock=LockService.getScriptLock(); lock.waitLock(20000);
  try{
    var d={}; try{d=JSON.parse(e.postData.contents);}catch(_){d=e.parameter||{};}
    var ss=SpreadsheetApp.getActiveSpreadsheet(); var sh=ss.getSheetByName(SHEET)||ss.insertSheet(SHEET);
    if(sh.getLastRow()===0) sh.appendRow(COLS);
    // dedup theo event_id
    if(d.event_id){var ids=sh.getRange(2,3,Math.max(sh.getLastRow()-1,1),1).getValues().flat();
      if(ids.indexOf(d.event_id)>-1) return ok({dedup:true});}
    sh.appendRow(COLS.map(c=> c==="ts"?(d.ts||new Date().toISOString()):(d[c]||"")));
    return ok({saved:true});
  }catch(err){return ok({error:String(err)});}finally{lock.releaseLock();}
}
function ok(o){return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);}
function doGet(){return ok({status:"LP-Ops unified endpoint live"});}
