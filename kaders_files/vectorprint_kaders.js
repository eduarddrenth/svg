/*
 
 ************************************************************
 * Ecmascript module voor positioneren van plaatjes in een        *
 * document, het toewijzen van plaatjes aan frames en het         *
 * rechthoekig of elliptisch uitsnijden van plaatjes.             *
 *                                                                *
 * Auteur: Eduard Drenth                                          *
 * Versie: 1.0                                                    *
 *                                                                *
 * Ontwikkeld voor Indepenent System Integrators door             *
 * VectorPrint, 2005.                                             *
 *                                                                *
 * VectorPrint                                                    *
 * Jhr. A.F. de S. Lohmanstraat 38                                *
 * 8802 RH Franeker                                               *
 * +31 517 390907                                                 *
 * eduarddrn@netscape.net                                         *
 *                                                                *
 ************************************************************
 
 DOCUMENTATIE
 
 LET OP VANAF 2005-09-10: VIEWBOX NIET ONDERSTEUND!!!
 LETOP ALLE MATEN IN DE SVG MOETEN ZONDER UNIT (MM, PT ETC) GEGEVEN WORDEN!!!!
 
 standaard attributen in voor svg elementen:
 
 bij het rootelement:
 ---------------------------------- 2005-09-10 ONGELDIG -----------------------------------------------------
 
 - @viewBox: bestaat uit x, y, width, height (bijv. viewBox="0 0 1200 1200").
 Hiermee leg je het coordinatenstelsel vast, alle maten in de svg worden t.o.v. dit
 stelsel berekend.
 
 Stel de volgende svg voor:
 <svg width="15mm" height="12mm" viewBox="0 0 150 120">
 <rect height="100" width="100" x="2" y="2" style="stroke:black;stroke-width:1px"/>
 </svg>
 De rectangle zal x/y coordinaten 0.2mm/0.2mm hebben en een width/height van 10mm/10mm
 
 Als in de svg harde maten (met een unit eraan bijv. 10mm of 8pt) gebruikt worden zullen de
 resultaten onvoorspelbaar zijn!
 
 ---------------------------------- EINDE ONGELDIG ------------------------------------------------------------
 
 attributen in de vectorprint namespace (zie ook de vectorprint.mod dtd uitbreiding voor svg):
 
 bij het root element:
 
 - @rulers, waarde "true" boven en linkerkant krijgen een lineaal
 - @clip, waarde "ellipse" of "rect" een uitsnijder wordt getoond
 - @guides, waarde "true" als een uitsnijder wordt gebruikt dan krijgt deze guides
 - @cliptool_inactive_style, een css style die aan de uitsnijder wordt toegekend als deze niet actief is
 - @cliptool_active_style, een css style die aan de uitsnijder wordt toegekend als deze actief is
 - @requestmethod: waarde "post" zal leiden tot een post request (zonder variabelen, raw data!!),
 waarde "get" (default) zal leiden tot een get request (met variabelen, beperkt tot 2083 characters voor IE,
 en tot 255 characters voor de querystring op sommige servers)
 - @url, als requestmethod gezet is stuur gegevens naar deze url, anders worden de gegevens in statustext gezet
 
 zowel "get" als "post" zullen een request vanuit de SVG Module sturen en de response ook in de module
 verwerken.
 
 bij een image element
 
 - @image, indien aanwezig dan wordt dit image opgenomen als te manipuleren image
 - @id, moet aanwezig zijn als @image gezet is, identificeert een image
 - @clipallowed, waarde "true" geeft aan dat dit image uitgesneden mag worden
 - @dpi, de originele resolutie
 - @mindpi, de minimale resolutie die is toegestaan
 - @resizeonclip, waarde "true" geeft aan dat bij uitsnijden de uitsnede proportioneel vergroot
 wordt tot de originele maat van het image. Dit vergroten gebeurt alleen als de maat van het image
 nog niet is gewijzigd.
 - @dragallowed, waarde "true" geeft aan dat dit image verplaatst mag worden
 - @dragstyle, een css style die aan het image wordt toegekend tijdens slepen
 - @frame_obligatory, dit image moet in een frame komen
 
 bij een rect element
 
 - @frame, indien aanwezig dan wordt deze rect opgenomen als een frame waarin een image gedropped kan worden
 - @id, moet aanwezig zijn als @frame gezet is, identificeert een frame
 - @fit, waarden "both", "width" of "height" geeft aan hoe een image wordt gescaled als het in een frame wordt gedropped
 - @align, waarden "left", "right", "center" horizontale positie van een image in een frame
 - @valign, waarden "top", "bottom", "middle" vertikale positie van een image in een frame
 - @highlightstyle, een css style die aan het frame wordt toegekend als een image boven het frame gesleept wordt
 - @multipleimages, sta meerdere images toe in een frame, dit sluit @align, @valign en @fit uit
 - @checksize, waarden "true" (default) er wordt gecontroleert of het image in het frame past, of "false"
 NB als een image uitgesneden is wordt gecontroleerd of het uitgesneden deel past.
 - @checkinside, waarden "true" (default) er wordt gecontroleert of delen van het image buiten het frame zitten, of "false"
 NB als een image uitgesneden is wordt gecontroleerd of het uitgesneden deel er buiten zit.
 - @image_obligatory, er moet een image in dit frame komen
 
 VERDERE FEATURES
 
 Als er een text element met id="status" wordt opgenomen dan zal hierin informatie getoond worden tijdens
 slepen, clippen en versturen van gegevens.
 
 Als er een text element met id="help" wordt opgenomen dan zal hierin helptext getoond worden.
 
 Aan het eind van de svg moeten deze script tags worden opgenomen:

   <script type="text/ecmascript" xlink:href="kaders_files/vectorprint_kaders.js"></script>
   <script type="text/ecmascript" xlink:href="kaders_files/featherajax.js"></script>
   <script type="text/ecmascript">initVp();</script>

 
 De gebruikte maten in de svg moeten zonder eenheden opgegeven worden, anders zijn er vreemde
 effecten te verwachten.
 
 De teruggestuurde gegevens zullen uitgedrukt zijn in pixels.
 Het formaat van de teruggestuurde informatie is als volgt (op de plek van <x> zal een geheel getal staan):
 
 <imageid>=x:<xcoordinaat>y:<xcoordinaat>width:<width>height:<height>,frame:<frameid>,clip(x:<x>y:<y>w:<w>h:<h>)
 
 Dus ieder imageid is een http parameter bij gebruik van de GET methode. Frame en/of clip informatie ontbreken als
 een image niet in een frame geplaatst is en/of niet is uitgesneden.
 
 Een image kan worden "gereset" door er met de rechtermuisknop op te klikken
 
 */
var svgns = 'http://www.w3.org/2000/svg';
var xlinkns = 'http://www.w3.org/1999/xlink';
var vectorprintns = 'http://www.vectorprint.nl/2005/dynsvg';
var vectorprintprefix = 'vp:';

var resulturl = '';

var svg = document.getElementById("svg");
if (!svg) {
   svg = document.getElementsByTagNameNS(svgns,"svg")[0];
}

svg.setAttribute('onmousedown', 'Grab(evt)');
svg.setAttribute('onmousemove', 'Drag(evt)');
svg.setAttribute('onmouseup', 'Drop(evt)');

var TrueCoords = svg.createSVGPoint(); // coordinaten aangepast aan de schaal (zoom en verschuiven)
var GrabPoint = svg.createSVGPoint(); // waar hebben we met de muis geklikt

var cliptool_active_style = 'fill:black;fill-opacity:0.1;stroke:black;stroke-width:1px;stroke-opacity:1';
var fill = 'fill:black;fill-opacity:0.1;stroke:black;stroke-width:1px;stroke-opacity:1'; // voor de Handles....
var cliptool_inactive_style = 'fill:black;fill-opacity:0;';
var margin = 10;
var pathid = 'ClipPathId'

var defs = null;
var ok = null;
var cliptool = null;
var svgclipelement='ellipse';

var images = new Object();
var frames = new Object();

var dragobject = null;

var statustext = null;
var helptext = null;
var helptexttext = 'U kunt de plaatjes slepen en/of uitsnijden';

var i = 0;

function showHelp(help) {
   if (helptext) {
      helptext.data = help;
   }
}

function initVp() {

   if (!svg.hasAttribute('viewBox')) {


      resulturl = getAttr(svg,'url');

      if (getAttr(svg,'rulers') == 'true') {
         new TopRuler();
         new LeftRuler();
      }

      ok = new OKButton();

      if (hasAttr(svg,'clip')) {
         svgclipelement = getAttr(svg,'clip');
         defs = create('defs');
         svg.insertBefore(defs, svg.firstChild);
         cliptool = new Cliptool();
         if (getAttr(svg,'guides') == 'true') {
            cliptool.addGuides();
         }
         if (getAttr(svg,'cliptool_inactive_style') != '') {
            cliptool_inactive_style = getAttr(svg,'cliptool_inactive_style');
         }
         if (getAttr(svg,'cliptool_active_style') != '') {
            cliptool_active_style = getAttr(svg,'cliptool_active_style');
         }
         cliptool.positionGuidesAndHandles();
      }


      // zoek de images

      var imagess = svg.getElementsByTagNameNS(svgns, 'image');

      for (i = 0; i < imagess.length; i++) {
         var image = imagess.item(i);
         if (getAttr(image,'image') != null && image.hasAttribute('id')) {
            image.setAttribute('cursor', 'move');
            image.setAttribute('onmouseenter', "showHelp('rechter muisknop om plaatje te resetten, links om te slepen')");
            images[i] = new Image(image);

         }
      }

      // zoek de frames

      var framess = svg.getElementsByTagNameNS(svgns, 'rect');

      for (i = 0; i < framess.length; i++) {
         var frame = framess.item(i);
         if (getAttr(frame,'frame') != null && frame.hasAttribute('id')) {
            frames[i] = new Frame(frame);
         }
      }

      var status = svg.getElementById('status');
      statustext = document.createTextNode('');
      if (status)
         status.appendChild(statustext);

      var info = svg.getElementById('help');
      helptext = document.createTextNode(helptexttext);
      if (info)
         info.appendChild(helptext);

   } else {
      alert('viewBox not supported yet!');
   }
}

function create(name) {
   return document.createElementNS(svgns, name);
}
function append(element) {
   return svg.appendChild(element);
}


function OKButton() {
   this.group = create('a');

   this.rect = create('rect');
   this.rect.setAttribute('style', 'fill:yellow;stroke:black;stroke-width:2px;stroke-dasharray:2px 2px;fill-opacity:0.5');
   this.rect.setAttribute('x', 50);
   this.rect.setAttribute('y', 20);
   this.rect.setAttribute('rx', 5);
   this.rect.setAttribute('ry', 5);
   this.rect.setAttribute('width', 40);
   this.rect.setAttribute('height', 30);
   this.rect.setAttribute('onmouseenter', "showHelp('klik hier op als u klaar bent')");
   this.rect.setAttribute('onmouseout', "showHelp('')");

   this.text = create('text');
   this.text.setAttribute('x', 55);
   this.text.setAttribute('y', 43);
   this.text.setAttribute('style', 'font-size:20;fill:green;font-weight:bold;stroke:green;stroke-width:1px;');
   this.text.appendChild(document.createTextNode('OK'));
   this.group.appendChild(this.text);
   this.group.appendChild(this.rect);
   append(this.group);
   var point = this.text.getStartPositionOfChar(0);
   this.x = point.x;
   this.y = point.y;
}
OKButton.prototype.group = null;
OKButton.prototype.text = null;
OKButton.prototype.rect = null;
OKButton.prototype.x = 0;
OKButton.prototype.y = 0;
OKButton.prototype.dragStyle = function () {
}
OKButton.prototype.dropStyle = function () {
}
OKButton.prototype.move = function (x, y) {
   this.group.setAttribute('transform', 'translate(' + x + ', ' + y + ')');
};
OKButton.prototype.disableDrag = function () {
   this.group.setAttribute('pointer-events', 'none');
}
OKButton.prototype.enableDrag = function () {
   this.group.setAttribute('pointer-events', 'all');
}
OKButton.prototype.setStyle = function (style) {
}
OKButton.prototype.fix = function () {
}
function sendInfo() {
   var s = '';
   var sep = '';
   var imagesOk = true;
   var framesok = true;
   for (var image in images) {
      if (getAttr(images[image].image,'frame_obligatory') == 'true' &&
              images[image].frameInfo === '') {
         imagesOk = false;
         break;
      }
      s += sep + images[image].info();
      sep = '&';
   }
   for (var frame in frames) {
      if (getAttr(frames[frame].rect,'image_obligatory') == 'true' &&
              !frames[frame].image) {
         framesok = false;
         break;
      }
   }
   if (imagesOk) {
      if (framesok) {
         statustext.data = 'sending to: ' + resulturl + ', data: ' + s;
         if (getAttr(svg,'requestmethod') === 'post') {
            post(resulturl, s);
         }
         if (getAttr(svg,'requestmethod') === 'get') {
            get(resulturl, s);
         } else {
            ok.group.setAttributeNS(xlinkns, 'xlink:href', resulturl + '?' + s);
         }
      } else {
         alert('frame ' + frames[frame].rect.getAttribute('id') + ' has to contain an image!');
      }
   } else {
      images[image].image.setAttribute('style', 'opacity:0.3;');
      alert('image ' + images[image].image.getAttribute('id') + ' has to be inside a frame!');
   }
}

function TopRuler() {
   this.line = create('line');
   this.line.setAttribute('x1', '0');
   this.line.setAttribute('x2', '100%');
   this.line.setAttribute('y1', '0');
   this.line.setAttribute('y2', '0');
   this.line.setAttribute('stroke', 'black');
   this.line.setAttribute('stroke-width', '6mm');
   this.line.setAttribute('stroke-opacity', '0.2');
   this.line.setAttribute('stroke-dasharray', '1mm 1mm');
   append(this.line);
   for (i = 1; i < 40; i++)
      append(getRulerText(i, false));
}

function getRulerText(nr, vertical) {
   var text = create('text');
   if (!vertical) {
      text.setAttribute('x', nr * 10 + 'mm');
      text.setAttribute('y', '6mm');
   } else {
      text.setAttribute('y', nr * 10 + 'mm');
      text.setAttribute('x', '1mm');
   }
   text.setAttribute('style', 'font-size:12;fill:red;font-weight:bold');
   texttext = document.createTextNode(nr);
   text.appendChild(texttext);
   return text;
}

function LeftRuler() {
   this.line = create('line');
   this.line.setAttribute('x1', '0');
   this.line.setAttribute('x2', '0');
   this.line.setAttribute('y1', '0');
   this.line.setAttribute('y2', '100%');
   this.line.setAttribute('stroke', 'black');
   this.line.setAttribute('stroke-width', '6mm');
   this.line.setAttribute('stroke-opacity', '0.2');
   this.line.setAttribute('stroke-dasharray', '1mm 1mm');
   append(this.line);
   for (i = 1; i < 40; i++)
      append(getRulerText(i, true));
}

function Guide() {
   this.line = create('line');
   this.line.setAttribute('x1', 0);
   this.line.setAttribute('x2', '10');
   this.line.setAttribute('y1', '10');
   this.line.setAttribute('y2', '0');
   this.line.setAttribute('stroke', 'black');
   this.line.setAttribute('stroke-width', '0.3px');
}
Guide.prototype.position = function (x, y, width, height) {
}

function LeftGuide() {
   Guide.call(this);
   this.line.setAttribute('y1', 0);
   this.line.setAttribute('y2', '100%');
   append(this.line);
}
LeftGuide.prototype = new Guide;
LeftGuide.prototype.constructor = LeftGuide;
LeftGuide.prototype.position = function (x, y, width, height) {
   this.line.setAttribute('x1', x);
   this.line.setAttribute('x2', x);
}

function RightGuide() {
   Guide.call(this);
   this.line.setAttribute('y1', 0);
   this.line.setAttribute('y2', '100%');
   append(this.line);
}
RightGuide.prototype = new Guide;
RightGuide.prototype.constructor = RightGuide;
RightGuide.prototype.position = function (x, y, width, height) {
   this.line.setAttribute('x1', x + width);
   this.line.setAttribute('x2', x + width);
}

function TopGuide() {
   Guide.call(this);
   this.line.setAttribute('x1', 0);
   this.line.setAttribute('x2', '100%');
   append(this.line);
}
TopGuide.prototype = new Guide;
TopGuide.prototype.constructor = TopGuide;
TopGuide.prototype.position = function (x, y, width, height) {
   this.line.setAttribute('y1', y);
   this.line.setAttribute('y2', y);
}

function BottomGuide() {
   Guide.call(this);
   this.line.setAttribute('x1', 0);
   this.line.setAttribute('x2', '100%');
   append(this.line);
}
BottomGuide.prototype = new Guide;
BottomGuide.prototype.constructor = BottomGuide;
BottomGuide.prototype.position = function (x, y, width, height) {
   this.line.setAttribute('y1', y + height);
   this.line.setAttribute('y2', y + height);
}

function EventCatcher() {
   this.rect = create('rect');
   this.rect.setAttribute('fill', 'none');
   this.rect.setAttribute('pointer-events', 'all');
   this.rect.setAttribute('x', '-20');
   this.rect.setAttribute('y', '-20');
   this.rect.setAttribute('width', '120%');
   this.rect.setAttribute('height', '120%');
   svg.insertBefore(this.rect, svg.firstChild);
}

function Image(image) {
   this.image = image;
   this.x = parseFloat(image.getAttribute('x'));
   this.y = parseFloat(image.getAttribute('y'));
   this.w = parseFloat(image.getAttribute('width'));
   this.h = parseFloat(image.getAttribute('height'));
   image.setAttribute('preserveAspectRatio', 'none');
   image.setAttribute('onmouseout', 'resetMe(evt);');
   var ratio = parseFloat(getAttr(this.image,'dpi')) / parseFloat(getAttr(this.image,'mindpi'));
   if (image.getAttribute('style') !== '')
      this.style = image.getAttribute('style');
   if (getAttr(image,'dragstyle') !== '')
      this.dragstyle = getAttr(image,'dragstyle');
   if (getAttr(image,'clipallowed') === 'true') {
      var clip = create('clipPath');
      clip.setAttribute('id', pathid + image.getAttribute('id'));
      clip.appendChild(cliptool.svgobject.cloneNode(true));
      defs.appendChild(clip);
      this.clip = clip;
   }
   this.maxWidth = ratio * this.w;
   this.maxHeight = ratio * this.h;
}
function resetMe(evt) {
   if (dragobject && (dragobject === cliptool || dragobject.sizeBottom === 'handle')) {
      var targetElement = evt.target;
      for (var image in images) {
         if (images[image].image === targetElement) {
            if (!targetElement.hasAttribute('clip-path') || !(images[image].clipx)) {
               images[image].clean();
            }
            break;
         }
      }
   }
   helptext.data = '';
}
Image.prototype.x = 10;
Image.prototype.y = 10;
Image.prototype.clipx = null;
Image.prototype.clipy = null;
Image.prototype.prevTransX = 0;
Image.prototype.prevTransY = 0;
Image.prototype.curTransX = 0;
Image.prototype.curTransY = 0;
Image.prototype.w = 10;
Image.prototype.h = 10;
Image.prototype.clip = null;
Image.prototype.frameInfo = '';
Image.prototype.style = '';
Image.prototype.dragstyle = '';
Image.prototype.maxWidth = 100000;
Image.prototype.maxHeight = 100000;
Image.prototype.resize = function (w, h) {
   this.image.setAttribute("width", w);
   this.image.setAttribute("height", h);
}
Image.prototype.clean = function () {
   this.frameInfo = '';
   if (this.image.hasAttribute('clip-path'))
      this.image.removeAttributeNS(null, 'clip-path');
   this.clipx = null;
   this.clipy = null;
   this.reset(this.x, this.y);
}
Image.prototype.clipImage = function () {
   if (getAttr(this.image,'clipallowed') == 'true') {
      if (!(this.clipx && this.clipy)) {
         var iw = parseFloat(this.image.getAttribute("width"));
         var ih = parseFloat(this.image.getAttribute("height"));
         var ix = parseFloat(this.image.getAttribute("x"))
         var iy = parseFloat(this.image.getAttribute("y"));
         var cx = cliptool.svgobject.getBBox().x;
         var cy = cliptool.svgobject.getBBox().y;
         var cw = cliptool.svgobject.getBBox().width;
         var ch = cliptool.svgobject.getBBox().height;

         if (getAttr(this.image,'resizeonclip') == 'true' && iw == this.w && ih == this.h) {

            factor = ((iw / cw) < (ih / ch)) ? (iw / cw) : (ih / ch);
            // we moeten ook evt. verplaatsen, en wel zo dat het geclipte deel op 0,0 van het huidige
            this.image.setAttribute("x", (ix - ((cx - ix) * factor)));
            this.image.setAttribute("y", (iy - ((cy - iy) * factor)));
            this.image.setAttribute("width", (iw * factor));
            this.image.setAttribute("height", (ih * factor));

            cw = cw * factor;
            ch = ch * factor;
            cliptool.resize(cw, ch);
            cliptool.moveTo(ix, iy);
            cx = ix;
            cy = iy;
            iw = parseFloat(this.image.getAttribute("width"));
            ih = parseFloat(this.image.getAttribute("height"));
            ix = parseFloat(this.image.getAttribute("x"));
            iy = parseFloat(this.image.getAttribute("y"));
         }
         if (hasAttr(this.image,'mindpi') && (iw > this.maxWidth || ih > this.maxHeight)) {
            cliptool.reset();
            cliptool.positionGuidesAndHandles();
            alert('Resolution too low!');
            this.reset(this.x, this.y);
            if (this.image.hasAttribute('clip-path'))
               this.image.removeAttributeNS(null, 'clip-path');
         } else {
            this.clipx = parseFloat(this.image.getAttribute("x"));
            this.clipy = parseFloat(this.image.getAttribute("y"));
            cliptool.positionGuidesAndHandles();
            dragobject.fix();

            if (this.image.hasAttribute('clip-path'))
               this.image.removeAttributeNS(null, 'clip-path');
            if (this.clip.firstChild) {
               this.clip.removeChild(this.clip.firstChild);
            }
            this.clip.appendChild(cliptool.svgobject.cloneNode(true));

            this.image.setAttribute('clip-path', 'url(#' + this.clip.getAttribute('id') + ')');
         }
      } else {
         if (confirm('To define a new clipping region you have to reset this image! Do you wish to do so now?') == true)
         {
            this.clean();
         }
      }
   }
}
Image.prototype.showClip = function () {
   if (getAttr(this.image,'clipallowed') == 'true') {
      if (!(this.clipx && this.clipy)) {
         if (this.image.hasAttribute('clip-path'))
            this.image.removeAttributeNS(null, 'clip-path');
         if (this.clip.firstChild) {
            this.clip.removeChild(this.clip.firstChild);
         }
         this.clip.appendChild(cliptool.svgobject.cloneNode(true));
         this.image.setAttribute('clip-path', 'url(#' + this.clip.getAttribute('id') + ')');
      }
   }
}

Image.prototype.disableDrag = function () {
   this.frameInfo = '';
   this.image.setAttribute('pointer-events', 'none');
   for (var frame in frames) {
      if (frames[frame].image && frames[frame].image === this) {
         frames[frame].image = null;
         break;
      }
   }
}
Image.prototype.enableDrag = function () {
   this.image.setAttribute('pointer-events', 'all');
}
Image.prototype.dragStyle = function () {
   this.image.setAttribute('style', this.dragstyle);
}
Image.prototype.dropStyle = function () {
   this.image.setAttribute('style', this.style);
}
Image.prototype.move = function (x, y) {
   if (this.image.hasAttribute('clip-path')) {
      this.clip.firstChild.setAttribute('transform', 'translate(' + (x + this.prevTransX) + ' ' + (y + this.prevTransY) + ')');
      if (this.image.hasAttribute('clip-path'))
         this.image.removeAttributeNS(null, 'clip-path');
      this.image.setAttribute('clip-path', 'url(#' + this.clip.getAttribute('id') + ')');
      this.image.setAttribute("x", this.clipx + x);
      this.image.setAttribute("y", this.clipy + y);
      this.curTransX = x + this.prevTransX;
      this.curTransY = y + this.prevTransY;
   } else {
      this.image.setAttribute("x", this.x + x);
      this.image.setAttribute("y", this.y + y);
   }
}
Image.prototype.resetSize = function (x, y) {
   if (parseFloat(this.image.getAttribute("width")) != this.w || parseFloat(this.image.getAttribute("height")) != this.h) {
      this.reset(x, y);
   }
}
Image.prototype.reset = function (x, y) {
   this.image.setAttribute("width", this.w);
   this.image.setAttribute("height", this.h);
   this.image.setAttribute("x", x);
   this.image.setAttribute("y", y);
   this.fix();
}
Image.prototype.fix = function () {
   this.x = parseFloat(this.image.getAttribute("x"));
   this.y = parseFloat(this.image.getAttribute("y"));
   if (this.image.hasAttribute('clip-path')) {
      this.prevTransX = this.curTransX;
      this.prevTransY = this.curTransY;
      this.clipx = this.x;
      this.clipy = this.y;
   } else {
      this.prevTransX = 0;
      this.prevTransY = 0;
      this.curTransX = 0;
      this.curTransY = 0;
   }
}
Image.prototype.info = function () {
   var x = (this.image.hasAttribute('clip-path')) ? this.clipx : this.image.getAttribute('x');
   var y = (this.image.hasAttribute('clip-path')) ? this.clipy : this.image.getAttribute('y');
   var s = this.image.getAttribute('id') + '=x:' + Math.round(parseFloat(x)) +
           ',y:' + Math.round(parseFloat(y)) +
           ',width:' + Math.round(parseFloat(this.image.getAttribute('width'))) +
           ',height:' + Math.round(parseFloat(this.image.getAttribute('height')));
   if (this.frameInfo != '')
      s += ',frame:' + this.frameInfo;
   if (this.image.hasAttribute('clip-path')) {
      s += ',clip(';
      s += 'cx:' + Math.round(parseFloat(this.clip.firstChild.getAttribute('cx')) + this.prevTransX);
      s += 'cy:' + Math.round(parseFloat(this.clip.firstChild.getAttribute('cy')) + this.prevTransY);
      s += 'rx:' + Math.round(parseFloat(this.clip.firstChild.getAttribute('rx')));
      s += 'ry:' + Math.round(parseFloat(this.clip.firstChild.getAttribute('ry')));
      s += ')';
   }
   return  s;
}


function Frame(rect) {
   this.rect = rect;
   this.rect.setAttribute('onmouseout', 'outStyle(evt,"' + rect.getAttribute('style') + '")');
   this.rect.setAttribute('onmouseenter', 'inStyle(evt,"' + getAttr(rect,'highlightstyle') + '")');
   this.rect.setAttribute('onclick', 'raiseFrame(evt.target)');
   this.x = parseFloat(rect.getAttribute('x'));
   this.y = parseFloat(rect.getAttribute('y'));
   this.w = parseFloat(rect.getAttribute('width'));
   this.h = parseFloat(rect.getAttribute('height'));
   this.multi = getAttr(this.rect,'multipleimages') == 'true';
   this.checksize = ((getAttr(this.rect,'checksize') == 'false') ? false : true);
   this.checkinside = ((getAttr(this.rect,'checkinside') == 'false') ? false : true);
   if (this.multi == false) {
      this.fit = getAttr(this.rect,'fit');
      this.valign = getAttr(this.rect,'valign');
      this.align = getAttr(this.rect,'align');
   }
}
Frame.prototype.image = null;
Frame.prototype.rect = null;
Frame.prototype.x = 10;
Frame.prototype.y = 10;
Frame.prototype.w = 10;
Frame.prototype.h = 10;
Frame.prototype.fit = 'none';
Frame.prototype.align = 'none';
Frame.prototype.valgin = 'none';
Frame.prototype.multi = false;
Frame.prototype.checksize = true;
Frame.prototype.checkinside = true;
Frame.prototype.sizeImage = function (image) {
   if (!image.image.hasAttribute('clip-path')) {
      var fit = this.fit;

      /*
       
       fitten en alignen doen we alleen als er niet geclipt is.
       
       */

      switch (fit) {
         case 'both':
            image.image.setAttribute("width", this.w);
            image.image.setAttribute("height", this.h);
            break;
         case 'width':
            ratio = parseFloat(image.image.getAttribute("width")) / this.w;
            if (parseFloat(image.image.getAttribute("height")) / ratio > this.h) {
               var ratio = parseFloat(image.image.getAttribute("height")) / this.h;
               image.image.setAttribute("height", this.h);
               image.image.setAttribute("width", parseFloat(image.image.getAttribute("width")) / ratio);
            } else {
               image.image.setAttribute("width", this.w);
               image.image.setAttribute("height", parseFloat(image.image.getAttribute("height")) / ratio);
            }
            break;
         case 'height':
            var ratio = parseFloat(image.image.getAttribute("height")) / this.h;
            if (parseFloat(image.image.getAttribute("width")) / ratio > this.w) {
               ratio = parseFloat(image.image.getAttribute("width")) / this.w;
               image.image.setAttribute("width", this.w);
               image.image.setAttribute("height", parseFloat(image.image.getAttribute("height")) / ratio);
            } else {
               image.image.setAttribute("width", parseFloat(image.image.getAttribute("width")) / ratio);
               image.image.setAttribute("height", this.h);
            }
            break;
         default:
            break;
      }
   }
}
Frame.prototype.fill = function (image) {
   if (!image.image.hasAttribute('clip-path')) {
      var valign = this.valign;
      var align = this.align;
      var fit = this.fit;
      var newx = parseFloat(image.image.getAttribute("x"));
      switch (align) {
         case 'left':
            newx = this.x;
            break;
         case 'right':
            newx = this.x + this.w - parseFloat(image.image.getAttribute("width"));
            break;
         case 'center':
            newx = this.x + ((this.w - parseFloat(image.image.getAttribute("width"))) / 2);
            break;
         default:
            break;
      }
      switch (fit) {
         case 'both':
         case 'width':
            newx = this.x;
            break;
         default:
      }

      image.image.setAttribute("x", newx);
      var newy = parseFloat(image.image.getAttribute("y"));
      switch (valign) {
         case 'top':
            newy = this.y;
            break;
         case 'bottom':
            newy = this.y + this.h - parseFloat(image.image.getAttribute("height"));
            break;
         case 'middle':
            newy = this.y + ((this.h - parseFloat(image.image.getAttribute("height"))) / 2);
            break;
         default:
            break;
      }
      switch (fit) {
         case 'both':
         case 'height':
            newy = this.y;
            break;
         default:
      }
      image.image.setAttribute("y", newy);
   }
   if (this.image != null && this.image !== image && this.multi == false) {
      alert('There is already an image in this frame!');
      //image.reset(image.x, image.y);
   } else {
      var w = parseFloat(image.image.getAttribute("width"));
      var h = parseFloat(image.image.getAttribute("height"));
      var x = parseFloat(image.image.getAttribute("x"));
      var y = parseFloat(image.image.getAttribute("y"));
      if (image.image.hasAttribute('clip-path')) {
         w = parseFloat(image.clip.firstChild.getAttribute('rx')) * 2;
         h = parseFloat(image.clip.firstChild.getAttribute('ry')) * 2;
         x = parseFloat(image.clip.firstChild.getAttribute('cx')) - (w/2) + image.prevTransX;
         y = parseFloat(image.clip.firstChild.getAttribute('cy')) - (h/2) + image.prevTransY;
      }
      if ((this.w < w || this.h < h) && this.checksize == true) {
         alert('This image is too big for this frame!');
         //image.reset(image.x, image.y);
         image.frameInfo = '';
      } else {
         if ((x < this.x ||
                 x + w > this.x + this.w ||
                 y < this.y ||
                 y + h > this.y + this.h
                 ) && this.checkinside == true) {
            alert('This image is outside the frame!');
            //image.reset(image.x, image.y);
            image.frameInfo = '';
         } else {
            if (hasAttr(image.image,'mindpi') && (parseFloat(image.image.getAttribute("width")) > image.maxWidth ||
                    parseFloat(image.image.getAttribute("height")) > image.maxHeight)) {
               alert('Resolution too low!');
               //image.reset(image.x, image.y);
               image.frameInfo = '';
            } else {
               this.image = image;
               image.frameInfo = this.rect.getAttribute('id');
            }
         }
      }
   }
}
function inStyle(evt, style) {
   if (dragobject) {
      evt.target.setAttribute('style', style);
   }
   showHelp('in dit kader moet een plaatje komen');
   raiseFrame(evt.target);
   if (dragobject && dragobject.image) {
      dragobject.clean();
   }
}
function outStyle(evt, style) {
   if (dragobject) {
      evt.target.setAttribute('style', style);
   }
   showHelp('');
   currentFrame = null;
}
var currentFrame = null;
function raiseFrame(target) {
   var before = null;
   for (frame in frames) {
      if (target !== frames[frame].rect) {
         if (!before) {
            before = frames[frame].rect;
         }
      } else {
         currentFrame = frames[frame];
      }
   }
   if (before) {
      target.parentNode.insertBefore(before, target);
   }

}

function Ellipse() {
   this.svgobject = create('ellipse');
   this.svgobject.setAttribute('cx', this.cx);
   this.svgobject.setAttribute('cy', this.cy);
   this.svgobject.setAttribute('rx', this.rx);
   this.svgobject.setAttribute('ry', this.ry);
}
Ellipse.prototype.cx = 50;
Ellipse.prototype.cy = 50;
Ellipse.prototype.rx = 20;
Ellipse.prototype.ry = 20;
Ellipse.prototype.leftmargin = function () {
   return this.cx - margin;
};
Ellipse.prototype.rightmargin = function () {
   return this.cx + margin;
};
Ellipse.prototype.topmargin = function () {
   return this.cy + margin;
};
Ellipse.prototype.bottommargin = function () {
   return this.cy - margin;
};
Ellipse.prototype.svgobject = null;

Ellipse.prototype.move = function (x, y) {
   this.svgobject.setAttribute('cx', this.cx + x);
   this.svgobject.setAttribute('cy', this.cy + y);
}
Ellipse.prototype.reset = function () {
   this.svgobject.setAttribute('cx', this.cx);
   this.svgobject.setAttribute('cy', this.cy);
   this.svgobject.setAttribute('rx', this.rx);
   this.svgobject.setAttribute('ry', this.ry);
}
Ellipse.prototype.moveTo = function (x, y) {
   this.move(x - this.svgobject.getBBox().x, y - this.svgobject.getBBox().y);
}
Ellipse.prototype.resize = function (w, h) {
   this.svgobject.setAttribute('rx', w / 2);
   this.svgobject.setAttribute('ry', h / 2);
}
Ellipse.prototype.fix = function () {
   this.cx = parseFloat(this.svgobject.getAttribute('cx'));
   this.cy = parseFloat(this.svgobject.getAttribute('cy'));
   this.rx = parseFloat(this.svgobject.getAttribute('rx'));
   this.ry = parseFloat(this.svgobject.getAttribute('ry'));
}
Ellipse.prototype.setStyle = function (style) {
   this.svgobject.setAttribute('style', style);
}
Ellipse.prototype.disableDrag = function () {
   this.svgobject.setAttribute('pointer-events', 'none');
}
Ellipse.prototype.enableDrag = function () {
   this.svgobject.setAttribute('pointer-events', 'all');
}
Ellipse.prototype.sizeLeft = function (handle, x) {
   var newx = handle.x + x;
   if (newx + handle.w <= this.leftmargin()) {
      this.svgobject.setAttribute('rx', this.cx - newx - handle.w);
   }
}
Ellipse.prototype.sizeTop = function (handle, y) {
   var newy = handle.y + y;
   if (newy + handle.h <= this.bottommargin()) {
      this.svgobject.setAttribute('ry', this.cy - newy - handle.h);
   }
}
Ellipse.prototype.sizeRight = function (handle, x) {
   var newx = handle.x + x;
   if (newx >= this.rightmargin()) {
      this.svgobject.setAttribute('rx', newx - this.cx);
   }
}
Ellipse.prototype.sizeBottom = function (handle, y) {
   var newy = handle.y + y;
   if (newy >= this.topmargin()) {
      this.svgobject.setAttribute('ry', newy - this.cy);
   }
}
Ellipse.prototype.info = function () {
   var info = new Object();
   info['cx'] = this.cx;
   info['cy'] = this.cy;
   info['rx'] = this.rx;
   info['ry'] = this.ry;
   return info;
}

function Rectangle() {
   this.svgobject = create('rect');
   this.svgobject.setAttribute('x', this.x);
   this.svgobject.setAttribute('y', this.y);
   this.svgobject.setAttribute('width', this.w);
   this.svgobject.setAttribute('height', this.h);
}
Rectangle.prototype.x = 10;
Rectangle.prototype.y = 10;
Rectangle.prototype.w = 100;
Rectangle.prototype.h = 100;
Rectangle.prototype.leftmargin = function () {
   return this.x + margin;
}
Rectangle.prototype.rightmargin = function () {
   return this.x + this.w - margin;
}
Rectangle.prototype.topmargin = function () {
   return this.y + margin;
}
Rectangle.prototype.bottommargin = function () {
   return this.y + this.h - margin;
}
Rectangle.prototype.svgobject = null;

Rectangle.prototype.moveTo = function (x, y) {
   this.svgobject.setAttribute("x", x);
   this.svgobject.setAttribute("y", y);
}
Rectangle.prototype.move = function (x, y) {
   this.svgobject.setAttribute("x", this.x + x);
   this.svgobject.setAttribute("y", this.y + y);
}
Rectangle.prototype.reset = function () {
   this.svgobject.setAttribute("x", this.x);
   this.svgobject.setAttribute("y", this.y);
   this.svgobject.setAttribute("width", this.width);
   this.svgobject.setAttribute("height", this.height);
}
Rectangle.prototype.resize = function (w, h) {
   this.svgobject.setAttribute("width", w);
   this.svgobject.setAttribute("height", h);
}
Rectangle.prototype.fix = function () {
   this.x = parseFloat(this.svgobject.getAttribute("x"));
   this.y = parseFloat(this.svgobject.getAttribute("y"));
   this.w = parseFloat(this.svgobject.getAttribute("width"));
   this.h = parseFloat(this.svgobject.getAttribute("height"));
}
Rectangle.prototype.setStyle = function (style) {
   this.svgobject.setAttribute('style', style);
}
Rectangle.prototype.disableDrag = function () {
   this.svgobject.setAttribute('pointer-events', 'none');
}
Rectangle.prototype.enableDrag = function () {
   this.svgobject.setAttribute('pointer-events', 'all');
}
Rectangle.prototype.sizeLeft = function (handle, x) {
   var newx = handle.x + x;
   if (newx + handle.w <= this.rightmargin()) {
      this.svgobject.setAttribute("x", newx + handle.w);
      this.svgobject.setAttribute("width", this.w - x);
   }
}
Rectangle.prototype.sizeTop = function (handle, y) {
   var newy = handle.y + y;
   if (newy + handle.h <= this.bottommargin()) {
      this.svgobject.setAttribute("y", newy + handle.h);
      this.svgobject.setAttribute("height", this.h - y);
   }
}
Rectangle.prototype.sizeRight = function (handle, x) {
   var newx = handle.x + x;
   if (newx >= this.leftmargin()) {
      this.svgobject.setAttribute("width", newx - this.x);
   }
}
Rectangle.prototype.sizeBottom = function (handle, y) {
   var newy = handle.y + y;
   if (newy >= this.topmargin()) {
      this.svgobject.getAttribute("height", newy - this.y);
   }
}
Rectangle.prototype.info = function () {
   var info = new Object();
   info['x'] = this.x;
   info['y'] = this.y;
   info['w'] = this.w;
   info['h'] = this.h;
   return info;
}

function Cliptool() {
   try {
      if (svgclipelement === 'ellipse') {
         Ellipse.call(this);
      } else if (svgclipelement === 'rect') {
         Rectangle.call(this);
      }
   } catch (error) {
      Rectangle.call(this);
   }
   this.svgobject.setAttribute('cursor', 'move');
   this.svgobject.setAttribute('onmouseenter', "showHelp('gereedschap voor uitsnijden van plaatjes, vergroot/verklein het en sleep het boven een plaatje')");
   this.svgobject.setAttribute('onmouseout', "showHelp('')");
   Cliptool.parent.setStyle.call(this, cliptool_active_style);
   append(this.svgobject);
   this.addHandles();
   this.fixHandles();
}

if (svgclipelement === 'ellipse') {
   Cliptool.prototype = new Ellipse;
   Cliptool.parent = Ellipse.prototype;
} else if (svgclipelement === 'rect') {
   Cliptool.prototype = new Rectangle;
   Cliptool.parent = Rectangle.prototype;
}

Cliptool.prototype.constructor = Cliptool;
Cliptool.prototype.handles = new Object();
Cliptool.prototype.guides = new Object();

Cliptool.prototype.dragStyle = function () {
   Cliptool.parent.setStyle.call(this, cliptool_active_style);
}
Cliptool.prototype.dropStyle = function () {
   Cliptool.parent.setStyle.call(this, cliptool_inactive_style);
}
Cliptool.prototype.addHandles = function () {
   this.handles["tl"] = new TopLeftHandle();
   this.handles["tr"] = new TopRightHandle();
   this.handles["bl"] = new BottomLeftHandle();
   this.handles["br"] = new BottomRightHandle();
}
Cliptool.prototype.addGuides = function () {
   this.guides['left'] = new LeftGuide();
   this.guides['right'] = new RightGuide();
   this.guides['top'] = new TopGuide();
   this.guides['bottom'] = new BottomGuide();
}
Cliptool.prototype.positionGuidesAndHandles = function () {
   var x = this.svgobject.getBBox().x;
   var y = this.svgobject.getBBox().y;
   var w = this.svgobject.getBBox().width;
   var h = this.svgobject.getBBox().height;
   for (guide in this.guides) {
      this.guides[guide].position(x, y, w, h);
   }
   for (handle in this.handles) {
      this.handles[handle].position(x, y, w, h);
   }
}

Cliptool.prototype.move = function (x, y) {
   Cliptool.parent.move.call(this, x, y);
   this.positionGuidesAndHandles();
}
Cliptool.prototype.fix = function () {
   Cliptool.parent.fix.call(this);
   if (dragobject === this)
      this.fixHandles();
}
Cliptool.prototype.fixHandles = function () {
   for (handle in this.handles) {
      this.handles[handle].fix();
   }
}

function Handle() {
   Rectangle.call(this);
   this.svgobject.setAttribute('style', fill);
   this.svgobject.setAttribute('rx', 2);
   this.svgobject.setAttribute('ry', 2);
   this.svgobject.setAttribute('cursor', 'pointer');
   this.svgobject.setAttribute('onmouseenter', "showHelp('vergroot of verklein hiermee het uitsnede gereedschap')");
   this.svgobject.setAttribute('onmouseout', "showHelp('')");
   this.svgobject.setAttribute("width", 5);
   this.svgobject.setAttribute("height", 5);
   this.w = 5;
   this.h = 5;
}
Handle.prototype = new Rectangle;
Handle.prototype.constructor = Handle;
Handle.parent = Rectangle.prototype;
Handle.prototype.info = null;
Handle.prototype.dragStyle = function (style) {
}
Handle.prototype.dropStyle = function (style) {
}
Handle.prototype.sizeBottom = 'handle';
Handle.prototype.sizeTop = '';
Handle.prototype.sizeLeft = '';
Handle.prototype.sizeRight = '';

function TopLeftHandle() {
   Handle.call(this);
   append(this.svgobject);
}
TopLeftHandle.prototype = new Handle;
TopLeftHandle.prototype.constructor = TopLeftHandle;
TopLeftHandle.parent = Handle.prototype;
TopLeftHandle.prototype.move = function (x, y) {
   if (dragobject === this) {
      cliptool.sizeLeft(this, x);
      cliptool.sizeTop(this, y);
      cliptool.positionGuidesAndHandles();
   } else {
      Handle.parent.move.call(this, x, y);
   }
}
TopLeftHandle.prototype.position = function (x, y, width, height) {
   this.svgobject.setAttribute("x", x - this.w);
   this.svgobject.setAttribute("y", y - this.h);
}


function TopRightHandle() {
   Handle.call(this);
   append(this.svgobject);
}

TopRightHandle.prototype = new Handle;
TopRightHandle.prototype.constructor = TopRightHandle;
TopRightHandle.parent = Handle.prototype;
TopRightHandle.prototype.move = function (x, y) {
   if (dragobject === this) {
      cliptool.sizeRight(this, x);
      cliptool.sizeTop(this, y);
      cliptool.positionGuidesAndHandles();
   } else {
      Handle.parent.move.call(this, x, y);
   }
}
TopRightHandle.prototype.position = function (x, y, width, height) {
   this.svgobject.setAttribute("x", x + width);
   this.svgobject.setAttribute("y", y - this.h);
}


function BottomLeftHandle() {
   Handle.call(this);
   append(this.svgobject);
}
BottomLeftHandle.prototype = new Handle;
BottomLeftHandle.prototype.constructor = BottomLeftHandle;
BottomLeftHandle.parent = Handle.prototype;
BottomLeftHandle.prototype.move = function (x, y) {
   if (dragobject === this) {
      cliptool.sizeLeft(this, x);
      cliptool.sizeBottom(this, y);
      cliptool.positionGuidesAndHandles();
   } else {
      Handle.parent.move.call(this, x, y);
   }
}
BottomLeftHandle.prototype.position = function (x, y, width, height) {
   this.svgobject.setAttribute("x", x - this.w);
   this.svgobject.setAttribute("y", y + height);
}

function BottomRightHandle() {
   Handle.call(this);
   append(this.svgobject);
}
BottomRightHandle.prototype = new Handle;
BottomRightHandle.prototype.constructor = BottomRightHandle;
BottomRightHandle.parent = Handle.prototype;
BottomRightHandle.prototype.move = function (x, y) {
   if (dragobject === this) {
      cliptool.sizeRight(this, x);
      cliptool.sizeBottom(this, y);
      cliptool.positionGuidesAndHandles();
   } else {
      Handle.parent.move.call(this, x, y);
   }
}
BottomRightHandle.prototype.position = function (x, y, width, height) {
   this.svgobject.setAttribute("x", x + width);
   this.svgobject.setAttribute("y", y + height);
}

var dragged = false;
function Grab(evt)
{
   dragged = false;
   // op welk element hebben we geklikt
   var targetElement = evt.target;
//alert(targetElement);
   //    waarvandaan slepen we.....
   if (parseInt(evt.button) == 0 && !dragobject) {
      var transMatrix = targetElement.getCTM();
      GetTrueCoords(evt);
      GrabPoint.x = TrueCoords.x - ((transMatrix) ? transMatrix.e : 0);
      GrabPoint.y = TrueCoords.y - ((transMatrix) ? transMatrix.f : 0);

      //alert(targetElement);
      // we slepen alleen de rechthoek voor de uitsnede
      if (cliptool && cliptool.svgobject === targetElement)
      {

         dragobject = cliptool;

      } else if (ok.rect === targetElement) {
         dragobject = ok;
      } else {
         for (var i in images) {
            if (images[i].image === targetElement && getAttr(targetElement,'dragallowed') === 'true') {
               dragobject = images[i];
               //dragobject.resetSize(GrabPoint.x, GrabPoint.y);
               break;
            }
         }
         if (cliptool) {
            for (var handle in cliptool.handles) {
               if (cliptool.handles[handle].svgobject === targetElement) {
                  dragobject = cliptool.handles[handle];
                  break;
               }
            }
         }
      }
      if (dragobject) {
         dragobject.disableDrag();
         dragobject.dragStyle();
      }
   } else if (parseInt(evt.button) == 2) {
      GetTrueCoords(evt);
      var transMatrix = targetElement.getCTM();
      GrabPoint.x = TrueCoords.x - ((transMatrix) ? transMatrix.e : 0);
      GrabPoint.y = TrueCoords.y - ((transMatrix) ? transMatrix.f : 0);
      for (var i in images) {
         if (images[i].image === targetElement) {
            if (confirm('Reset image?') == true)
               images[i].clean();
            statustext.data = images[i].info();
            break;
         }
      }
   }
}
;


function Drag(evt)
{
   // houdt rekening met zoomen en verschuiven

   if (dragobject) {
      var targetElement = evt.target;
      dragged = true;
      GetTrueCoords(evt);
      if (currentFrame && dragobject.image) {
         currentFrame.sizeImage(dragobject);
      }
      statustext.data = 'x: ' + Math.round(TrueCoords.x) + 'y: ' + Math.round(TrueCoords.y);
      dragobject.move(TrueCoords.x - GrabPoint.x, TrueCoords.y - GrabPoint.y);
      if (dragobject === cliptool) {
         for (var image in images) {
            if (images[image].image === targetElement) {
               images[image].showClip();
               break;
            }
         }
      }
   }
}

function Drop(evt)
{

   //alert(targetElement);
   if (dragobject) {
      dragobject.enableDrag();
      var targetElement = evt.target;
      dragobject.dropStyle();
      dragobject.fix();
      if (dragobject.image) {
         for (var frame in frames) {
            if (frames[frame].rect === targetElement) {
               frames[frame].sizeImage(dragobject);
               frames[frame].fill(dragobject);
               break;
            }
         }
      }
      if (dragobject.sizeBottom === 'handle') {
         cliptool.fix();
         cliptool.fixHandles();
      }
      //alert(instanceOf(dragobject,Handle));
      if (dragobject === cliptool || dragobject.sizeBottom === 'handle') {
         for (var image in images) {
            if (images[image].image === targetElement) {
               images[image].clipImage();
               statustext.data = images[image].info();
               break;
            }
         }
      }
      if (!dragged && ok === dragobject) {
         sendInfo();
      }
      if (dragobject.info && dragobject !== cliptool)
         statustext.data = dragobject.info();
      dragobject = null;
   }

}


function GetTrueCoords(evt)
{
   //    we passen de positie aan aan de huidige schaal (zoomen) en translatie (verschuiving)
   var x = evt.clientX;
   var y = evt.clientY;
   //    we passen de positie aan aan de huidige schaal (zoomen) en translatie (verschuiving)
   var scale = svg.currentScale;
   var translation = svg.currentTranslate;
   TrueCoords.x = ((x - translation.x) / scale);
   TrueCoords.y = ((y - translation.y) / scale);
   //alert(x + ' ' + y + ' '+ TrueCoords.x + ' ' + TrueCoords.y);
}

function instanceOf(object, constructorFunction) {
   while (object != null) {
      if (object == constructorFunction.prototype)
      {
         return true
      }
      object = object.__proto__;
   }
   return false;
}

function get(url, data) {
   if (typeof getURL  === 'function') {
      getURL(url+'?'+data,null);
   } else {
      doAjax('GET', url, data);
   }
}
function post(url, data) {
   if (typeof postURL  === 'function') {
      postURL(url,data,null);
   } else {
      doAjax('POST', url, data);
   }
}
var nrAjaxReq = 0;
function doAjax(method, url, data) {
   var ajax = new AjaxObject101(null, false);
   ajax.funcDone = function () {
      if (ajax.http.readyState == 4 && ajax.http.status == 200) {
      } else {
         throw "failed to send " + data + " to " + url;
      }
   }
   if (data && data.length > 2)
      data += '&ajaxnr=' + (++nrAjaxReq);
   else
      data = 'ajaxnr=' + (++nrAjaxReq);
   switch (method) {
      case "GET":
      case "POST":
         try {
            ajax.sndReq(method, url, data, true);
         } catch(error) {
            statustext.data = "kon niet versturen naar " + url + ": " +error.message;
         }
         break;
      default:
         alert(method + " not supported");
         return null;
   }
   if (ajax.http.readyState == 4 && ajax.http.status == 200)
      return ajax;
}

function getAttr(elem,name) {
   var value = elem.getAttributeNS(vectorprintns,name);
   if (value) return value;
   if (hasAttr(elem,name)) {
      return elem.getAttribute(vectorprintprefix+name);
   }
}
function hasAttr(elem,name) {
   return elem.hasAttributeNS(vectorprintns,name) || elem.hasAttribute(vectorprintprefix + name);
}
