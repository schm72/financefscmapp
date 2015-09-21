jQuery.sap.declare("com.springer.springerfscmapp.dev.devapp");
jQuery.sap.require("com.springer.springerfscmapp.dev.devlogon");

com.springer.springerfscmapp.dev.devapp = {
	smpInfo: {},
	entityName: null,
	navName: null,
	isLoaded: false,
	externalURL: null,

	//Application Constructor
	initialize: function() {
		var s =
			"{&quot;APP_MESSAGESSet&quot;:&quot;/APP_MESSAGESSet&quot;,&quot;APP_USER_PREFERENCESSet&quot;:&quot;/APP_USER_PREFERENCESSet&quot;,&quot;OPEN_ITEMS_SAVED_INVOICES_PER_USERSet&quot;:&quot;/OPEN_ITEMS_SAVED_INVOICES_PER_USERSet&quot;,&quot;OPEN_ITEMS_SAVED_PER_USERSet&quot;:&quot;/OPEN_ITEMS_SAVED_PER_USERSet&quot;,&quot;ATTACHMENT_INFO_LIST_SVDSet&quot;:&quot;/ATTACHMENT_INFO_LIST_SVDSet&quot;}";
		if (s && s.length > 0) {
			var ps = $("<div/>").html(s).text();
			this.definedStore = JSON.parse(ps);
		}
		this.entityName = "OPEN_ITEM_BP_OVERVIEWSet";
		this.bindEvents();
	},

	//========================================================================
	// Bind Event Listeners
	//========================================================================
	bindEvents: function() {
		//add an event listener for the Cordova deviceReady event.
		document.addEventListener("deviceready", this.onDeviceReady, false);
		document.addEventListener("online", this.deviceOnline, false);
		document.addEventListener("offline", this.deviceOffline, false);
		//document.addEventListener("pause", this.onPause, false);
		//document.addEventListener("resume", this.onResume, false);
	},

	//========================================================================
	//Cordova Device Ready
	//========================================================================
	onDeviceReady: function() {
		console.log("onDeviceReady");
		var that = com.springer.springerfscmapp.dev.devapp;
		$.getJSON(".project.json", function(data) {
			if (data && data.hybrid && data.hybrid.plugins.kapsel.logon.selected) {
				that.smpInfo.server = data.hybrid.msType === 0 ? data.hybrid.hcpmsServer : data.hybrid.server;
				that.smpInfo.port = data.hybrid.msType === 0 ? "443" : data.hybrid.port;
				that.smpInfo.appID = data.hybrid.appid;

				//external Odata service url
				if (data.hybrid.externalURL && data.hybrid.externalURL.length > 0) {
					that.externalURL = data.hybrid.externalURL;
				}
			}

			if (that.smpInfo.server && that.smpInfo.server.length > 0) {
				var context = {
					"serverHost": that.smpInfo.server,
					"https": data.hybrid.msType === 0 ? "true" : "false",
					"serverPort": that.smpInfo.port
				};
				that.devLogon = new com.springer.springerfscmapp.dev.devlogon();
				that.devLogon.doLogonInit(context, that.smpInfo.appID, that.entityName, that.navName);
			} else {
				startApp();
			}
		});
	},

	//========================================================================
	//Cordova deviceOnline event handler
	//========================================================================
	deviceOnline: function() {
		console.log("deviceOnline");
		var that = com.springer.springerfscmapp.dev.devapp;
		//sap.m.MessageToast.show("Device is Online", { duration: 1000});
		if (that.isLoaded && that.deviceModel) {
			that.deviceModel.setProperty("/isOffline", false);
		}
	},

	//========================================================================
	//Cordova deviceOffline event handler
	//========================================================================
	deviceOffline: function() {
		console.log("deviceOffline");
		var that = com.springer.springerfscmapp.dev.devapp;
		//sap.m.MessageToast.show("Device is Offline", { duration: 1000});
		if (that.isLoaded && that.deviceModel) {
			that.deviceModel.setProperty("/isOffline", true);
		}
	}
};