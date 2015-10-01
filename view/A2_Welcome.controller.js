jQuery.sap.require("com.springer.financefscmapp.util.Formatter");
jQuery.sap.require("com.springer.financefscmapp.util.Controller");

com.springer.financefscmapp.util.Controller.extend("com.springer.financefscmapp.view.A2_Welcome", {

	vDevice: "unset",
	bReplace: false,
	UserPreferences: {},
	i18model: {},

	updateStatus: function(msg) {
		// getting a DOM element from the App view and modify it
		//sap.m.MessageToast.show(msg); 
		//sap.Logger.debug(msg);
		console.log(msg);
	},
	
	onInit: function() {
		this.getView().addEventDelegate({
			onAfterShow: jQuery.proxy(function(evt) {
				this.onAfterShow(evt);
			}, this)
		});
		this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
		// subscribe for some events whichcan be published in this controller and call a method
		this.getEventBus().subscribe("MessageCollector", "NewMessage", this.onNewMessage, this);
		this.getEventBus().subscribe("MessageCollector", "SuccessMessage", this.onSuccessMessage, this);
		this.getEventBus().subscribe("MessageCollector", "ErrorMessage", this.onErrorMessage, this);
		this.getEventBus().subscribe("A1_FirstVisitCheck", "updUserConfLoadReady", this.onupdUserConfLoadReady, this);
	},
	onlineIconVisible: function(bIsOffline, bIsPhone) {
		return bIsPhone && bIsOffline;
	},
	onRouteMatched: function(evt) {
		// check that the called view name is like expected
		if (evt.getParameter("name") !== "_A2_Welcome") {
			return;
		}
		this.i18model = this.getView().getModel("i18n").getResourceBundle();
	},

	onAfterShow: function() {

		if (Object.keys(this.UserPreferences).length < 1) {
			this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		}

		// only first time start
		var messageTile = this.getView().byId("MessageCollectorTile");
		var OpenItemTile = this.getView().byId("OpenItemsOverview");
		var OpenItemTileSVD = this.getView().byId("OpenItemsSaved");
		if (this.UserPreferences.firstStart === true) {
			// no Exit button on apple devices
			if (this.UserPreferences.device.indexOf("iPhone") > -1) {
				this.getView().byId("EXITID").setVisible(false);
			} else {
				this.getView().byId("EXITID").setVisible(true);
			}
			
			// react dirrefrent  in differen modes
			if (this.UserPreferences.mode === "OnlineModeNew") {
				this.getEventBus().publish("MessageCollector", "SuccessMessage", this.i18model.getText("StartWelcomeFirst"));
			} else if (this.UserPreferences.onlineStatus) {
				this.getEventBus().publish("MessageCollector", "NewMessage", this.i18model.getText("StartLastVisit") + " " +  this.UserPreferences.lastvisit);
			} else {
				sap.m.MessageToast.show(this.i18model.getText("StartOfflienOnlyCF"));

				OpenItemTile.setTitle(this.i18model.getText("StartNotAvailable"));
				OpenItemTile.setInfo(this.i18model.getText("StartNoOffline"));
				OpenItemTile.setInfoState("Error");
			}
			
			this.UserPreferences.firstStart = false;
			sap.ui.getCore().setModel(this.UserPreferences, "UserPreferences");
		}
		// show new message icon in color
		if (this.UserPreferences.NewMessage === "X") {
			this.getView().byId("MessagesB").setIcon("sap-icon://email");
			messageTile.setIcon("sap-icon://email");
			messageTile.removeStyleClass("classAllRead");
			messageTile.addStyleClass("classNewMessage");
		} else {
			this.getView().byId("MessagesB").setIcon("");
			messageTile.setIcon("sap-icon://letter");
			messageTile.removeStyleClass("classNewMessage");
			messageTile.addStyleClass("classAllRead");
		}
		
		if (typeof this.UserPreferences.CountFscmSel !== "undefined") {
			OpenItemTile.setTitle(this.UserPreferences.CountFscmSel + " " +  this.i18model.getText("StartPartners"));
		}
		if (typeof this.UserPreferences.CountFscmFav !== "undefined") {
			OpenItemTileSVD.setTitle(this.UserPreferences.CountFscmFav + " " +  this.i18model.getText("StartFavorites"));
		}
		if (typeof this.UserPreferences.CountMessages !== "undefined") {
			messageTile.setTitle(this.UserPreferences.CountMessages + " " +  this.i18model.getText("StartMessages"));
		}

		this.getView().setBusy(false);
	},
	
	onupdUserConfLoadReady: function() {
		this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		if (typeof this.UserPreferences.CountFscmSel !== "undefined") {
			this.getView().byId("OpenItemsOverview").setTitle(this.UserPreferences.CountFscmSel + " " + this.i18model.getText("StartPartners"));
		}
		if (typeof this.UserPreferences.CountFscmFav !== "undefined") {
			this.getView().byId("OpenItemsSaved").setTitle(this.UserPreferences.CountFscmFav + " " +  this.i18model.getText("StartFavorites"));
		}
		if (typeof this.UserPreferences.CountMessages !== "undefined") {
			this.getView().byId("MessageCollectorTile").setTitle(this.UserPreferences.CountMessages + " " +  this.i18model.getText("StartMessages"));
		}
	},
	
	onProfile: function() {
		this.getRouter().navTo("_Profile", {
			currentView: this.getView()
		}, this.bReplace);
	},
	
	onOIView: function() {
		if (this.UserPreferences.onlineStatus) {
			this.getView().setBusy(true);
			this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
			this.UserPreferences.AppView = "OpenItemLive";
			this.navigateOpenItemFSCMlist( );
		}
	},
	onOIViewFavorites: function() {
		this.getView().setBusy(true);
		this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		this.UserPreferences.AppView = "OpenItemFavorite";
		this.navigateOpenItemFSCMlist( );
	},
	navigateOpenItemFSCMlist: function() {
		this.getView().setBusy(true);
		
		sap.ui.getCore().setModel(this.UserPreferences, "UserPreferences");
		if (this.UserPreferences.PrefereListMode === "X") {
			this.getRouter().navTo("_BPOverviewList", {
				currentView: this.getView()
			}, this.bReplace);
		} else {
			this.getRouter().navTo("_BPOverviewMD_Master", {
				currentView: this.getView()
			}, this.bReplace);
		}
	},
	
	onMessageCollector: function() {
		this.getRouter().navTo("_MessageCollector", {
			currentView: this.getView()
		}, this.bReplace);
	},
	onEnde: function() {
		var msg = this.i18model.getText("StartExitQuestion");
		if (window.confirm(msg)) {
			sap.m.MessageToast.show(this.i18model.getText("StartExit"));
			if (this.app) {
				this.app.exitApp();
			} else if (navigator.app) {
				navigator.app.exitApp();
			} else {
				window.close();
			}
		}
	},

	// call a method from another controller / here the central message handling
	onSuccessMessage: function(sChannel, sEvent, message) {
		var oModel = this.getView().getModel();
		sap.ui.controller("com.springer.financefscmapp.view.SecondLevel.MessageCollector").onNewMessage(oModel, message, "S", "MainScreen");
	},
	onNewMessage: function(sChannel, sEvent, message) {
		var oModel = this.getView().getModel();
		sap.ui.controller("com.springer.financefscmapp.view.SecondLevel.MessageCollector").onNewMessage(oModel, message, "N", "MainScreen");
	},
	onErrorMessage: function(sChannel, sEvent, message) {
		var oModel = this.getView().getModel();
		sap.ui.controller("com.springer.financefscmapp.view.SecondLevel.MessageCollector").onNewMessage(oModel, message, "E", "Error");
	}

});
