function sprintf(str) {
	var args = arguments, i = 1;

	return str.replace(/%(s|d|0\d+d)/g, function (x, type) {
		var value = args[i++];
		switch (type) {
		case 's': return value;
		case 'd': return parseInt(value, 10);
		default:
			value = String(parseInt(value, 10));
			var n = Number(type.slice(1, -1));
			return '0'.repeat(n).slice(value.length) + value;
		}
	});
}

function delay(millisecs) {
	var now = new Date().getTime();
	while (new Date().getTime() < now + millisecs) {
	};
}

//String to int with error checking
function atoi2(a, byRef, sign=true) {
	document.write("atoi2(): a='" + a + "'<br/>");
	var len = a.length;
	if (len > 6) return false;
	for (var l = 0; l < len; l++) {
		if ((l == 0) && ((a[l] == '+') || (a[l] == '-')) && sign) continue;
		if ((a[l] < '0') || (a[l] > '9')) return false;
	}
	var l = parseInt(a);
	if ((l < -32767) || (l > 32768)) return false;
	byRef.i = l;
  return true;
}

//String to float with error checking
function atof2(a, byRef, sign=true) {
  var dc=0;
	var len = a.length;
	for (var l = 0; l < len; l++) {
		if ((l==0) && ((a[l]=='+') || (a[l]=='-')) && sign) continue;
		if (a[l]=='.') { if (dc==0) { dc++; continue; } else return false; }
		if ((a[l]<'0') || (a[l]>'9')) return false;
  }
  d = parseFloat(a);
  return true;
}