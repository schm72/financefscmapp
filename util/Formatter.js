jQuery.sap.declare("com.springer.financefscmapp.util.Formatter");
jQuery.sap.require("com.springer.financefscmapp.util.DateHandler");
jQuery.sap.require("sap.ui.core.format.NumberFormat");

com.springer.financefscmapp.util.Formatter = {

	uppercaseFirstChar: function(sStr) {
		return sStr.charAt(0).toUpperCase() + sStr.slice(1);
	},

	discontinuedStatusState: function(sDate) {
		return sDate ? "Error" : "None";
	},

	discontinuedStatusValue: function(sDate) {
		return sDate ? "Discontinued" : "";
	},

	currencyValue: function(value) {
		var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
			maxFractionDigits: 2,
			groupingEnabled: true,
			groupingSeparator: ".",
			decimalSeparator: ","
		});
		return oNumberFormat.format(value);
	},
	currencyInt: function(value) {
		var oNumberFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
			maxFractionDigits: 0,
			groupingEnabled: true,
			groupingSeparator: ".",
			decimalSeparator: ","
		});
		return oNumberFormat.format(value);
	},

	dateSimple: function(value) {
		if (!(value instanceof Date) && value.indexOf("Date")) {
			var date = new Date(parseInt(value.substr(6))).format('dd.mm.yyyy HH:mm');
		} else {
			var date = new Date(value).format('dd.mm.yyyy HH:mm');
		}
		return date;
	},
	dateSimple2: function(value) {
		if (!value || typeof value === "undefined") {
			return null;
		}
		if (!(value instanceof Date) && value.indexOf("Date")) {
			var date = new Date(parseInt(value.substr(6))).format('dd.mm.yyyy');
		} else {
			var date = new Date(value).format('dd.mm.yyyy');
		}
		return date;
	},
	MessageState: function(value) {
		switch (value) {
			case "E":
				return sap.ui.core.ValueState.Error;
			case "W":
				return sap.ui.core.ValueState.Warning;
			case "S":
				return sap.ui.core.ValueState.Success;
			default:
				return sap.ui.core.ValueState.None;
		}
	},
	MessageIconSolved: function(value) {
		if (value === "X") {
			return "sap-icon://accept";
		} else {
			return "sap-icon://time-entry-request";
		}
	},
	MessageStateSolved: function(value) {
		if (value === "X") {
			return sap.ui.core.ValueState.Success;
		} else {
			return sap.ui.core.ValueState.Error;
		}
	},
	MessageStateIcon: function(value) {
		switch (value) {
			case "E":
				return "sap-icon://message-error";
			case "W":
				return "sap-icon://message-warning";
			case "S":
				return "sap-icon://message-success";
			case "U":
				//return "sap-icon://person-placeholder";
				return "sap-icon://toaster-top";
			default:
				return "sap-icon://message-information";
		}
	},
	currencyView: function(value) {
		switch (value) {
			case "EUR":
				return "€";
			case "USD":
				return "$";
			default:
				return value;
		}
	},
	delAppId: function(value) {
		return value.replace("financefscmapp", "");
	},
	multiFormatInv: function(amount, currency, docDate) {
		var vCur = currency;
		switch (currency) {
			case "EUR":
				vCur = "€";
				break;
			case "USD":
				vCur = "$";
				break;
		}
		var vAmount = parseFloat(amount).toFixed(0);
		var vDate = docDate.toString().substring(4, 15);
		return "" + vAmount + " " + vCur + " from " + vDate;
	},
	addedFav: function(value) {
		if (value === "X") {
			return true;
		} else {
			return false;
		}
		if (value === "X") {
			return "sap-icon://favorite";
		} else {
			return "sap-icon://unfavorite";
		}
	},
	isSomething: function(value) {
		if (value === "") {
			return false;
		} else {
			return true;
		}
	},

	isGreaterZero: function(value) {
		if (value > 0) {
			return true;
		} else {
			return false;
		}
	},

	getOpenitemIcon: function(value) {
		if (value === "X") {
			return "sap-icon://future";
		} else {
			return "sap-icon://accept";
		}
	},
	OpenitemState: function(value) {
		switch (value) {
			case "X":
				return sap.ui.core.ValueState.Error;
			default:
				return sap.ui.core.ValueState.Success;
		}
	},
	deliveryBlock: function(value) {
		if (value === "X") {
			return "Yes";
		} else {
			return "No";
		}
	},
	overlayTenZero: function(value) {
		value = value + "";
		while (value.length < 10) {
			value = "0" + value;
		}
		return value;
	},

	getLongCountry: function(value) {
		switch (value) {

			case "AE":
				return "United Arab Emirates";

			case "AI":
				return "Anguilla";

			case "AL":
				return "Albania";

			case "AR":
				return "Argentina";

			case "AT":
				return "Austria";

			case "AU":
				return "Australia";

			case "AZ":
				return "Azerbaijan";

			case "BA":
				return "Bosnia and Herzegovina";

			case "BB":
				return "Barbados";

			case "BD":
				return "Bangladesh";

			case "BE":
				return "Belgium";

			case "BG":
				return "Bulgaria";

			case "BH":
				return "Bahrain";

			case "BJ":
				return "Benin";

			case "BN":
				return "Brunei Darussalam";

			case "BR":
				return "Brazil";

			case "BW":
				return "Botswana";

			case "BY":
				return "Belarus";

			case "CA":
				return "Canada";

			case "CH":
				return "Switzerland";

			case "CL":
				return "Chile";

			case "CM":
				return "Cameroon";

			case "CN":
				return "China";

			case "CO":
				return "Colombia";

			case "CY":
				return "Cyprus";

			case "CZ":
				return "Czech Republic";

			case "DE":
				return "Germany";

			case "DK":
				return "Denmark";

			case "DZ":
				return "Algeria";

			case "EC":
				return "Ecuador";

			case "EE":
				return "Estonia";

			case "EG":
				return "Egypt";

			case "ES":
				return "Spain";

			case "ET":
				return "Ethiopia";

			case "FI":
				return "Finland";

			case "FJ":
				return "Fiji";

			case "FO":
				return "Faroe Islands";

			case "FR":
				return "France";

			case "GA":
				return "Gabon";

			case "GB":
				return "United Kingdom";

			case "GD":
				return "Grenada";

			case "GE":
				return "Georgia";

			case "GH":
				return "Ghana";

			case "GL":
				return "Greenland";

			case "GP":
				return "Guadeloupe";

			case "GR":
				return "Greece";

			case "HK":
				return "Hong Kong";

			case "HR":
				return "Croatia";

			case "HU":
				return "Hungary";

			case "ID":
				return "Indonesia";

			case "IE":
				return "Ireland";

			case "IL":
				return "Israel";

			case "IN":
				return "India";

			case "IQ":
				return "Iraq";

			case "IR":
				return "Iran";

			case "IS":
				return "Iceland";

			case "IT":
				return "Italy";

			case "JO":
				return "Jordan";

			case "JP":
				return "Japan";

			case "KE":
				return "Kenya";

			case "KR":
				return "South Korea";

			case "KW":
				return "Kuwait";

			case "KZ":
				return "Kazakhstan";

			case "LB":
				return "Lebanon";

			case "LC":
				return "St. Lucia";

			case "LI":
				return "Liechtenstein";

			case "LK":
				return "Sri Lanka";

			case "LT":
				return "Lithuania";

			case "LU":
				return "Luxembourg";

			case "LV":
				return "Latvia";

			case "LY":
				return "Libya";

			case "MA":
				return "Morocco";

			case "MC":
				return "Monaco";

			case "MD":
				return "Moldova";

			case "ME":
				return "Republic of Montenegro";

			case "MK":
				return "Macedonia";

			case "MN":
				return "Mongolia";

			case "MO":
				return "Macau";

			case "MT":
				return "Malta";

			case "MU":
				return "Mauritius";

			case "MX":
				return "Mexico";

			case "MY":
				return "Malaysia";

			case "MZ":
				return "Mozambique";

			case "NA":
				return "Namibia";

			case "NG":
				return "Nigeria";

			case "NL":
				return "Netherlands";

			case "NO":
				return "Norway";

			case "NZ":
				return "New Zealand";

			case "OM":
				return "Oman";

			case "PE":
				return "Peru";

			case "PH":
				return "Philippines";

			case "PK":
				return "Pakistan";

			case "PL":
				return "Poland";

			case "PT":
				return "Portugal";

			case "QA":
				return "Qatar";

			case "RE":
				return "Reunion";

			case "RO":
				return "Romania";

			case "RS":
				return "Republic of Serbia";

			case "RU":
				return "Russian Federation";

			case "SA":
				return "Saudi Arabia";

			case "SD":
				return "Sudan";

			case "SE":
				return "Sweden";

			case "SG":
				return "Singapore";

			case "SI":
				return "Slovenia";

			case "SK":
				return "Slovakia";

			case "SN":
				return "Senegal";

			case "SY":
				return "Syria";

			case "TH":
				return "Thailand";

			case "TN":
				return "Tunisia";

			case "TO":
				return "Tonga";

			case "TR":
				return "Turkey";

			case "TW":
				return "Taiwan";

			case "UA":
				return "Ukraine";

			case "UG":
				return "Uganda";

			case "US":
				return "USA";

			case "UY":
				return "Uruguay";

			case "UZ":
				return "Uzbekistan";

			case "VE":
				return "Venezuela";

			case "VN":
				return "Vietnam";

			case "XK":
				return "Kosovo";

			case "YT":
				return "Mayotte";

			case "ZA":
				return "South Africa";

			case "ZM":
				return "Zambia";

			case "ZW":
				return "Zimbabwe";

			default:
				return value;
		}
	}

};