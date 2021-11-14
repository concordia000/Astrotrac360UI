//This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
//Modified by Jerry Li, 17/10/2021


//SkySafari settings:

//	telescope: 'LX-200 Classic', 'German-Equatorial'

//	ip address: master drive ip from SSID

//	port: 23

//	update: 1 sec

//

//Run websocket test at 'https://www.websocket.org/echo.html' to make sure browser supports websockets

//In Skysafari 'connect' to telescope (can split screen and view browser and SkySafari)

//

//References:

//	LX200 commands: http://www.stellarjourney.com/index.php?r=site/software_telescope

//	WS protocols: https://stackoverflow.com/questions/4812686/closing-websocket-correctly-html5-javascript?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa

//

//On iOS, can use automatic Configure IP, but may have to hard reboot to see WiFi icon top right - SkySafari will only connect when this is visible.



const MNT = {

    DRV1: "1",

    DRV2: "2",

    DRVS: "3",

};

Object.freeze(MNT);



const DIR = {

    W: '',

    E: '-',

    N: '',

    S: '-',

};

Object.freeze(DIR);



//Command identifiers

const DRV = {

    ACC: 'a', //Acceleration: get (a?), set (a%hd)

    DIR: 'd', //Direction (hemisphere)

    ERR: 'e', //Error: code

    FLE: 'f', //File:

    HME: 'h', //Home:

    I_O: 'i', //I/O:

    THU: 'k', //Temp and humidity: HTU21D temp (h1?), HTU21D humidity (hh1?)

    ENC_SIG: 'm', //Encoder: get signal strength

    ENC_CAL: 'mc', //Encoder: calibrate encoder

    NVM: 'n', //Get/Set EEPROM values: n? get all values when UI loads.

    POS: 'p', //Position

    SRV: 's', //Servo

    SRVM: 'sm', //Servo mode

    VEL: 'v', //Velocity

    VGD: 'vg', //Guide velocity (arcsecs/sec)

    VTR: 'vt' //Track velocity (arcsecs/sec)

};

Object.freeze(DRV);



const IO = {

    PS: "1",

    TRK: "2",

    STS: "3",

    BUZ: "4",

};

Object.freeze(IO);



const HEM = {

    N: 1,

    S: -1,

}

Object.freeze(HEM);

const jitter = 0.0005; //precision of decoders

const ERR = {

    ERR_CMD_TRGT_DRV: 0,

}

Object.freeze(ERR);

const CONF = {
    GEM: 0,
    SINGLEARM: 1,
}

var ws;

var hemisphere = HEM.N;

var SID_VEL = 15; //arcsecs per sec

// var SID_VEL = 15.035;

const SID_VEL_DEG = SID_VEL / 3600;

var slewVel = 720 * SID_VEL; //Default 720x sidereal rate (arcsecs/s)

var accSlew = 320 * 100; //(arcsecs/s^2)

var accAutoGuide = 3200 * 100; //(arcsecs/s)

var trackVel = SID_VEL;

var DRV1Pos = 0;

var DRV2Pos = 0;

var targetRA = 0;

var targetDec = 0;

var targetDecDecimal = 0;

var targetRADecimal = 0;



var cmdQ = new Array(); //FIFO cmd stack

var fwdLX200 = false;



var start = new Date().getTime();

var lastMillis = 0;

var lastSliderMillis = 0;

var sliderUpdateInterval = 100;

var RAOffset = 0;

var DECOffset = 0;

var raAlignTime = Date.now();

var RATarget = 0;

var DECTarget = 0;

var currentCommand = "";

var lstAtAlign = 0; //in hours

var mountConfig = CONF.GEM;

var useDeOffset = true;

var autoResume = true;

var cookieExDays = 180;



//***Test astro functions***

//var siderealTime = 36120;

//CalculateLST(siderealTime);

//console.log("reply doubleToHms(12.34)=" + doubleToHms(12.34));

//console.log("reply doubleToDms(89.9998)=" + doubleToDms(89.9998,false,true));

//**************************



console.log("self.location.host=" + self.location.host);



function sendCmd() {

    if (ws.readyState === WebSocket.OPEN) {

        while (cmdQ.length > 0) { //While there's a cmd to send

            var cmd = cmdQ[0];

            if (cmd != undefined && cmd != "") {

                lastMillis = getMillis();

                ws.send("[" + cmd + "]"); //Add cmd frame and send via websocket

                console.log("sendCmd(): cmd='[" + cmd + "]'");

                consoleWrite("Sent: '[" + cmd + "]'");

                cmdQ.shift(); //Remove cmd from queue now it's been sent

            }

        }

    } else {

        console.log("Cannot send command - not connected to AstroTrac 360");

    }

}

//Modification to enable 1star alignment and slew to
var DRV1PosPending = false;
var DRV2PosPending = false;

function startAlignment(RATarString, DECTarString) {
    currentCommand = "ALIGN";
    try {
        $("#alignSubmitBtn").prop('disabled', true);
        // RATarget = parseFloat(RATarString);
        // DECTarget = parseFloat(DECTarString);
        // Translation
        RATarget = parseFloat(hmsToDecimal(RATarString));
        DECTarget = dmsToDecimal(DECTarString);
        getRALoc();
    } catch (e) {
        $("#alignSubmitBtn").prop('disabled', false);
        console.log("Alignment Error: " + e);
    }
}

function startGoto(RATarString, DECTarString) {
    try {
        // $("#gotoSubmitBtn").prop('disabled', true);
        // RATarget = parseFloat(RATarString);
        // DECTarget = parseFloat(DECTarString);
        // Translation
        var raGotoDes = parseFloat(hmsToDecimal(RATarString));
        var deGotoDes = dmsToDecimal(DECTarString);
        var targetDesString = "RA = " + RATarString + ", DEC = " + DECTarString;
        GOTOTarget(raGotoDes, deGotoDes, "", targetDesString);
    } catch (e) {
        // $("#gotoSubmitBtn").prop('disabled', false);
        consoleWrite("Goto Error: " + e);
    }
}

function getRALoc() {
    //get RA, dec location
    cmdQ.push(MNT.DRV1 + DRV.POS + "?");
    cmdQ.push(MNT.DRV2 + DRV.POS + "?");
    sendCmd();
}

function setAlignment(ra, dec) {
    // RAoffset = RATarget - ra;
    raAlignTime = Date.now(); //Record the time when alignment was taken
    // DECOffset = DECTarget - dec;
    // Indi method: calcualte local sidereal time
    // No need to set DEC offsets
    [lstAtAlign, DECOffset] = getLSTFromEncoders(ra, dec, RATarget, DECTarget);
    currentCommand = ""; // reset current command
    $("#alignSubmitBtn").prop('disabled', false);
    const alignObj = { raAlignTime: raAlignTime, lstAtAlign: lstAtAlign, DECOffset: DECOffset };
    var alignmentString = JSON.stringify(alignObj);
    setAlignmentCookie(alignmentString);
    updateAlignmentText(raAlignTime, lstAtAlign, DECOffset);
}


// using Indi method (decimal degrees, decimal degrees, decimal degrees)
// https://github.com/indilib/indi/blob/master/drivers/telescope/astrotrac.cpp
function getLSTFromEncoders(haEncoder, deEncoder, raPos, dePos) {
    var ha = 0;
    // rapos = parseFloat(raPos);
    // Take care of jitter
    if (haEncoder > jitter * -1 && haEncoder < jitter)
        haEncoder = 0;
    if (deEncoder > jitter * -1 && deEncoder < jitter)
        deEncoder = 0;

    // Northern Hemisphere
    if (hemisphere == HEM.N) {
        // "Normal" Pointing State (East, looking West)
        if (mountConfig == CONF.SINGLEARM || deEncoder >= 0) {
            de = Math.min(90 - deEncoder, 90.0);
            ha = -6.0 + (haEncoder / 360.0) * 24.0;
        }
        // "Reversed" Pointing State (West, looking East)
        else {
            de = 90 + deEncoder;
            ha = 6.0 + (haEncoder / 360.0) * 24.0;
        }
    } else {
        // East
        if (mountConfig == CONF.SINGLEARM || deEncoder <= 0) {
            de = Math.max(-90 - deEncoder, -90.0);
            ha = -6.0 - (haEncoder / 360.0) * 24.0;
        }
        // West
        else {
            de = -90 + deEncoder;
            ha = 6.0 - (haEncoder / 360.0) * 24.0;
        }
    }
    consoleWrite("Mount Hour Angle (decimal degrees):" + ha);
    consoleWrite("Mount RA Position (source):" + raPos);
    // console.log("Mount RA Position (decimal hours):" + raPos / 360 * 24);

    var Lst = range24(raPos + rangeHA(ha));
    consoleWrite("Local sidereal time:" + Lst);
    // return [Lst, ha];
    var deOff = dePos - de;
    return [Lst, deOff];
}

function getRADEFromEncoders(haEncoder, deEncoder) {
    var ha = 0;

    // Take care of jitter
    if (haEncoder > jitter * -1 && haEncoder < jitter)
        haEncoder = 0;
    if (deEncoder > jitter * -1 && deEncoder < jitter)
        deEncoder = 0;

    // Northern Hemisphere
    if (hemisphere == HEM.N) {
        // "Normal" Pointing State (East, looking West)
        if (mountConfig == CONF.SINGLEARM || deEncoder >= 0) {
            de = Math.min(90 - deEncoder, 90.0);
            ha = -6.0 + (haEncoder / 360.0) * 24.0;
        }
        // "Reversed" Pointing State (West, looking East)
        else {
            de = 90 + deEncoder;
            ha = 6.0 + (haEncoder / 360.0) * 24.0;
        }
    } else {
        // East
        if (mountConfig == CONF.SINGLEARM || deEncoder <= 0) {
            de = Math.max(-90 - deEncoder, -90.0);
            ha = -6.0 - (haEncoder / 360.0) * 24.0;
        }
        // West
        else {
            de = -90 + deEncoder;
            ha = 6.0 - (haEncoder / 360.0) * 24.0;
        }
    }

    // var Lst = range24(raPos / 360 * 24 + 6 + ha);
    var dt = (Date.now() - raAlignTime) / (1000 * 3600); //convert to hours
    var Lst = range24(lstAtAlign + dt);
    ra = range24(Lst - rangeHA(ha));
    // return [Lst, ha];
    return [ra, de];
}

// get encorder positions from given ra/de coordinates, adapted from Indi
// https://github.com/indilib/indi/blob/master/drivers/telescope/astrotrac.cpp
function getEncodersFromRADE(ra, de) {
    var haEncoder = 0;
    var deEncoder = 0;
    // Time elapsed since alignment
    var dt = (Date.now() - raAlignTime) / (1000 * 3600); //convert to hours
    var Lst = range24(lstAtAlign + dt);
    var dHA = rangeHA(Lst - ra);
    consoleWrite("dHA=" + dHA);
    // Northern Hemisphere
    if (hemisphere == HEM.N) {
        // "Normal" Pointing State (East, looking West)
        if (mountConfig == CONF.SINGLEARM || dHA <= 0) {
            deEncoder = -(de - 90.0);
            haEncoder = (dHA + 6.0) * 360.0 / 24.0;
        }
        // "Reversed" Pointing State (West, looking East) (Post-Meridian)
        else {
            deEncoder = de - 90.0;
            haEncoder = (dHA - 6.0) * 360.0 / 24.0;
        }
    } else {
        // "Normal" Pointing State (East, looking West) 
        if (mountConfig == CONF.SINGLEARM || dHA <= 0) {
            deEncoder = -(de + 90.0);
            haEncoder = -(dHA + 6.0) * 360.0 / 24.0;
        }
        // "Reversed" Pointing State (West, looking East) (Post-Meridian)
        else {
            deEncoder = (de + 90.0);
            haEncoder = -(dHA - 6.0) * 360 / 24.0;
        }
    }
    return [haEncoder, deEncoder];
}

var MAX_SLEW_VELOCITY = 10800;
var ACCELERATION = 3600;

// Adapted from Indi plugin
// https://github.com/indilib/indi/blob/master/drivers/telescope/astrotrac.cpp
function calculateSlewTime(distance) {
    // Firstly throw away sign of distance - don't care about direction - and convert to arcsec
    distance = Math.abs(distance) * 3600.0;

    // Now estimate how far mount travels during accelertion and deceleration period
    var accelerate_decelerate = MAX_SLEW_VELOCITY * MAX_SLEW_VELOCITY / ACCELERATION;

    // If distance less than this, then calulate using accleration forumlae:
    if (distance < accelerate_decelerate) {
        return (2 * Math.sqrt(distance / ACCELERATION));
    } else {
        // Time is equal to twice the time required to accelerate or decelerate, plus the remaining distance at max slew speed
        return (2.0 * MAX_SLEW_VELOCITY / ACCELERATION + (distance - accelerate_decelerate) /
            MAX_SLEW_VELOCITY);
    }
}

function goToHome() {
    consoleWrite("Going to neutral position...")
    cmdQ.push(MNT.DRV1 + DRV.POS + "0");
    cmdQ.push(MNT.DRV2 + DRV.POS + "0");
    sendCmd();
}

function calibrateRA() {
    consoleWrite("Calibrating RA encoders...")
    cmdQ.push(MNT.DRV1 + "y" + "0");
    sendCmd();
}

function calibrateDE() {
    consoleWrite("Calibrating DEC encoders...")
    cmdQ.push(MNT.DRV2 + "y" + "0");
    sendCmd();
}

function GOTOTarget(RASlewTarget, DECSlewTarget, targetDescription) {
    //Calculate the destination drive position
    if (currentCommand == "") {
        currentCommand = "GOTO";
        // var LSTOffset = (Date.now() - RAOffsetTime) * SID_VEL_DEG;
        // var RADes = RASlewTarget + RAOffset;
        // var DECDes = DECSlewTarget + DECOffset;
        // use "Indi" formulae for destinations
        var deOff = 0;
        if (useDeOffset && (Math.abs(DECSlewTarget - DECOffset <= 90))) { //if the DEC correction will put DEC > +-90 degrees, do not apply the DEC correction
            deOff = DECOffset;
        }
        var [RADes, DECDes] = getEncodersFromRADE(RASlewTarget, rangeDec(DECSlewTarget - deOff)); //Limit declination just in case the user enters 100 degrees or something
        var tHA = calculateSlewTime(RADes - DRV1Pos);
        tHA = tHA * SID_VEL_DEG * hemisphere; //RA offset due to tracking
        RADes += tHA;
        var tmax = Math.max(tHA, calculateSlewTime(DECDes - DRV2Pos));
        console.log("Start slewing to: " + targetDescription);
        try {
            cmdQ.push(MNT.DRV1 + DRV.POS + RADes);
            cmdQ.push(MNT.DRV2 + DRV.POS + DECDes);
            sendCmd();
            setTimeout(function() {
                consoleWrite("Slew complete");
                currentCommand = "";
            }, tmax);
        } catch (e) {
            consoleWrite("Error when trying to slew: " + e);
        }
    } else {
        consoleWrite("Alignment/Slew pending.");
    }
}

function processCmd(cmd) {

    var reply = "";



    if (cmd.indexOf(":GR#") > -1) { //RA position, reply format "12:30:30#";

        reply = "[" + MNT.DRV1 + DRV.POS + "?]"; //Request DRV1 position from Master

        fwdLX200 = true; //When reply comes back from AT, forward to Sky Safari

    } else if (cmd.indexOf(":GD#") > -1) { //Dec position, reply format "+45*30'30#";

        reply = "[" + MNT.DRV2 + DRV.POS + "?]"; //Request DRV2 position from Master

        fwdLX200 = true; //When reply comes back from AT, forward to Sky Safari

    } else if (cmd.indexOf("[" + MNT.DRV1 + DRV.POS) > -1) {

        posDRV1 = parseFloat(cmd.substring(cmd.lastIndexOf(DRV.POS) + 1, cmd.lastIndexOf("]"))); //Extract encoder pos (decimal hours)

        DRV1Pos = posDRV1;

        DRV1PosPending = false;

        // if alignment
        if (currentCommand == "ALIGN") {
            if (!DRV1PosPending && !DRV2PosPending) {
                setAlignment(DRV1Pos, DRV2Pos);
            }
        }


        console.log("posDRV1=" + posDRV1);

        if (fwdLX200) { //Output LX200 cmd to SkySafari

            reply = doubleToHms(posDRV1) + "#"; //Format decimal input HH:MM:SS#

            fwdLX200 = false;

        }

    } else if (cmd.indexOf("[" + MNT.DRV2 + DRV.POS) > -1) {

        posDRV2 = parseFloat(cmd.substring(cmd.lastIndexOf(DRV.POS) + 1, cmd.lastIndexOf("]"))); //Extract encoder pos (decimal degrees)

        DRV2Pos = posDRV2;

        DRV2PosPending = false;

        // if alignment
        if (currentCommand == "ALIGN") {
            if (!DRV1PosPending && !DRV2PosPending) {
                setAlignment(DRV1Pos, DRV2Pos);
            }
        }

        console.log("posDRV2=" + posDRV2);

        if (fwdLX200) { //Output LX200 cmd to SkySafari

            reply = doubleToDms(posDRV2, false, true) + "#"; //Format decimal input sDD*MM'SS#

            fwdLX200 = false;

        }

    } else if (cmd.indexOf(DRV.ERR) > -1) { //Don't use cmd[1] == 'e' as ambiguous with LX200 ':Me'!

        var errCode = parseFloat(cmd.substring(cmd.lastIndexOf(DRV.ERR) + 1, cmd.lastIndexOf("]")));

        showErr(errCode);

    } else if (cmd.indexOf(DRV.NVM) > -1) {

        cmd = cmd.substring(cmd.lastIndexOf(DRV.NVM) + 1, cmd.lastIndexOf("]"))

        console.log("NVM initial values: " + cmd);

        setDefaultValues(cmd);

    } else if (cmd.indexOf(DRV.ENC_SIG) > -1) {

        var encSig = parseFloat(cmd.substring(cmd.lastIndexOf(DRV.ENC_SIG) + 1, cmd.lastIndexOf("]")));

        console.log("Encoder 1 signal strength=" + encSig + "%");

        consoleWrite("Encoder 1 signal strength=" + encSig + "%");

    } else if (cmd.indexOf(":Mw#") > -1) {

        startSlew(MNT.DRV1, DIR.W);

    } else if (cmd.indexOf(":Me#") > -1) {

        startSlew(MNT.DRV1, DIR.E);

    } else if (cmd.indexOf(":Mn#") > -1) {

        startSlew(MNT.DRV2, DIR.N);

    } else if (cmd.indexOf(":Ms#") > -1) {

        startSlew(MNT.DRV2, DIR.S);

    } else if (cmd.indexOf(":Qw#") > -1 || cmd.indexOf(":Qe#") > -1) {

        stopSlew(MNT.DRV1);

    } else if (cmd.indexOf(":Qn#") > -1 || cmd.indexOf(":Qs#") > -1) {

        stopSlew(MNT.DRV2);

    } else if (cmd.indexOf(":RG#") > -1) {

        setSlewVel(0.5 * SID_VEL);

    } else if (cmd.indexOf(":RC#") > -1) {

        setSlewVel(24 * SID_VEL);

    } else if (cmd.indexOf(":RM#") > -1) {

        setSlewVel(64 * SID_VEL);

    } else if (cmd.indexOf(":RS#") > -1) {

        setSlewVel(720 * SID_VEL);

    } else if (cmd.indexOf(":Sr#") > -1) { //Set target RA ':SrHH:MM:SS#'. Reply '0' or '1'

        targetRA = cmd.substring(cmd.lastIndexOf(":Sr") + 3, cmd.lastIndexOf("#"));

        targetRADecimal = hmsToDecimal(targetRA);

        console.log("targetRA=" + targetRA + ",targetRADecimal=" + targetRADecimal);

        reply = "1"; //AT recognises a '1' for forwarding to Sky Safari

    } else if (cmd.indexOf(":Sd#") > -1) { //Set target Dec ':SdsDD:MM:SS#'. Reply '0' or '1'

        targetDec = cmd.substring(cmd.lastIndexOf(":Sd") + 3, cmd.lastIndexOf("#"));

        targetDecDecimal = dmsToDecimal(targetDec);

        console.log("targetDec=" + targetDec + ",targetDecDecimal=" + targetDecDecimal);

        reply = "1"; //AT recognises a '1' for forwarding to Sky Safari

    } else if (cmd.indexOf(":CM#") > -1) { //Sync. with current target RA/Dec. Reply 'N/A#'

        reply = "N/A#";

    } else if (cmd.indexOf(":MS#") > -1) { //Move telescope (to current Equatorial target). Reply: '0' (no error), '1' (below horizon), '2' (no object), '4' (position unreachable), '5' (not aligned), '6' (outside limits)

        //1. Send error and exit if object below horizon | no object | position unreachable | not aligned | outside limits

        //2. Compute LST - happens every second (var lst is decimal)

        //3. Compute HA = LST - targetRA. Port Howard Dutton's hmsToDouble() - can then get decimal targetRA from LX200 string

        var HA = lst - targetRADecimal;

        console.log("HA=" + HA);

        //4. Slew to HA/Dec

        //5. Send '0' no error

        delay(3000); //Delay to simulate slew to target

        reply = "0"; //Sky Safari GoTo button is re-enabled once it receives reply '0'. It doesn't appear to check if RA/Dec co-ords are within vicinity of target.

    }



    if (reply != "") {

        console.log("reply='" + reply + "'");

        cmdQ.push(reply); //Add reply to cmdQ

    }

}



function getSettings() {

    getParam(MNT.DRV1, DRV.NVM);

    //getParam(MNT.DRV2, DRV.NVM);

}



function showErr(err) {

    console.log("Error: errcode=" + err);

    switch (err) {

        case ERR_CMD_TRGT_DRV:

            alert("Error: command does not specify target drive (e.g. '[v15.0]' should be '[1v15.0]' or '[2v15.0]')");

            break;

    }

}



function getMillis() {

    return (new Date().getTime() - start);

}



function startSlew(t, d) { //t: target drive, d: drive direction

    cmdQ.push(t + DRV.ACC + Math.floor(accSlew)); //Set slew acc

    cmdQ.push(t + DRV.VEL + d + Math.floor(slewVel)); //Set slew vel

    sendCmd();

}



function stopSlew(t) { //t: target drive

    if (t == MNT.DRV1 && trackVel != 0) { //Resume tracking after slew if RA axis and tracking enabled

        cmdQ.push(t + DRV.VEL + trackVel);

    } else {

        cmdQ.push(t + DRV.VEL + "0");

    }

    cmdQ.push(t + DRV.ACC + Math.floor(accAutoGuide));

    sendCmd();

}



function setSlewVel(v) { //v: slew velocity (arcsecs/sec)

    slewVel = v;

    consoleWrite("Set slew vel=" + slewVel + " arcsecs/sec");

}



function setHemisphere(h) { //h: hemisphere

    console.log("Set hemisphere=" + (h == HEM.N ? "NORTH" : "SOUTH"));

    hemisphere = h;

    cmdQ.push(MNT.DRV1 + DRV.DIR + h);

    cmdQ.push(MNT.DRV2 + DRV.DIR + h);

    sendCmd();

}



function setTrackVel(v) { //v: velocity (arcsecs/sec)

    console.log("setTrackVel(" + v + ")");

    trackVel = v;

    cmdQ.push(MNT.DRV1 + DRV.VTR + v); //RA axis track rate

    cmdQ.push(MNT.DRV2 + DRV.VTR + "0"); //Dec axis stationary

    sendCmd();

}



function setGuideVel(v) { //v: velocity (arcsecs/sec)

    console.log("setGuideVel(" + v + ")");

    cmdQ.push(MNT.DRV1 + DRV.VGD + v);

    cmdQ.push(MNT.DRV2 + DRV.VGD + v);

    sendCmd();

}



function setLed(l, b) { //l: led identifier, b: brightness (0-255)

    console.log("setLed(" + l + "," + b + ")");

    switch (l) {

        case IO.PS:

            cmdQ.push(MNT.DRV1 + DRV.I_O + IO.PS + b); //PS on RA drive

            cmdQ.push(MNT.DRV2 + DRV.I_O + IO.PS + "0"); //No PS on Dec drive

            break;

        case IO.TRK:

            cmdQ.push(MNT.DRV1 + DRV.I_O + IO.TRK + b); //RA drive tracking

            cmdQ.push(MNT.DRV2 + DRV.I_O + IO.TRK + "0"); //Dec drive not tracking

            break;

        case IO.STS:

            cmdQ.push(MNT.DRV1 + DRV.I_O + IO.STS + b);

            cmdQ.push(MNT.DRV2 + DRV.I_O + IO.STS + b);

            break;

    }

    sendCmd();

}



function setBuzzer(v) { //v: volume (0-255)

    console.log("setBuzzer(" + v + ")");

    cmdQ.push(MNT.DRV1 + DRV.I_O + IO.BUZ + v);

    cmdQ.push(MNT.DRV2 + DRV.I_O + IO.BUZ + v);

    sendCmd();

}



function trkAlg(a) { //a: algorithm (0 | 1 | 2)

    console.log("trkAlg(" + a + ")");

    cmdQ.push(MNT.DRV1 + DRV.SRVM + a); //RA tracking

    cmdQ.push(MNT.DRV2 + DRV.SRVM + "0"); //Dec no tracking

    sendCmd();

}



function encCal() {

    cmdQ.push(MNT.DRV1 + DRV.ENC_CAL);

    cmdQ.push(MNT.DRV2 + DRV.ENC_CAL);

    sendCmd();

    alert("Calibrate Encoders. For each drive:\n 1. Blue led single flash: rotate wheel slowly until,\n 2. Blue led double flash: rotate wheel back and forth through index mark until led steady green.");

}



function encSig() {

    getParam(MNT.DRV1, DRV.ENC_SIG);

    getParam(MNT.DRV2, DRV.ENC_SIG);

    sendCmd();

}



function getParam(t, p) { //t: target drive, p: param

    cmdQ.push(t + p + "?");

    sendCmd();

}