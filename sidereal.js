/*	SIDEREAL CLOCK
Local Sidereal Clock by James Melatis
webmaster@indigotide.com
Click on set-up button to get a prompt window
Set longitude to decimalized local longitude to compute offset for Local Sidereal Time
Setting will round automatically to 7 decimal places
7 decimal places puts you within 1/2" at the equator (0.0004 arc seconds)
and even less, closer to the poles
longitude = 0 = Greenwich Mean Sidereal Time (GMST)
longitude negative = West longitude offset
longitude positive = East longitude offset
EXAMPLE: West Longitude 117° 31' 51.71988" = -117.5310333°
*/

var lst;	//Local Sidereal Time

//Execute this when the form loads
function loadUserSetting() {
	//DefaultLongitude = -2.43586421;	//Put YOUR default local longitude here...
	DefaultLongitude = 360;	//Put YOUR default local longitude here...
	clock.longitude.value = DefaultLongitude;

	document.getElementById("longitude").readOnly = true;	//No typing in displays allowed
	document.getElementById("degrees").readOnly = true;
	document.getElementById("minutes").readOnly = true;
	document.getElementById("seconds").readOnly = true;
	document.getElementById("meridian").readOnly = true;
	document.getElementById("degrees2").readOnly = true;
	document.getElementById("meridian2").readOnly = true;
	document.getElementById("date").readOnly = true;
	document.getElementById("utc").readOnly = true;
	document.getElementById("gmst").readOnly = true;
	document.getElementById("day").readOnly = true;
	document.getElementById("angle").readOnly = true;
	document.getElementById("lst").readOnly = true;

	var inputValue = parseFloat(clock.longitude.value);
	updateLongitude(inputValue);	//Update all longitude displays
	updateClock();	//Have longitude so bail and start clock update routine
}

function updateClock()	{
	//Loop to keep time displays current
	var long = parseFloat (clock.longitude.value);	//Get longitude variable from current form INPUT text value and convert to floating point number

	var now = new Date();	//Get current date & time from computer clock
	var date = now.toLocaleString();	//Format date as local full date and 12 hour clock
	var utc = now.toUTCString();	//Format utc as UTC date & time

	var beg = new Date(now.getUTCFullYear() - 1, 11, 31);	//Get last day of previous year in milliseconds
	var day = Math.floor((now - beg) / 86400000);	//Compute integer day of year (86400000 ms/day)

	var mst = getGMST( now );	//Get adjusted GMST in degrees for current system time
	var mstAngle = mst;	//Save for GMST Angle display

	//Compute integer GMST hour angle deg min sec
	var gmstdeg = Math.floor(mstAngle);	//Get integer GMST hour angle degrees right ascension of vernal equinox

	mstAngle = mstAngle - gmstdeg;	//Get integer GMST hour angle minutes right ascension of vernal equinox
	mstAngle = mstAngle * 60;
	var gmstmin = Math.floor(mstAngle);

	mstAngle = mstAngle - gmstmin;	//Get integer GMST hour angle seconds right ascension of vernal equinox
	mstAngle = mstAngle * 60;
	var gmstsec = Math.floor(mstAngle);

	lst = mst + long;	//Now we know GMST so just add local longitude offset

	if( lst > 0.0 )	{	//Circle goes round and round, adjust LST if < 0 or > 360 degrees
		while(lst > 360.0) lst -= 360.0;
	}
	else {
		while(lst < 0.0) lst += 360.0;
	}

	var ras = lst;	//Save LST degrees right ascension for hour angle display

	lst = lst / 15.0;	//Change LST from degrees to time units (15 deg/hour)
	mst = mst / 15.0;	//Change MST from degrees to time units (15 deg/hour)

	//console.log("decimal LST=" + lst);

	//Compute integer LST hour angle deg min sec
	var deg = Math.floor(ras);	// get integer hour angle degrees right ascension of vernal equinox

	ras = ras - deg;	//Get integer hour angle minutes right ascension of vernal equinox
	ras = ras * 60;
	var min = Math.floor(ras);

	ras = ras - min;	//Get integer hour angle seconds right ascension of vernal equinox
	ras = ras * 60;
	var sec = Math.floor(ras);

	//Compute local sidereal time hour minute second
	hour = Math.floor(lst);	//Get integer LST hour

	lst = lst - hour;	//Get integer LST minute
	lst = lst * 60;
	minute = Math.floor(lst);

	lst = lst - minute;	//Get integer LST second
	lst = lst * 60;
	second = Math.floor(lst);
	//Compute GMST time hours minutes seconds
	hours = Math.floor(mst);	//Get integer MST hours

	mst = mst - hours;	//Get integer MST minutes
	mst = mst * 60;
	minutes = Math.floor(mst);

	mst = mst - minutes;	//Get integer MST seconds
	mst = mst * 60;
	seconds = Math.floor(mst);

	/*
	document.clock.date.value = " " + date;	// update "clock" form displays
	document.clock.utc.value = " " + utc;
	document.clock.gmstangle.value = " " + addZero( gmstdeg ) + "° " + addZero( gmstmin ) + "\' " + addZero( gmstsec ) + "\"";
	document.clock.gmst.value = " " + addZero( hours ) + " : " + addZero( minutes ) + " : " + addZero( seconds );
	document.clock.day.value = " " + day ;
	document.clock.angle.value = " " + addZero( deg ) + "° " + addZero( min ) + "\' " + addZero( sec ) + "\"";
	document.clock.lst.value = " " + addZero( hour ) + " : " + addZero( minute ) + " : " + addZero( second );
	*/

	document.getElementById("theTime").innerHTML = utc;
	newtime = window.setTimeout("updateClock();", 1000);	// update all clock displays once per second
}

function addZero(n)	{
	//Adds leading zero if 1 digit number
	if( n < 10 ) {
		return "0" + n;
	}
	else return n;
}

//Function getGMST computes Mean Sidereal Time (J2000)
//Input: Current Date
//Returns: Adjusted Greenwich Mean Sidereal Time (GMST) in degrees
function getGMST(now) {
	var year = now.getUTCFullYear();	//Get UTC from computer clock date & time (var now)
	var month = now.getUTCMonth() + 1;
	var day = now.getUTCDate();
	var hour = now.getUTCHours();
	var minute = now.getUTCMinutes();
	var second = now.getUTCSeconds();

	if( month == 1 || month == 2 ) {
		year = year - 1;
		month = month + 12;
	}

	var lc = Math.floor(year/100);	//Integer # days / leap century
	var ly = 2 - lc + Math.floor(lc/4);	//Integer # days / leap year
	var y = Math.floor(365.25 * year);	//Integer # days / year
	var m = Math.floor(30.6001 * (month + 1));	//Integer # days / month

	//Now get julian days since J2000.0
	var jd = ly + y + m - 730550.5 + day + (hour + minute/60.0 + second/3600.0)/24.0;

	//Julian centuries since J2000.0
	var jc = jd/36525.0;

	//Greenwich Mean Sidereal Time (GMST) in degrees
	var GMST = 280.46061837 + 360.98564736629*jd + 0.000387933*jc*jc - jc*jc*jc/38710000;

	if( GMST > 0.0 )	{
		//Circle goes round and round, adjust if < 0 or > 360 degrees
		while(GMST > 360.0) GMST -= 360.0;
	}
	else {
		while(GMST < 0.0) GMST += 360.0;
	}

	return GMST;	//In degrees
}

function newLongitude() {
	var Prompt = "ENTER Complete Local Longitude in +/- DEGREES";
	var Example = "Enter -117.5310333 for West Longitude 117° 31' 51.71988\"";
	var Default = DefaultLongitude;
	var RangeMin = -180;
	var RangeMax = 180;
	var Decimals = 7;	//7 decimal places is 0.0000001 = 0.0004 arc seconds longitude is < 1/2" distance as the ant crawls
	var inputValue = getNumber( Prompt,Example,Default,RangeMin,RangeMax,Decimals );	// prompt for number value

	if (inputValue === false) {
		return;
	}
	else {
		updateLongitude(inputValue);	//Update longitude displays
	}
}

function getNumber(Prompt, Example, Default, RangeMin, RangeMax, Decimals) {
	var inputValue = prompt(Prompt + ": RANGE = ( " + RangeMin + " to " + RangeMax + " )\nEXAMPLE: " + Example , Default );

	if (inputValue == null || inputValue == "") {
	}
	else if (isNaN(inputValue) == true) {
		alert("\"" +inputValue + "\" IS NOT A NUMBER: Please Input a Number...\nRANGE = ( " + RangeMin + " to " + RangeMax + " )");
		return false;	//Prompt entry was not a number so alert user and ignore it
	}
	else if (inputValue < RangeMin || inputValue > RangeMax) {
		alert("INPUT OUT OF RANGE: ( " + inputValue + " ) \nRANGE = ( " + RangeMin + " to " + RangeMax + " )");
		return false;	//Prompt entry was a number but out of range so alert user and ignore it
	}
	else if (Decimals == 0) {
		inputValue = Math.floor(inputValue);	//No decimals returned
		return inputValue;	//Return it!
	}
	else {
		var InRange = new Number(inputValue);	//Prompt entry number within range so create number object
		inputValue = InRange.toFixed( Decimals );	//Use number object to round to requested number of decimals
		return inputValue;	//Return it!
	}
}

function updateLongitude(inputValue) {
	var output;
	var meridian;
	var longitude = parseFloat(inputValue);	//Get decimal longitude from form input field

	if (longitude < 0.0)	{ //Display Meridian value
		//document.clock.meridian.value = "West";	//Negative = West
		document.clock.meridian.value = "W";	//Negative = West
		meridian = "W";
	}
	else if (longitude > 0.0) {
		//document.clock.meridian.value = "East";	//Positive = East
		document.clock.meridian.value = "E";	//Positive = East
		meridian = "E";
	}
	else {
		//document.clock.meridian.value = "Prime";	//Not E or W so must be Zero "Prime"
		document.clock.meridian.value = "P";	//Not E or W so must be Zero "Prime"
		meridian = "P";
	}

	longitude = Math.abs(longitude);	//Throw away negative sign
	var degrees = Math.floor(longitude);	//Save integer degrees without sign

	longitude = longitude - degrees;	//Get longitude minutes
	longitude = longitude * 60;
	var decMinutes = longitude;	//save decimal minutes
	var minutes = Math.floor(longitude);	//Save integer minutes

	longitude = longitude - minutes;	//Get decimal longitude seconds
	longitude = longitude * 60;
	var seconds = longitude

	var setDecimal = new Number(inputValue);	//Restore longitude to number object
	inputValue = setDecimal.toFixed(7);	//Use number object to round to 7 decimals

	var setDecimal = new Number(decMinutes);	//Save minutes with decimals as object
	var decMinutes = setDecimal.toFixed(6);	//Use number object to round to 6 decimals

	var setDecimal = new Number(seconds);	//Save seconds with decimals as object
	var seconds = setDecimal.toFixed(0);	//Use number object to round seconds to 5 decimals

	document.clock.longitude.value = inputValue + "°";	//Update all longitude displays
	document.clock.degrees.value = degrees + "°";
	output = degrees + "° ";
	document.clock.minutes.value = addZero( minutes ) + "\'";
	output += addZero( minutes ) + "\' ";
	document.clock.seconds.value = addZero( seconds ) + "\"";
	output += addZero( seconds ) + "\" ";
	output += meridian;
	document.getElementById("theLocation").innerHTML = output;
	document.clock.degrees2.value = document.clock.degrees.value
	document.clock.dminutes.value = addZero( decMinutes ) + "m";
	document.clock.meridian2.value = document.clock.meridian.value
}

function showAbout() {
	alert("To find your local \"STAR\" time, click on the set-up button set your local longitude value. Enter your longitude as decimal +/- DEGREES: ( -117.5310333° ). Enter a negative number for WEST longitude and a positive number for EAST.\n\nACCURACY: Decimal Degrees rounded down to 7 decimal places.\n0.0000001° = 0.0004 ArcSeconds, which is less than 1/2 inch at the equator.\n\n Please click on the clock displays for more information...")
}

function showLST() {
	alert("LOCAL SIDEREAL TIME (LST) is the Right Ascension (RA) of the sky objects currently on the Meridian. In other words, LOCAL STAR TIME.")
}

function showGMST() {
	alert("GMST is Greenwich Mean Sidereal Time, or the current \"STAR\" time at longitude zero.")
}

function showGMSTAngle() {
	alert("GMST ANGLE is the same as Greenwich Mean Sidereal Time (GMST), except it is shown in DEGREES rather than time units. It is the HOUR ANGLE of the sky objects currently on the Meridian at longitude zero.\n\nOnce you know this in DEGREES, you can just add your local longitude DEGREES to find your local Hour Angle, then divide by 15 to get Local Sidereal Time.")
}

function showAngle() {
	alert("LST ANGLE is the same as Local Sidereal Time, except it is shown in DEGREES rather than time units. It is the HOUR ANGLE of the sky objects currently on the Meridian.")
}

function showUTC() {
	alert("UTC TIME is Universal Coordinated Time and is the same time everywhere. It is also the same as what used to be called Greenwich Mean Time (GMT). \n\nUTC is the current time and date at longitude zero.\n\nWith local time, \"WHEN\" something will happen depends on \"WHERE\" you are. Instead, UTC provides a global frame of reference when talking about \"WHEN\" an event will take place.")
}

function showLocal() {
	alert("LOCAL TIME is the 12-hour time and date where YOU are.")
}

function showDay() {
	alert("YEAR DAY is the current day of the year where YOU are.")
}