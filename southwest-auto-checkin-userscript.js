// ==UserScript==
// @name           Auto Check-In to Southwest Flights
// @namespace      https://github.com/levydvm/southwest-auto-checkin/
// @version        2.0
// @description    Automatically check in to Southwest Airline flights at the appropriate time.
// @icon           https://www.google.com/s2/favicons?domain=southwest.com
// @downloadURL    https://cdn.jsdelivr.net/gh/levydvm/southwest-auto-checkin/southwest-auto-checkin-userscript.js
// @include        https://www.southwest.com/air/check-in/
// @include        https://www.southwest.com/air/check-in/*
// @include        https://southwest.com/air/check-in/
// @include        https://southwest.com/air/check-in/*
// @exclude        *southwest.com/air/check-in/confirmation*
// @license        GPL version 3 or any later version; http://www.gnu.org/copyleft/gpl.html
// @run-at         document-idle
// @require        http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @require        https://gist.github.com/raw/2625891/waitForKeyElements.js
// @grant          GM_addStyle
// ==/UserScript==
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// You should have received a copy of the GNU General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.
//
// Based on original script by Nicholas Buroojy (https://userscripts-mirror.org/users/83813), modified under GPL version 3
//
// 10/2012 Ryan Izzo  (ryanizzo.com)
//   Updated to use new Southwest Check In page, added validation
// version 1.2
//
// 8/2019 Updated to work on latest site version and use Southwest's server time
//
//
// TODO: Test select passenger page with >1 passenger.
// TODO: Test select passenger page with international flights.
// Error handling

////////// GET SOUTHWEST.COM SERVER TIME ///////////

var xmlHttp;
function srvTime(){
    try {
        //FF, Opera, Safari, Chrome
        xmlHttp = new XMLHttpRequest();
    }
    catch (err1) {
        //IE
        try {
            xmlHttp = new ActiveXObject('Msxml2.XMLHTTP');
        }
        catch (err2) {
            try {
                xmlHttp = new ActiveXObject('Microsoft.XMLHTTP');
            }
            catch (eerr3) {
                //AJAX not supported, use CPU time.
                alert("AJAX not supported");
            }
        }
    }
    xmlHttp.open('HEAD',window.location.href.toString(),false);
    xmlHttp.setRequestHeader("Content-Type", "text/html");
    xmlHttp.send('');
    return xmlHttp.getResponseHeader("Date");
}

////////////// WAIT FOR PAGE TO LOAD BEFORE RUNNING SCRIPT ///////////////////////

/* waitForKeyElements ('.retrieve-reservation-form-container--placements', actionFunction); */
waitForKeyElements ('.container', actionFunction, true);

function actionFunction (jNode) {

/////////////  CHECK IN PAGE  ////////////////

// declare global variables
var globalSubmitDate;
var confNumber
var firstName
var lastName

/**
 * @brief Submit the check in form on the Southwest Check In Online page.
 */
function submitNow()
{
	try{
		//alert(msRemaining + " " + globalSubmitDate);
		////old method - form submit (deprecated)
        //var form = document.getElementsByClassName('form confirmation-number-form')[0];
		//form.submit();

        ////alt method - use URL redirection
        //window.location.href = "https://www.southwest.com/air/check-in/review.html?confirmationNumber="+confNumber+"&passengerFirstName="+firstName+"&passengerLastName="+lastName+"&clk=HOME-BOOKING-WIDGET-AIR-CHECKIN";

        ////new method - use jQuery to trigger click
        var checkinbutton = document.getElementsByClassName('confirmation-number-form--submit-button')[0];
        $(checkinbutton).trigger('click');
        autoPassengerPage();
        return;
	}
	catch(e){
		 alert('A submit error has occurred: '+e.message)
	}
}
/**Get URL variables */
function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });
    return vars;
}
function getUrlParam(parameter, defaultvalue){
    var urlparameter = defaultvalue;
    if(window.location.href.indexOf(parameter) > -1){
        urlparameter = getUrlVars()[parameter];
        }
    return urlparameter;
}

/**
 * @brief Display the countdown.
 *
 * TODO: Some formatting is wrong eg ("1:0:12" means 1 hour and 12 seconds remain). Make sure everything is represented with 2 digits.
 */
function displayCountdown()
{
	try{
		var area = document.getElementById("countdown");
        var timeNow = srvTime();
		var timeRemain = globalSubmitDate - new Date(timeNow);
		var days = Math.floor(timeRemain / (1000 * 60 * 60 * 24));
		var hours = Math.floor(timeRemain / (1000 * 60 * 60)) % 24;
		var minutes = Math.floor(timeRemain / (1000 * 60)) % 60;
		//round to the nearest second
		var seconds = Math.round(timeRemain / 1000) % 60;
		//Don't print negative time.
		if (hours == 0 && minutes == 0 && seconds == 0 )
		{
			area.innerHTML = "Checking In...";
			return;
		}
        if (hours < 0 || minutes < 0 || seconds < 0)
		{
			return;
		}
		area.innerHTML = "Time Remaining: <strong>";
		//If 0 days remain, omit them.
		if (days != 0) {
			area.innerHTML += days + "d ";
        }
		//If 0 hours remain, omit them.
		if (hours != 0) {
			area.innerHTML += hours + "h ";
        }
		//Add padding to minute
		if (minutes !=0 ) {
			//area.innerHTML += "0";
			area.innerHTML += minutes + "m ";
        }
		//Add padding to second
		//if (seconds < 10)
			//area.innerHTML += "0";
		area.innerHTML += seconds;
		area.innerHTML += "s</strong>";
	}
	catch(e){
		// alert('A countdown error has occurred: '+e.message)
        return;
	}
}


/**
 * @brief Updates the countdown every second.
 */
function displayCountdownWrapper()
{
	try{
		window.setInterval(displayCountdown, 1000);
	}
	catch(e){
		 alert('A display error has occurred: '+e.message)
	}
}


/**
 * @brief Begins the delay at the next even second.
 */
function beginDelay()
{
	try{
		confNumber = document.getElementById("confirmationNumber").value;
		firstName = document.getElementById("passengerFirstName").value;
		lastName = document.getElementById("passengerLastName").value;

		var month = document.getElementById("month-input").value;
		var day = document.getElementById("day-input").value;
		var year = document.getElementById("year-input").value;

		var hour = document.getElementById("hour-input").value;
		var minute = document.getElementById("minute-input").value;
		var second = document.getElementById("second-input").value;

		if(confNumber == "" || firstName == "" || lastName == "" ){
			alert("Must fill out Confirmation Number and Name.");
		}
		else if(month == "" || month == "mm" || day == "" || day == "dd" || year == "" || year == "yyyy"
			|| hour == "" || hour == "hh" || minute == "" || minute == "mm" || second == "" ){
			alert("Must fill out Date and Time.");
		}
		else if(year.length < 4 ){
			alert("Year must be 4 characters.");
		}
		else{
			//Build a date
			var submitDate = new Date();
			submitDate.setMonth(month - 1);
			submitDate.setDate(day);
			submitDate.setFullYear(year);
			submitDate.setHours(hour);
			submitDate.setMinutes(minute);
			submitDate.setSeconds(second);
			submitDate.setMilliseconds(0);

			// var now = new Date();
            var st = srvTime();
            var now = new Date(st);

			var msRemaining = submitDate - now;
			//alert(submitDate + " - " + now + " = " + msRemaining);
            //alert(confNumber);
            //alert(firstName+" "+lastName);
			var maxDays = 14;
			if(msRemaining < 0) {
				alert("Date/Time must be in the future.");
            }
			else if(msRemaining > maxDays * 1000 * 60 * 60 * 24) {
				alert("Date/Time cannot be more than " + maxDays + " days in the future.");
            }
			else{
				//Install the timeout to submit the form.
				window.setTimeout(submitNow, msRemaining);

				globalSubmitDate = submitDate;

				//Install a short term timeout to call the countdown wrapper at the beginning of the next second.
				window.setTimeout(displayCountdownWrapper, msRemaining % 1000);
			}
		}
	}
	catch(e){
		 alert('An start error has occurred: '+e.message)
        return;
	}
}

/**
 * @brief Edits the check in page; Adds Date, time, and Auto Check In button
 *
 * TODO Error handling. (Auto notify the developer when southwest page changes)
 */

function checkInPageFormEdit()
{
	try{
		var rightPanel = document.getElementsByClassName('retrieve-reservation-form-container--form-area')[0];

        //// hide adds to make room for our div
        document.getElementsByClassName('retrieve-reservation-form-container--placements')[0].setAttribute("style","display:none !important;");

		//All of our stuff will go in this div.

		var delayDiv = document.createElement("div");
		delayDiv.setAttribute('id','checkInDelay');
        delayDiv.setAttribute('style','display: inline-block; margin-left: 30px; width: 352px;');
        delayDiv.setAttribute('class','form-container');
		var dateSelect = document.createElement("div");
		dateSelect.setAttribute('id','date-select');

		//The big label at the top of the menu

		var mainLabel = document.createElement("h2");
		mainLabel.setAttribute('class','heading heading_medium retrieve-reservation-form-container--form-title');
		mainLabel.innerHTML = "Auto Check In";
		dateSelect.innerHTML += "<br/>";
		dateSelect.appendChild(mainLabel);
        dateSelect.innerHTML += "Set check-in date and time below.<br /><br /><div class=\"form--required\"><span class=\"form--required-indicator\">*</span>Required</div>";

		//The date portion.
        var dateInput = document.createElement("div");
        dateInput.setAttribute('class','form-control form-control_full');
		var dateLabel = document.createElement("span");
        dateLabel.setAttribute('class','form-control--label');
		dateLabel.innerHTML = "Date<span class=\"required\">*</span><br />";

		var monthInput = document.createElement("input");
		var monthText = getUrlParam('month','mm');
		monthInput.setAttribute('id','month-input');
		monthInput.setAttribute('type','text');
		monthInput.setAttribute('maxlength','2');
		monthInput.setAttribute('size','2');
		monthInput.setAttribute('value',monthText);
		monthInput.setAttribute('onfocus','if(this.value==\'mm\') this.value=\'\';');
		monthInput.setAttribute('style','width:auto !important');
		monthInput.setAttribute('tabindex','5');
        monthInput.setAttribute('class','input_left input--text input_primary');

		var dayInput = document.createElement("input");
		var dayText = getUrlParam('day','dd');
		dayInput.setAttribute('id','day-input');
		dayInput.setAttribute('type','text');
		dayInput.setAttribute('maxlength','2');
		dayInput.setAttribute('size','2');
		dayInput.setAttribute('value',dayText);
		dayInput.setAttribute('onfocus','if(this.value==\'dd\') this.value=\'\';');
		dayInput.setAttribute('tabindex','6');
        dayInput.setAttribute('class','input_left input--text input_primary');
        dayInput.setAttribute('style','width:auto !important');

		var yearInput = document.createElement("input");
		var yearText = getUrlParam('year','yyyy');
		yearInput.setAttribute('id','year-input');
		yearInput.setAttribute('type','text');
		yearInput.setAttribute('maxlength','4');
		yearInput.setAttribute('size','4');
		yearInput.setAttribute('value',yearText);
		yearInput.setAttribute('onfocus','if(this.value==\'yyyy\') this.value=\'\';');
		yearInput.setAttribute('tabindex','7');
        yearInput.setAttribute('class','input_left input--text input_primary');
        yearInput.setAttribute('style','width:auto !important');

		dateInput.appendChild(dateLabel);
        dateInput.innerHTML += "<br />";
		dateInput.appendChild(monthInput);
		dateInput.innerHTML += "/";
		dateInput.appendChild(dayInput);
		dateInput.innerHTML += "/";
		dateInput.appendChild(yearInput);
        dateSelect.appendChild(dateInput);

		// The time portion.
        var timeInput = document.createElement("div");
        timeInput.setAttribute('class','form-control form-control_full');
		var timeLabel = document.createElement("span");
        timeLabel.setAttribute('class','form-control--label');
		timeLabel.innerHTML = "Time (24-hour format)<span class=\"required\">*</span><br />";

		var hourInput = document.createElement("input");
		var hourText = getUrlParam('hour','hh');
		hourInput.setAttribute('id','hour-input');
		hourInput.setAttribute('type','text');
		hourInput.setAttribute('maxlength','2');
		//hourInput.setAttribute('style','margin-left:10px');
		hourInput.setAttribute('size','2');
		hourInput.setAttribute('value',hourText);
		hourInput.setAttribute('onfocus','if(this.value==\'hh\') this.value=\'\';');
		hourInput.setAttribute('tabindex','8');
        hourInput.setAttribute('class','input_left input--text input_primary');
        hourInput.setAttribute('style','width:auto !important');

		var minuteInput = document.createElement("input");
		var minuteText = getUrlParam('minute','mm');
		minuteInput.setAttribute('id','minute-input');
		minuteInput.setAttribute('type','text');
		minuteInput.setAttribute('maxlength','2');
		minuteInput.setAttribute('size','2');
		minuteInput.setAttribute('value',minuteText);
		minuteInput.setAttribute('onfocus','if(this.value==\'mm\') this.value=\'\';');
		minuteInput.setAttribute('tabindex','9');
        minuteInput.setAttribute('class','input_left input--text input_primary');
        minuteInput.setAttribute('style','width:auto !important');

		var secondInput = document.createElement("input");
		var secondText = getUrlParam('second','00');
		secondInput.setAttribute('id','second-input');
		secondInput.setAttribute('type','text');
		secondInput.setAttribute('maxlength','2');
		secondInput.setAttribute('size','2');
		secondInput.setAttribute('value',secondText);
		secondInput.setAttribute('tabindex','10');
        secondInput.setAttribute('class','input_left input--text input_primary');
        secondInput.setAttribute('style','width:auto !important');

		timeInput.appendChild(timeLabel);
        timeInput.innerHTML += "<br />";
		timeInput.appendChild(hourInput);
		timeInput.innerHTML += ":";
		timeInput.appendChild(minuteInput);
		timeInput.innerHTML += ":";
		timeInput.appendChild(secondInput);
        dateSelect.appendChild(timeInput);

		delayDiv.appendChild(dateSelect);

		delayDiv.innerHTML += "<br/><br />";

		// The area that displays how much time remains before the form is submitted.

		var countdownArea = document.createElement("span");
		countdownArea.setAttribute('id','countdown');
		countdownArea.innerHTML = "Click to start countdown";

		delayDiv.appendChild(countdownArea);

		// Auto Check In button

		var delayButton = document.createElement("input");
		delayButton.setAttribute('id','delay-button');
        delayButton.setAttribute('class','actionable actionable_button actionable_large-button actionable_no-outline actionable_primary button submit-button');
		delayButton.setAttribute('type','button');
		delayButton.setAttribute('style','background-color: #FF3300 !important; color: white !important');
		delayButton.setAttribute('value','Auto Check In');
		delayButton.addEventListener("click", beginDelay, true);
		delayButton.setAttribute('tabindex','11');

		delayDiv.appendChild(delayButton);

		rightPanel.appendChild(delayDiv);
		var autostart = getUrlParam('autostart','false');
		if(autostart == 'true') { $(delayButton).trigger('click');}
	}
	catch(e){
		 alert('An error has occurred: '+e.message)
	}
}

/////////////  SELECT PASSENGER PAGE  ////////////////

//automatically select all passengers and submit the form

function autoPassengerPage()
{
	waitForKeyElements ('.air-check-in-review-results--check-in-button', actionFunction2);
    function actionFunction2 (jNode) {
    try{
		//find error notification
		if(document.title == "Error") {
			return;
        }
/* DEPRECATED
		// Check all the check boxes.
		var node_list = document.getElementsByTagName('input');
		for (var i = 0; i < node_list.length; i++) {
			var node = node_list[i];
			if (node.getAttribute('type') == 'checkbox') {
				node.checked = true;
			}
		}
*/
		//Click the "Check in" button using jQuery
		var button = document.getElementsByClassName("air-check-in-review-results--check-in-button")[0];
		$(button).trigger('click');
	}
	catch(e){
		 alert('An error has occurred: '+e.message);
	}
    }
}

//case of the select boarding pass page (regex match the url)

    if(/review/.test(document.location.href))
{
        autoPassengerPage();
    }

//case of the check in page
else if(/check-in/.test(document.location.href))
{
	waitForKeyElements ('.retrieve-reservation-form-container--placements', checkInPageFormEdit);
}
    // close function delaying execution until page loaded
}
