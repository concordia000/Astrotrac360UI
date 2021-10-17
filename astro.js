var highPrecision = true;

//Telescope Right Ascension. Returns: HH:MM.T# or HH:MM:SS# (based on precision setting)
//Original Copyright Howard Dutton
function doubleToHms(f) {
    var f1 = Math.abs(f) + 0.000139; //Round to 1/2 arc-sec
    var h1 = Math.floor(f1);
    var m1 = (f1 - h1) * 60;
    var s1 = (m1 - Math.floor(m1));
    var s = "%s%02d:%02d:%02d";

    if (highPrecision) {
        s1 = s1 * 60.0;
    } else {
        s1 = s1 * 10.0;
        s = "%s%02d:%02d.%01d";
    }
    var sign = "";
    if (((s1 != 0) || (m1 != 0) || (h1 != 0)) && (f < 0.0)) sign = "-";
    return sprintf(s, sign, h1, m1, s1);
}

//Telescope Declination. Returns: sDD*MM# or sDD*MM'SS# (based on precision setting)
//Original Copyright Howard Dutton
function doubleToDms(f, fullRange, signPresent) {
    var sign = "+";
    var o = 0,
        d1, s1 = 0,
        m1, f1;
    var reply = "";
    f1 = f;

    //Setup formatting, handle adding the sign
    if (f1 < 0) {
        f1 = -f1;
        sign = "-";
    }

    f1 = f1 + 0.000139; //Round to 1/2 arc-second
    d1 = Math.floor(f1);
    m1 = (f1 - d1) * 60.0;
    s1 = (m1 - Math.floor(m1)) * 60.0;

    //char s[]="+%02d*%02d:%02d";
    var s = "+%02d*%02d'%02d"; //Skysafari format
    if (signPresent) {
        if (sign == "-") { s[0] = "-"; }
        o = 1;
    } else {
        s = "%02d*%02d'%02d"; //Skysafari format
    }
    if (fullRange) s[2 + o] = '3';
    if (highPrecision) {
        reply = sprintf(s, d1, Math.floor(m1), s1);
    } else {
        s[9 + o] = 0;
        reply = sprintf(s, d1, Math.floor(m1));
    }
    return reply;
}

//Convert string in format HH:MM:SS to decimal hrs
//(also handles)           HH:MM.M
//(also handles)           HH:MM:SS.SSSS
function hmsToDecimal(hms) {
    var arr = hms.split(':').map(Number);
    if (arr.length == 3) {
        return (arr[0] + arr[1] / 60 + arr[2] / 3600).toFixed(8);
    } else if (arr.length == 2) {
        return (arr[0] + arr[1] / 60).toFixed(8);
    }
}

//Convert string in format sDD:MM:SS to double
//(also handles)           sDD:MM:SS.SSS
//                         sDD:MM
//                         sDD*MM
//But not:
//                         DDD:MM:SS
//                         DDD:MM
//                         DDD*MM
function dmsToDecimal(dms) {
    var sign = 0;
    if (dms[0] == '+') { sign = 1.0; } else if (dms[0] == '-') { sign = -1.0 };
    //document.write("sign=" + sign + "<br/>");
    var deg = parseFloat(dms.substring(1, 3));
    //document.write("deg=" + deg + "<br/>");
    var min = parseFloat(dms.substring(4, 6));
    //document.write("min=" + min + "<br/>");
    var sec = parseFloat(dms.substring(7, 9));
    //document.write("sec=" + sec + "<br/>");
    var decDeg = Math.floor(deg);
    var decSecs = min * 60 + sec;
    return sign * (deg + decSecs / 3600);
}

// limit angle functions --- from Indi
// https://github.com/indilib/indi/blob/2ea67102f8200d8d2cf9b510f8a4743ea009a36b/libs/indicom.c
function rangeHA(r) {
    var res = r;
    while (res < -12.0)
        res += 24.0;
    while (res >= 12.0)
        res -= 24.0;
    return res;
}

function range24(r) {
    var res = r;
    while (res < 0.0)
        res += 24.0;
    while (res > 24.0)
        res -= 24.0;
    return res;
}

function range360(r) {
    var res = r;
    while (res < 0.0)
        res += 360.0;
    while (res > 360.0)
        res -= 360.0;
    return res;
}

function rangeDec(decdegrees) {
    if ((decdegrees >= 270.0) && (decdegrees <= 360.0))
        return (decdegrees - 360.0);
    if ((decdegrees >= 180.0) && (decdegrees < 270.0))
        return (180.0 - decdegrees);
    if ((decdegrees >= 90.0) && (decdegrees < 180.0))
        return (180.0 - decdegrees);
    return decdegrees;
}

/*
// convert string in format HH:MM:SS to double
// (also handles)           HH:MM.M
// (also handles)           HH:MM:SS.SSSS
// Original Copyright Howard Dutton
function hmsToDouble(hms) {
  var h = new Array(3);
  var m = new Array(5);
  var h1, m1, m2 = 0;
  var s1 = 0;

  hms = hms.replace(/\s+/g, '');
  document.write("hms=" + hms + "<br/>");

  var actualLen = hms.length;
  if (actualLen > 13 ) hms[13]=0; //Maximum length

  if (highPrecision) {if ((hms.length != 8) && (hms.length < 10)) return false;} else if (hms.length != 7) return false;

  //h[0]=*hms++; h[1]=*hms++; h[2]=0; if (!atoi2(h,&h1,false)) return false;
  var i=0;
  h[0] = hms[i++]; h[1] = hms[i++]; h[2] = 0;
  document.write("h[0]=" + h[0] + ",h[1]=" + h[1] + ",h[2]=" + h[2]  + "<br/>");
  let byRef = {h1:0};
  if (!atoi2(h, byRef, false)) return false;
  h1 = byRef.h1;
  document.write("h1=" + h1 + "<br/>");

  if (highPrecision) {
    //if (*hms++!=':') return false; m[0]=*hms++; m[1]=*hms++; m[2]=0; if (!atoi2(m,&m1,false)) return false;
    let byRef = {m1:0};
    if (hms[i++]!=':') return false; m[0]=hms[i++]; m[1]=hms[i++]; m[2]=0;
    if (!atoi2(m, byRef, false)) return false;
    m1 = byRef.m1;
    document.write("m[0]=" + h[0] + ",m[1]=" + m[1] + ",m[2]=" + m[2]  + "<br/>");
    document.write("m1=" + m1 + "<br/>");
    document.write("***HERE***" + "<br/>");
    if (hms[i++]!=':') return false;
    if (!atof2(hms, s1, false)) return false;
  } else {
    if (hms++!=':') return false; m[0]=hms++; m[1]=hms++; m[2]=0; if (!atoi2(m,m1,false)) return false;
    if (hms++!='.') return false; m2=(hms++)-'0';
  }
  if ((h1<0) || (h1>23) || (m1<0) || (m1>59) || (m2<0) || (m2>9) || (s1<0) || (s1>59.9999)) return false;

  f = h1 + m1 /60.0 + m2/600.0 + s1/3600.0;
  return f;
}
*/

/*
// Original Copyright Howard Dutton
boolean dmsToDouble(double *f, char *dms, boolean sign_present) {
  char d[4], m[5];
  int d1, m1;
  double s1=0;
  int lowLimit=0, highLimit=360;
  int checkLen,actualLen;
  double sign = 1.0;
  boolean secondsOff = false;

  while (*dms==' ') dms++; // strip prefix white-space
  if (strlen(dms)>13) dms[13]=0; // maximum length

  actualLen=strlen(dms);

  // determine if the seconds field was used and accept it if so
  if (highPrecision) {
    checkLen=9;
    if (actualLen != checkLen) {
      checkLen=11;
      if (!(actualLen >= checkLen)) return false;
    }
  } else {
    checkLen=6;
    if (actualLen != checkLen) {
      if (actualLen==9) { secondsOff=false; checkLen=9; } else return false;
    } else secondsOff = true;
  }

  // determine if the sign was used and accept it if so
  if (sign_present) {
    if (*dms=='-') sign=-1.0; else if (*dms=='+') sign=1.0; else return false;
    dms++; d[0]=*dms++; d[1]=*dms++; d[2]=0; if (!atoi2(d,&d1,false)) return false;
  } else {
    d[0]=*dms++; d[1]=*dms++; d[2]=*dms++; d[3]=0; if (!atoi2(d,&d1,false)) return false;
  }

  // make sure the seperator is an allowed character
  if ((*dms!=':') && (*dms!='*') && (*dms!=char(223))) return false; else dms++;

  m[0]=*dms++; m[1]=*dms++; m[2]=0; if (!atoi2(m,&m1,false)) return false;

  if ((highPrecision) && (!secondsOff)) {
    // make sure the seperator is an allowed character
    if (*dms++!=':') return false;
    if (!atof2(dms,&s1,false)) return false;
  }

  if (sign_present) { lowLimit=-90; highLimit=90; }
  if ((d1<lowLimit) || (d1>highLimit) || (m1<0) || (m1>59) || (s1<0) || (s1>59.999)) return false;

  *f=sign*(d1+m1/60.0+s1/3600.0);
  return true;
}
*/