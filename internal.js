//This work is licensed under the Creative Commons Attribution-ShareAlike 4.0 International License. To view a copy of this license, visit http://creativecommons.org/licenses/by-sa/4.0/ or send a letter to Creative Commons, PO Box 1866, Mountain View, CA 94042, USA.
//Modified by Jerry Li, 17/10/2021

var lineNum = 0;

function onPageLoad() {
    connectToMount(self.location.host);
}

function connectToMount(path) {
    //***NB: ws declared as var or const doesn't work!***
    //ws = new WebSocket('ws://2.57.80.43:81');	//Client side
    //ws = new WebSocket('ws://' + self.location.host + ':81'); //Server side
    ws = new WebSocket('ws://' + path + ':81');
    consoleWrite("Connecting to AstroTrac 360 (ws://" + path + ":81/)...");

    ws.onopen = function(e) {
        consoleWrite("Connected to AstroTrac 360 (" + e.currentTarget.url + ")");
        init();
    }

    ws.onclose = function(e) { consoleWrite("Disconnected from AstroTrac 360 (" + e.currentTarget.url + "," + e.code + ")"); }
    ws.onerror = function(e) { consoleWrite("AstroTrac 360 WS error! (check: power, WiFi network, IP address)"); }

    ws.onmessage = function(e) { //Receive cmd
        var cmd = e.data;
        $("#connectStatusText").text("CONNECTED");
        if (cmd != undefined && cmd != "") { //Process cmd queue
            curMillis = getMillis();
            console.log("Received: '" + cmd + "' (" + (curMillis - lastMillis) + " ms)");
            consoleWrite("Received: '" + cmd + "' (" + (curMillis - lastMillis) + " ms)");
            processCmd(cmd);
            sendCmd(); //Send next queued cmd/reply
        }
    }
}

window.addEventListener('mouseover', function onFirstHover() {
    window.USER_CAN_HOVER = true;
    window.removeEventListener('mouseover', onFirstHover, false);
}, false);

function init() {
    var N = document.getElementById("north");
    var S = document.getElementById("south");
    var E = document.getElementById("east");
    var W = document.getElementById("west");

    //https://www.w3.org/TR/pointerevents/#examples
    //https://mobiforge.com/design-development/html5-pointer-events-api-combining-touch-mouse-and-pen
    //https://danielcwilson.com/blog/2016/06/pointer-events/
    //https://codeburst.io/the-only-way-to-detect-touch-with-javascript-7791a3346685
    //show successful connection
    //Handle slew buttons correctly on both mouse and touch devices
    if (window.PointerEvent) {
        consoleWrite("Debug: Pointer events supported");

        N.addEventListener("pointerdown", downN, false);
        N.addEventListener("pointerup", upNS, false);

        S.addEventListener("pointerdown", downS, false);
        S.addEventListener("pointerup", upNS, false);

        E.addEventListener("pointerdown", downE, false);
        E.addEventListener("pointerup", upEW, false);

        W.addEventListener("pointerdown", downW, false);
        W.addEventListener("pointerup", upEW, false);

        console.log("window.USER_CAN_HOVER=" + window.USER_CAN_HOVER);
        if (!window.USER_CAN_HOVER) { //Prevent mouse from firing touch events when leaving slew buttons
            //Handle touch leaving slew button before up event
            //N.addEventListener("pointerout", upNS, false);
            //N.addEventListener("pointerleave", upNS, false);
            //S.addEventListener("pointerout", upNS, false);
            //S.addEventListener("pointerleave", upNS, false);
            //E.addEventListener("pointerout", upEW, false);
            //E.addEventListener("pointerleave", upEW, false);
            //W.addEventListener("pointerout", upEW, false);
            //W.addEventListener("pointerleave", upEW, false);
        }

    } else {
        consoleWrite("Debug: Pointer events not supported");

        N.addEventListener("mousedown", downN, false);
        N.addEventListener("touchstart", downN, false);
        N.addEventListener("mouseup", upNS, false);
        N.addEventListener("touchend", upNS, false);

        S.addEventListener("mousedown", downS, false);
        S.addEventListener("touchstart", downS, false);
        S.addEventListener("mouseup", upNS, false);
        S.addEventListener("touchend", upNS, false);

        E.addEventListener("mousedown", downE, false);
        E.addEventListener("touchstart", downE, false);
        E.addEventListener("mouseup", upEW, false);
        E.addEventListener("touchend", upEW, false);

        W.addEventListener("mousedown", downW, false);
        W.addEventListener("touchstart", downW, false);
        W.addEventListener("mouseup", upEW, false);
        W.addEventListener("touchend", upEW, false);
    }
    getSettings(); //Request from drive
    loadUserSetting();
    disableControls(false);
}

function downN(e) {
    e.preventDefault();
    //consoleWrite(e.type);
    startSlew(MNT.DRV2, DIR.N);
}

function upNS(e) {
    e.preventDefault();
    stopSlew(MNT.DRV2);
}

function downS(e) {
    e.preventDefault();
    startSlew(MNT.DRV2, DIR.S);
}

function downE(e) {
    e.preventDefault();
    startSlew(MNT.DRV1, DIR.E);
}

function upEW(e) {
    e.preventDefault();
    stopSlew(MNT.DRV1);
}

function downW(e) {
    e.preventDefault();
    startSlew(MNT.DRV1, DIR.W);
}

/* Custom Tab Click */
$(document).ready(function() {
    tab1 = $('#custom-tabs__home');
    tab2 = $('#custom-tabs__settings');
    tab1container = $('#home');
    tab2container = $('#settings');

    tab1.click(function() {
        tab2container.hide();
        tab1container.show();
        tab2.removeClass('active');
        tab1.addClass('active');
    });

    tab2.click(function() {
        tab1container.hide();
        tab2container.show();
        tab1.removeClass('active');
        tab2.addClass('active');
    })

})

/* Toggle Screen Fullscreen */
function toggleFullScreen() {
    var doc = window.document;
    var docEl = doc.documentElement;

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        requestFullScreen.call(docEl);
    } else {
        cancelFullScreen.call(doc);
    }
}

/* Toggle Console */
$('select[name="consoleSwitch"]').change(function() {
    $this = $(this);
    if ($this.val() == 'on') {
        $('#placeholder').removeClass('hide');
    } else {
        $('#placeholder').addClass('hide');
    }
});

function goToM31() {
    var raDest = hmsToDecimal("00:42:44");
    var decDest = dmsToDecimal('+41 16 9 ');
    // var decDest = 41.26916666666666;
    GOTOTarget(raDest, decDest, "M31");
}

/* Sliders */
$(document).ready(function() {
    $("#slewSlider").change(function() {
        var rate;
        switch (parseInt($(this).slider().val())) {
            case 1:
                rate = 0.5 * SID_VEL;
                break;
            case 2:
                rate = 24 * SID_VEL;
                break;
            case 3:
                rate = 64 * SID_VEL;
                break;
            case 4:
                rate = 720 * SID_VEL;
                break;
        }
        setSlewVel(rate);
    });

    $("#psLedSlider").on('slidestop', function() {
        setLed(IO.PS, $(this).slider().val());
    });

    $("#trackingLedSlider").on('slidestop', function() {
        setLed(IO.TRK, $(this).slider().val());
    });

    $("#statusLedSlider").on('slidestop', function() {
        setLed(IO.STS, $(this).slider().val());
    });

    $("#volumeSlider").on('slidestop', function() {
        setBuzzer($(this).slider().val());
    });
    var tab = getUrlParameter('tab');
    if (tab == 'settings') {
        $('#custom-tabs__settings').click();
    }
    //enable alignment command btn
    $("#alignSubmitBtn").click(function() {
        var RAIn = $("#alignRAInput").val();
        var DECIn = $("#alignDECInput").val();
        if ((RAIn != "") && (DECIn != "")) {
            startAlignment(RAIn, DECIn);
        } else {
            consoleWrite("Incomplete RA, DEC inputs for alignment");
        }
    });
    //enable goto command btn
    $("#gotoSubmitBtn").click(function() {
        var RAIn = $("#gotoRAInput").val();
        var DECIn = $("#gotoDECInput").val();
        if ((RAIn != "") && (DECIn != "")) {
            startGoto(RAIn, DECIn);
        } else {
            consoleWrite("Incomplete RA, DEC inputs for Goto");
        }
    });
    //M31 button
    $("#goToM31Btn").click(goToM31);
    $("#goToHomeBtn").click(goToHome);
    $("#abortBtn").click(function() {
        stopSlew(MNT.DRV1);
        stopSlew(MNT.DRV2);
    });
    $("#calibrateRAEncoderBtn").click(function() {
        if (window.confirm("Are you sure you want to recalibrate the RA unit's encoders, and the mount is in the correct position?")) {
            calibrateRA();
        }
    });
    $("#calibrateDEEncoderBtn").click(function() {
        if (window.confirm("Are you sure you want to recalibrate the DEC unit's encoders, and the mount is in the correct position?")) {
            calibrateDE();
        }
    });
    //Connect button
    $("#connectBtn").click(function() {
        var mountPath = $("#connectIPInput").val();
        mountPath = mountPath.trim();
        connectToMount(mountPath);
    });
});

//Enabling Url Tabs
var getUrlParameter = function getUrlParameter(sParam) {
    var sPageURL = window.location.search.substring(1),
        sURLVariables = sPageURL.split('&'),
        sParameterName,
        i;

    for (i = 0; i < sURLVariables.length; i++) {
        sParameterName = sURLVariables[i].split('=');

        if (sParameterName[0] === sParam) {
            return sParameterName[1] === undefined ? true : decodeURIComponent(sParameterName[1]);
        }
    }
};

// $(document).ready(function() {
//     var tab = getUrlParameter('tab');
//     if (tab == 'settings') {
//         $('#custom-tabs__settings').click();
//     }
//     //enable alignment command btn
//     $("#alignSubmitBtn").click(function() {
//         var RAIn = $("#alignRAInput").val();
//         var DECIn = $("#alignRAInput").val();
//         if ((RAIn != "") && (DECIn != "")) {
//             startAlignment(RAIn, DECIn);
//         } else {
//             consoleWrite("Incomplete RA, DEC inputs for alignment");
//         }
//     });
//     //M31 button
//     $("#goToM31Btn").click(goToM31);
//     //Connect button
//     $("#connectBtn").click(function() {
//         var mountPath = $("#connectIPInput").val();
//         mountPath = mountPath.trim();
//         connectToMount(mountPath);
//     });
// });

//Hide Toggle FullScreen Button on iOS devices
$(document).ready(function() {
    var appleDevices = ['iPad', 'iPhone', 'iPod'];
    if (appleDevices.indexOf(navigator.platform) > -1) {
        $(".ui-btn-right").hide();
        $("body").addClass('ios');
    }
});

//Cmd terminal
$(document).on('keyup', '#term', function(e) {
    var keyPressed = e.which || e.keyCode;
    if (keyPressed === 13) {
        var v = $("#term").val();
        if (v != '') {
            cmdQ.push(v.toLowerCase()); //Mobile device may capitalise letters
            sendCmd();
            $("#term").val('');
        }
    }
});

var setDefaultValues = function(defaults) {
    var initVals = defaults.split(",");
    console.log("VGD=" + initVals[0]);
    console.log("BUZ=" + initVals[1]);
    console.log("SRVM=" + initVals[2]);
    console.log("VTR=" + initVals[3]);
    console.log("LED1=" + initVals[4]);
    console.log("LED2=" + initVals[5]);
    console.log("LED3=" + initVals[6]);
    console.log("HEM=" + initVals[7]);
    console.log("VER=" + initVals[8]);

    $("#slewSlider").val(4).slider("refresh");
    $("#psLedSlider").val(initVals[4]).slider("refresh");
    $("#trackingLedSlider").val(initVals[5]).slider("refresh");
    $("#statusLedSlider").val(initVals[6]).slider("refresh");
    $("#volumeSlider").val(initVals[1]).slider("refresh");
    $("#consoleSwitch").val("on").slider("refresh");

    switch (parseFloat(initVals[3])) {
        case 15.0:
            $("#track_sidereal").prop("checked", true);
            break;
        case 14.64:
            $("#track_lunar").prop("checked", true);
            break;
        case 14.955:
            $("#track_solar").prop("checked", true);
            break;
        case 7.5:
            $("#track_0_5x").prop("checked", true);
            break;
        case 0:
            $("#track_off").prop("checked", true);
            break;
    }

    switch (parseFloat(initVals[0])) { //Guide rate units arcsecs/sec
        case 1.5:
            $("#guide_0_1x").prop("checked", true);
            break;
        case 3.75:
            $("#guide_0_25x").prop("checked", true);
            break;
        case 7.5:
            $("#guide_0_5x").prop("checked", true);
            break;
    }

    if (initVals[7] == 1) {
        $("#hem_N").prop("checked", true);
    } else {
        $("#hem_S").prop("checked", true);
    }

    switch (initVals[2]) {
        case '1':
            $("#trkAlg_1").prop("checked", true);
            break;
        case '2':
            $("#trkAlg_2").prop("checked", true);
            break;
    }

    $("input[type='radio']").checkboxradio("refresh"); //Refresh all Radio Buttons
}

function consoleWrite(str) {
    lineNum++;
    var innerHTML = document.getElementById("placeholder").innerHTML;
    document.getElementById("placeholder").innerHTML = lineNum + ": " + str + "<br/>" + innerHTML;
}

function disableControls(isDisabled) {
    document.getElementById("west").disabled = isDisabled;
    document.getElementById("east").disabled = isDisabled;
    document.getElementById("north").disabled = isDisabled;
    document.getElementById("south").disabled = isDisabled;
    document.getElementById("guide").disabled = isDisabled;
    document.getElementById("centre").disabled = isDisabled;
    document.getElementById("move").disabled = isDisabled;
    document.getElementById("slew").disabled = isDisabled;
    document.getElementById("track_sidereal").disabled = isDisabled;
    document.getElementById("track_lunar").disabled = isDisabled;
    document.getElementById("track_solar").disabled = isDisabled;
    document.getElementById("track_0_5x").disabled = isDisabled;
    document.getElementById("track_off").disabled = isDisabled;
    document.getElementById("trkAlg_1").disabled = isDisabled;
    document.getElementById("trkAlg_2").disabled = isDisabled;
    document.getElementById("hem_N").disabled = isDisabled;
    document.getElementById("hem_S").disabled = isDisabled;
    document.getElementById("psLedSlider").disabled = isDisabled;
    document.getElementById("trackingLedSlider").disabled = isDisabled;
    document.getElementById("statusLedSlider").disabled = isDisabled;
    document.getElementById("volumeSlider").disabled = isDisabled;
    document.getElementById("update_firmware").disabled = isDisabled;
    document.getElementById("enc_cal").disabled = isDisabled;
    document.getElementById("enc_sig").disabled = isDisabled;
}