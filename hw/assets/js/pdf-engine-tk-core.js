/* TK2-inspired shared layout for all hardware PDFs. Loaded after pdf-engine-base.js. */
var TKPW=210,TKPH=297,TKM=16,TKCW=178,TKBOT=278;
var TKC={
  bg:[255,255,255],dark:[15,23,42],headerSoft:[186,230,253],
  panel:[248,250,252],panel2:[241,245,249],line:[226,232,240],
  blue:[2,132,199],cyan:[14,165,233],text:[15,23,42],soft:[71,85,105],
  muted:[100,116,139],green:[16,185,129],greenBg:[236,253,245],red:[220,38,38]
};
function tkMeta(){var n=(document.getElementById('studentName')||{}).value||'Unbenannt',r=(document.getElementById('studentClass')||{}).value||'',d=(document.getElementById('studentDate')||{}).value||'';return{name:n,cls:(!r||r==='B24'||r==='B25')?'9. Klasse':r,date:d||new Date().toLocaleDateString('de-CH')}}
function tkFile(v){return pdfSafeText(v||'Unbenannt').replace(/Ä/g,'Ae').replace(/Ö/g,'Oe').replace(/Ü/g,'Ue').replace(/ä/g,'ae').replace(/ö/g,'oe').replace(/ü/g,'ue').replace(/ß/g,'ss').replace(/[^a-zA-Z0-9]+/g,'_').replace(/^_+|_+$/g,'')||'Unbenannt'}
function tkRgb(pdf,c,kind){pdf[kind||'setTextColor'](c[0],c[1],c[2])}
function tkFooter(pdf,p){var y=288;tkRgb(pdf,TKC.line,'setDrawColor');pdf.setLineWidth(.2);pdf.line(TKM,y-4,TKPW-TKM,y-4);pdf.setFont('helvetica','normal');pdf.setFontSize(7);tkRgb(pdf,TKC.muted);pdf.text(pdfSafeText('IB2026 · Informatik 9. Klasse'),TKM,y);pdf.text('Seite '+p,TKPW-TKM,y,{align:'right'})}
function tkFrame(pdf,o,m,p){
  tkRgb(pdf,TKC.bg,'setFillColor');pdf.rect(-.5,-.5,TKPW+1,TKPH+1,'F');
  tkRgb(pdf,TKC.dark,'setFillColor');pdf.rect(0,0,TKPW,30,'F');
  pdf.setFont('helvetica','bold');pdf.setFontSize(8.5);tkRgb(pdf,TKC.headerSoft);pdf.text(pdfSafeText('INFORMATIK · 9. KLASSE · IT-HARDWARE'),TKM,10);
  pdf.setFontSize(16.5);pdf.setTextColor(255,255,255);var title=pdf.splitTextToSize(pdfSafeText(o.title||'Arbeitsblatt'),TKCW-4).slice(0,2);pdf.text(title,TKM,19);
  var y=38;pdf.setFont('helvetica','bold');pdf.setFontSize(12.5);tkRgb(pdf,TKC.text);pdf.text(pdfSafeText(m.name||'Unbenannt'),TKM,y);
  if(o.badge){pdf.setFontSize(8);tkRgb(pdf,o.badgeOk===false?TKC.red:TKC.green);pdf.text(pdfSafeText(o.badge),TKPW-TKM,y,{align:'right'});}
  y+=6.5;pdf.setFont('helvetica','normal');pdf.setFontSize(8.5);tkRgb(pdf,TKC.muted);var meta='Klasse: '+pdfSafeText(m.cls||'9. Klasse')+' · Datum: '+pdfSafeText(m.date||'');if(p>1)meta+=' · Fortsetzung';pdf.text(meta,TKM,y);
  var sub=pdfSafeText(o.subtitle||'Informatische Bildung · IT-Hardware');if(sub){pdf.text(pdf.splitTextToSize(sub,TKCW)[0]||'',TKPW-TKM,y,{align:'right'});}
  tkFooter(pdf,p);return 53;
}
function tkNew(pdf,o,m,s){if(s.page>0)pdf.addPage();s.page++;s.y=tkFrame(pdf,o,m,s.page)}
function tkSpace(pdf,o,m,s,h){if(s.y+h>TKBOT)tkNew(pdf,o,m,s)}
function tkPanel(pdf,x,y,w,h,c,stroke){tkRgb(pdf,c||TKC.panel2,'setFillColor');tkRgb(pdf,stroke||TKC.line,'setDrawColor');pdf.setLineWidth(.2);pdf.roundedRect(x,y,w,h,2,2,'FD')}
function tkSectionHeader(pdf,o,m,s,text){tkSpace(pdf,o,m,s,15);tkPanel(pdf,TKM,s.y,TKCW,11,TKC.panel2);pdf.setFont('helvetica','bold');pdf.setFontSize(10.5);tkRgb(pdf,TKC.blue);var line=pdf.splitTextToSize(pdfSafeText(text||'Abschnitt'),TKCW-8)[0]||'';pdf.text(line,TKM+4,s.y+7);s.y+=15}
