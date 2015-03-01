//Created by Sean Kane (http://celtickane.com/programming/code/ajax.php)
//Feather Ajax v1.0.1
// Adapted by Eduard Drenth, even more simple, 
// different way to get XMLHttpRequest, headers for post, sync supported, postprocess supported, showResponse supported
// as a third way to handle the ajax response

function AjaxObject101(id,changeValue) {
	this.createRequestObject = function() {
		var xmlHttp = false;
		try {xmlHttp=new XMLHttpRequest();} catch (e) {
		  try {xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");} catch (e) {
		    try {xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");} catch (e) {}
		  }
		}
		return xmlHttp;
	}
	this.sndReq = function(action, url, data,async) {
		if (action.toUpperCase() == "POST") {
			this.http.open(action,url,async);
			this.http.setRequestHeader('Content-Type','application/x-www-form-urlencoded');
			this.http.setRequestHeader("Content-length", data.length);
			this.http.setRequestHeader("Connection", "close");
			this.http.onreadystatechange = this.handleResponse;
			this.http.send(data);
		}
		else {
			this.http.open(action,url + '?' + data,async);
			this.http.onreadystatechange = this.handleResponse;
			this.http.send(null);
		}
		if (!async) {
			// when doing synchroneous requests some browsers do not call a handler,
			// but expect the handling to be done after the send has finished
			if (this.doe&&this.http.responseText&&this.http.responseText!='') {
				this.handleResponse();
			}
		}
	}
	this.handleResponse = function() {
		if (( me.http.readyState == 4)) {
            if (me.http.status==200) {
                me.doe=false;
                me.data = me.http.responseText;
                if (me.shownothing==false) {
                   var el = (me.id) ? document.getElementById(me.id) : null;
                   if (el) {
                      if (me.value) {
                         el.setAttribute("value",me.data);
                      } else {
                         var c = el.firstChild;
                           var n = new DOMParser().parser.parseFromString(me.data,"text/xml");
                         if (c) {
                            el.replaceChild(c,n);
                         } else {
                            el.appendChild(n);
                         }
                      }
                   } else {
                      me.showResponse(me.data);
                   }
                }
                if (typeof me.funcDone == 'function') { me.funcDone();}
                if (typeof me.postprocess == 'function') { me.postprocess(me.postprocessargs); }
            } else {
                alert ("failed to recieve data, http status: " + me.http.status);
                if (typeof me.funcDone == 'function') { me.funcDone();}
            }
		} else {
			if ((me.http.readyState == 1) && (typeof me.funcWait == 'function')) { me.funcWait(); }
		}
	}
	this.showResponse=function(text) {
		alert(text);
	}
	this.doe=true;
	this.http = this.createRequestObject();
	this.data = '';
	this.value=changeValue;
   this.shownothing=false;
	this.id = id;
	this.postprocess = null;
	this.postprocessargs = null;
	var me = this;
}