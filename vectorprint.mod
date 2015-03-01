  <!ATTLIST svg xmlns:vp CDATA #FIXED "http://www.vectorprint.nl/2005/dynsvg"
  vp:clip (ellipse|rect) "ellipse"
  vp:rulers (true|false) "false"
  vp:cliptool_active_style CDATA #IMPLIED
  vp:cliptool_inactive_style CDATA #IMPLIED
  vp:requestmethod (get|post) #IMPLIED
  vp:guides (true|false) "false"
  vp:url CDATA #IMPLIED
  >
  <!ATTLIST rect
  vp:frame (true|false) "true"
  vp:highlightstyle CDATA #IMPLIED
  vp:align (left|right|center) #IMPLIED
  vp:valign (top|bottom|middle) #IMPLIED
  vp:multipleimages (true|false) "false"
  vp:checksize (true|false) "true"
  vp:checkinside (true|false) "true"
  vp:fit (width|height|both) #IMPLIED
  vp:image_obligatory (true|false) "false"
  >
  <!ATTLIST image
  vp:image (true|false) "true"
  vp:dragstyle CDATA #IMPLIED
  vp:dragallowed (true|false) "true"
  vp:clipallowed (true|false) "true"
  vp:dpi CDATA #IMPLIED
  vp:mindpi CDATA #IMPLIED
  vp:resizeonclip (true|false) "false"
  vp:frame_obligatory (true|false) "true"
  >