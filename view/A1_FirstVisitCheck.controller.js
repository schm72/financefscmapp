jQuery.sap.require("com.springer.financefscmapp.util.Formatter");
jQuery.sap.require("com.springer.financefscmapp.util.Controller");

com.springer.financefscmapp.util.Controller.extend("com.springer.financefscmapp.view.A1_FirstVisitCheck", {

	bReplace: false,
	selectedCountries: "",
	selectedRegions: "",
	selectedRegionsOLD: "",
	UserPreferences: {},
	OnlyOnceFirstCall: false,
	i18model: {},

	updateStatus: function(msg) {
		// getting a DOM element from the App view and modify it
		//sap.m.MessageToast.show(msg);
		//sap.Logger.debug(msg);
		console.log(msg);
	},
	onInit: function() {
console.log("Init");
		// method is called via the framework automatically when this view is displayed
		// enable the waiting symbol
		this.getView().setBusy(true);
		// stuff which needs to be called after view is loaded
		this.OnlyOnceFirstCall = true;
		this.getView().addEventDelegate({
			onAfterShow: jQuery.proxy(function(evt) {
				this.onAfterShow(evt);
			}, this)
		});
		
		// save the device type in a separat parameter,
		// this parameter will then be saved in a JSON model which is saved for our application and can be reused in other controllers
		var vDevice;
		switch (true) {
			case sap.ui.Device.system.desktop:
				vDevice = "Desktop";
				break;
			case sap.ui.Device.system.tablet && sap.ui.Device.os.android:
				vDevice = "Android Tablet";
				break;
			case sap.ui.Device.os.android:
				vDevice = "Android";
				break;
			case sap.ui.Device.os.ios && sap.ui.Device.system.tablet:
				vDevice = "iPhone Tablet";
				break;
			case sap.ui.Device.os.ios:
				vDevice = "iPhone";
				break;
			case sap.ui.Device.system.phone:
				vDevice = "Phone";
				break;
			default:
				vDevice = "undefined";
		}

		this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		if (typeof this.UserPreferences === "undefined") {
			this.UserPreferences = new sap.ui.model.json.JSONModel();
		}

		if (vDevice === "Desktop" || vDevice === "undefined") {
			this.UserPreferences.onlineStatus = true;
			navigator.onLine = true;
		} else if (this.UserPreferences.onlineStatus !== true) {
			var oGetResponse = jQuery.sap.sjax({  
				//url: "//https://senldogomps.springer-sbm.com:8020/sap/bc/ping",
		    	url: "https://webidetestingfinancefscmapp-a5bd3c89a.dispatcher.hana.ondemand.com/sap/opu/odata/sbmc/MOBILE_FIFS_SRV/?$format=json",
		    	type: "GET"
			}); 
			if (oGetResponse.success){  
				this.UserPreferences.onlineStatus = true;
				navigator.onLine = true;
			}
		}
		this.UserPreferences.device = vDevice;
		sap.ui.getCore().setModel(this.UserPreferences, "UserPreferences");
console.log("Device: " + this.UserPreferences.device);
		this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
	},

	onRouteMatched: function(evt) {
		// check that we are in the URL hash pattern http://domain:port/%PATTERN%
		if (evt.getParameter("name") !== "_A1_firstVisitCheck") {
			return;
		}
		if (Object.keys(this.UserPreferences).length < 1) {
			this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		}
		this.i18model = this.getView().getModel("i18n").getResourceBundle();
		
		// check if we are just here to reassign the collection region and countries
		if (this.UserPreferences.newCollArea === true) {
console.log("New Coll Area Mode");

			this.getView().byId("UserCheckPage").setShowNavButton(true);

			// save the current user selected values
			this.selectedRegions = this.UserPreferences.selectedRegions;
			this.selectedCountries = this.UserPreferences.selectedCountries;
			// when we have already values set these values to the multiComboBox
			// values saved as comma separated list - therefore a split gives us an array which can be assigned to the multiComboBox
			if (this.selectedRegions !== "") {
				var oComboBoxRegions = this.getView().byId("regionSelector");
				var selectedRegionsArray = this.selectedRegions.split(",");
				oComboBoxRegions.setSelectedKeys(selectedRegionsArray);
				var oComboBoxCountries = this.getView().byId("countrySelector");
				oComboBoxCountries.setVisible(true);
				// bind the available countries for these regions to the country multiComboBox
				oComboBoxCountries.bindAggregation("items", "/REGION_SELECTIONSet('" + this.selectedRegions + "')/COUNTRY_SELECTIONSet",
					new sap
					.ui.core.Item({
						key:  "{Country}",
						text: "{CountryText}"
					}));
				// set the already selected countries to the country multiComboBox
				var selectedCountriesArray = this.selectedCountries.split(",");
				oComboBoxCountries.setSelectedKeys(selectedCountriesArray);
			}
			this.chooseCollArea();
			return;
		} else {
console.log("Normal Start Mode");
		}
	},
	
	onAfterShow: function() {
		if (this.OnlyOnceFirstCall === false) {
			return;
		}
		this.OnlyOnceFirstCall = false;
		if (Object.keys(this.UserPreferences).length < 1) {
			this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		}
		var that = this;
		// getting the eventbus and subscribing methods for events
		var oEventBus = this.getEventBus();
		oEventBus.subscribe("FirstVisitCheck", "OnlineModeExist", this.onlineModeExist, this);
		oEventBus.subscribe("FirstVisitCheck", "OnlineModeNew", this.onlineModeNew, this);
		oEventBus.subscribe("FirstVisitCheck", "OfflineMode", this.offlineMode, this);
		// READ: reading user preferences for this app -> to check if we only and iof the user already exist
		var oModel = this.getView().getModel();
		
		//oModel.read("APP_USER_PREFERENCESSet", null, ["$filter=Application eq 'financefscmapp'"], true,
		oModel.read("APP_USER_PREFERENCESSet", null, null, true,
			function(oData, oResponse) {
				if (oData.results[0]) {
					if (that.UserPreferences.onlineStatus) {
						// we are online and received data (user already exist and preferences are clear )
						// -> received data are saved in oData table - first entry is in this case relevat .results[0]
						// we send this information to all methods which subscribed for this event
console.log("Online Mode Check: " + "OnlineModeExist");
						oEventBus.publish("FirstVisitCheck", "OnlineModeExist", {
							entry: oData.results[0]
						});
					} else {
						// we are offline
console.log("Online Mode Check: " + "OfflineMode normal with data");
						oEventBus.publish("FirstVisitCheck", "OfflineMode", {
							entry: oData.results[0]
						});
					}
				} else {
					if (that.UserPreferences.onlineStatus) {
console.log("Online Mode Check: " + "Probably new User");
						// we are online, but there are no data for this user -> so this must be a new user
						oEventBus.publish("FirstVisitCheck", "OnlineModeNew");
					} else {
						// no data - no connection
console.log("Online Mode Check: " + "OfflineMode no data");
						oEventBus.publish("FirstVisitCheck", "OfflineMode");
					}
				}
			},
			function(oError) {
				// we are offline, because no communication to the backend is available
				oEventBus.publish("FirstVisitCheck", "OfflineMode");
			}
		);
	},

	chooseCollArea: function(addText) {
		var textArea = this.getView().byId("ContextText");
		textArea.setVisible(true);
		var CustomText = this.i18model.getText("StartChooseColl");
		if (addText === true) {
			textArea.setValue(textArea.getValue() + "\n" + CustomText);
		} else {
			textArea.setValue(CustomText);
		}
		this.getView().byId("regionSelector").setVisible(true);
		this.getView().byId("finishCollArea").setVisible(true);
	},

	onlineModeNew: function() {
		this.getView().setBusy(false);

		var textArea = this.getView().byId("ContextText");
		textArea.setVisible(true);
		textArea.setValue(this.i18model.getText("StartFirstTimeEnter"));

		this.chooseCollArea(true);

		if (Object.keys(this.UserPreferences).length < 1) {
			this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		}
		this.UserPreferences.mode = "OnlineModeNew";
		this.UserPreferences.lastvisit = null;
		this.UserPreferences.firstStart = true;
		this.UserPreferences.onlineStatus = true;
		this.UserPreferences.NewMessage = "X";
		sap.ui.getCore().setModel(this.UserPreferences, "UserPreferences");

		this.updateStatus("OnlineModeNew");
	},

	onlineModeExist: function(sChannel, sEvent, input) {
		var oModel = this.getView().getModel();
		// reading a single line over the set with a unique key
		// Extern means that this enitty set knows their unique key which can be created out of the context in the backend - here it is the SAP user ID
		var that = this;
		oModel.update("APP_USER_PREFERENCESSet('EXTERN')", input.entry, null,
			function() {
				if (Object.keys(that.UserPreferences).length < 1) {
					that.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
				}
				that.UserPreferences.mode = "OnlineModeExist";

				oModel.read("APP_USER_PREFERENCESSet", null, null, true,
					function(oData) {
						if (oData.results[0]) {
							input.entry = oData.results[0];

							if (input.entry.LastvisitTime) {
								that.UserPreferences.lastvisit = com.springer.financefscmapp.util.Formatter.dateSimple(input.entry.LastvisitTime);
							}
							that.UserPreferences.firstStart = true;
							that.UserPreferences.onlineStatus = true;
							// input.entry
							that.UserPreferences.UserId = input.entry.UserId;
							that.UserPreferences.selectedRegions = input.entry.Regions;
							that.UserPreferences.selectedCountries = input.entry.Countries;
							that.UserPreferences.CountFscmSel = input.entry.CountFscmSel;
							that.UserPreferences.CountFscmFav = input.entry.CountFscmFav;
							that.UserPreferences.CountMessages = input.entry.CountMessages;
							that.UserPreferences.NewMessage = input.entry.NewMessage;
							that.UserPreferences.PrefereListMode = input.entry.PrefereListMode;
							that.UserPreferences.PreferedOiFilter = input.entry.PreferedOiFilter;

							sap.ui.getCore().setModel(that.UserPreferences, "UserPreferences");
							that.getEventBus().publish("A1_FirstVisitCheck", "updUserConfLoadReady");
							
							that.updateStatus("OnlineModeExist");
							that.getView().setBusy(false);
						}
					}
				);
			},
			function(oError) {
				that.getView().setBusy(false);
				console.log("Communication error");
			}
		);
		this.getRouter().navTo("_A2_Welcome", {
			currentView: that.getView()
		}, this.bReplace);
	},

	offlineMode: function(sChannel, sEvent, input) {
		this.getView().setBusy(false);

		if (Object.keys(this.UserPreferences).length < 1) {
			this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		}
		this.UserPreferences.mode = "OfflineMode";
		this.UserPreferences.lastvisit = null;
		this.UserPreferences.firstStart = true;
		this.UserPreferences.onlineStatus = false;

		if (Object.keys(input).length > 0) {
			this.UserPreferences.UserId = input.entry.UserId;
			this.UserPreferences.selectedRegions = input.entry.Regions;
			this.UserPreferences.selectedCountries = input.entry.Countries;
			this.UserPreferences.CountFscmSel = input.entry.CountFscmSel;
			this.UserPreferences.CountFscmFav = input.entry.CountFscmFav;
			this.UserPreferences.CountMessages = input.entry.CountMessages;
			this.UserPreferences.PrefereListMode = input.entry.PrefereListMode;
			this.UserPreferences.PreferedOiFilter = input.entry.PreferedOiFilter;
		}

		sap.ui.getCore().setModel(this.UserPreferences, "UserPreferences");

		//sap.OData.applyHttpClient();
		this.updateStatus(" - OFFLINE MODE - ");

		this.getRouter().navTo("_A2_Welcome", {
			currentView: this.getView()
		}, this.bReplace);
	},

	handleSelectionChangeRegion: function(oEvent) {
		var changedItem = oEvent.getParameter("changedItem");
		var isSelected = oEvent.getParameter("selected");
		var state = "Selected";
		if (!isSelected) {
			state = "Deselected";
		}
		sap.m.MessageToast.show(state + " '" + changedItem.getText() + "'", {
			width: "auto"
		});
	},

	handleSelectionFinishRegion: function(oEvent) {
		var selectedItems = oEvent.getParameter("selectedItems");
		this.selectedRegions = "";
		for (var i = 0; i < selectedItems.length; i++) {
			this.selectedRegions += selectedItems[i].getKey();
			if (i !== selectedItems.length - 1) {
				this.selectedRegions += ",";
			}
		}
		// check if the old region variable is set - when not set from user preferences
		if (this.selectedRegionsOLD === "") {
			if (Object.keys(this.UserPreferences).length < 1) {
				this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
			}
			if (this.UserPreferences.selectedRegions !== "") {
				this.selectedRegionsOLD = this.UserPreferences.selectedRegions;
			}
		}
		// check if regions changed - only when yes reset country multiComboBox
		var oComboBoxCountries = this.getView().byId("countrySelector");
		oComboBoxCountries.setVisible(true);
		if (this.selectedRegions !== this.selectedRegionsOLD) {
			this.selectedRegionsOLD = this.selectedRegions;
			oComboBoxCountries.bindAggregation("items", "/REGION_SELECTIONSet('" + this.selectedRegions + "')/COUNTRY_SELECTIONSet", new sap.ui.core
				.Item({
					key: "{Country}",
					text: "{CountryText}"
				}));
			// try to set the already selected countries so they are not lost for the user
			var selectedCountriesArray = this.selectedCountries.split(",");
			oComboBoxCountries.setSelectedKeys(selectedCountriesArray);

		}
	},

	handleSelectionChangeCountry: function(oEvent) {
		var changedItem = oEvent.getParameter("changedItem");
		var isSelected = oEvent.getParameter("selected");
		var state = "Selected";
		if (!isSelected) {
			state = "Deselected";
		}
		sap.m.MessageToast.show(state + " '" + changedItem.getText() + "'", {
			width: "auto"
		});
	},

	handleSelectionFinishCountry: function(oEvent) {
		var selectedItems = oEvent.getParameter("selectedItems");
		this.selectedCountries = "";
		for (var i = 0; i < selectedItems.length; i++) {
			this.selectedCountries += selectedItems[i].getKey();
			if (i !== selectedItems.length - 1) {
				this.selectedCountries += ",";
			}
		}
		//sap.Logger.debug(this.selectedCountries);
	},

	finishCollArea: function(noNavBack) {
		var that = this;
		if (Object.keys(this.UserPreferences).length < 1) {
			this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		}
		this.UserPreferences.selectedRegions = this.selectedRegions;
		this.UserPreferences.selectedCountries = this.selectedCountries;
		sap.ui.getCore().setModel(this.UserPreferences, "UserPreferences");

		var oModel = this.getView().getModel();
		if (this.UserPreferences.newCollArea === true) {
			oModel.read("APP_USER_PREFERENCESSet", null, null, true,
				function(oData, oResponse) {
					if (oData.results[0]) {
						oData.results[0].Regions = that.selectedRegions;
						oData.results[0].Countries = that.selectedCountries;
						oModel.update("APP_USER_PREFERENCESSet('EXTERN')", oData.results[0], null, null, null);
					}
				},
				function(oError) {
					console.log("Send failed " + oError);
				}
			);
		} else {
			this.getView().setBusy(true);
			var d = new Date();
			var vDate = new Date(d.getUTCFullYear(), d.getUTCMonth() - 1, d.getUTCDate());
			var oEntry = {
				"UserId": "EXTERN",
				"UserActive": "",
				"UserCategory": "APP_VERSION_1.0",
				"CreationDate": vDate,
				"LastvisitTime": null,
				"PrefereListMode": "X",
				"AppStartScreen": 1,
				"Regions": this.selectedRegions,
				"Countries": this.selectedCountries,
				"NewMessage": "X",
				"PreferedOiFilter": "ONLY_OI"
			};
			oModel.create("/APP_USER_PREFERENCESSet", oEntry, null, 
				function() {
					that.getView().setBusy(false);
					console.log("User Data Saved: " + oEntry.Category);
				}, function(oError) {
					that.getView().setBusy(false);
					console.log("Send failed " + oError);
				}
			);
		}

		if (noNavBack !== true) {
			this.getRouter().navTo("_A2_Welcome", {
				currentView: this.getView()
			}, this.bReplace);
		}
	},

	callStoreError: function(sender, error) {
		this.updateStatus("An error occurred in " + sender + " with msg: " + JSON.stringify(error));
	},

	onNavBack: function() {
		this.finishCollArea(true);
		this.getRouter().navTo("_Profile", {
			currentView: this.getView()
		}, this.bReplace);
	}

});