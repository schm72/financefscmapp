jQuery.sap.require("com.springer.financefscmapp.util.Formatter");
jQuery.sap.require("com.springer.financefscmapp.util.Controller");

com.springer.financefscmapp.util.Controller.extend("com.springer.financefscmapp.view.SecondLevel.Profile", {

    userDetails: {},

	onInit : function() {
		this.getRouter().attachRouteMatched(this.onRouteMatched, this);
	},

	onRouteMatched : function(evt) {
		
		// when detail navigation occurs, update the binding context
		if (evt.getParameter("name") !== "_Profile") {
			return;
		}
		var externalURL = com.springer.financefscmapp.dev.devapp.externalURL;
		var appContext = null;
		if (com.springer.financefscmapp.dev.devapp.devLogon) {
			appContext = com.springer.financefscmapp.dev.devapp.devLogon.appContext;
		}
        var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
        var vDevidemodel    = this.getView().byId("DeviceInfo");
        vDevidemodel.setTitle(UserPreferences.device);
        if (UserPreferences.device === "Desktop") {
            vDevidemodel.setIcon("sap-icon://sys-monitor");
        } else if (UserPreferences.device.indexOf("Tablet") > -1) {
            vDevidemodel.setIcon("sap-icon://ipad-2");
        } else {
            vDevidemodel.setIcon("sap-icon://iphone");
        }

        var that = this;
		//var oFormContent = this.getView().byId("ProfilForm").getContent();
        var oModel = this.getView().getModel();
		oModel.read("APP_USER_PREFERENCESSet('EXTERN')", null, null, true,
			function(oData, oResponse) {
                that.userDetails = oData;

                var vUserIdInfo  = that.getView().byId("UserIdInfo");
                vUserIdInfo.setTitle(that.userDetails.UserId);

                var vSAPCollArea  = that.getView().byId("SAPCollArea");
                vSAPCollArea.setTitle(that.userDetails.SapCollections);
                
                var vNewCountryArea  = that.getView().byId("NewCountryArea");
                vNewCountryArea.setTitle(that.userDetails.Countries);
				
				
                var vUserIdActive  = that.getView().byId("UserIdAnctive");
                if (that.userDetails.UserActive === "X") {
                    vUserIdActive.setTitle("Active");
                    vUserIdActive.setInfo("Active");
                    vUserIdActive.setInfoState(sap.ui.core.ValueState.Success);
                    vUserIdActive.setDescription("Active Since: " + com.springer.financefscmapp.util.Formatter.dateSimple2(that.userDetails.LastvisitTime));
                    vUserIdActive.setType(sap.m.ListType.Inactive);
                } else {
                    vUserIdActive.setTitle("Inactive");
                    vUserIdActive.setInfo("Inactive");
                    vUserIdActive.setInfoState(sap.ui.core.ValueState.Warning);
                    vUserIdActive.setDescription("You're not yet activated");
                    vUserIdActive.setType(sap.m.ListType.Navigation);
                }
                if ( UserPreferences.mode === "OfflineMode" ) {
                    vUserIdActive.setInfo("Inactive");
                    vUserIdActive.setInfo("OFFLINE");
                }
                vDevidemodel.setDescription("Last Visit: " + com.springer.financefscmapp.util.Formatter.dateSimple(that.userDetails.LastvisitTime));

                var vUserIdViewMode  = that.getView().byId("UserIdViewMode");
                if (that.userDetails.PrefereListMode === "X") {
                    vUserIdViewMode.setTitle("Prefer List mode");
                    vUserIdViewMode.setIcon("sap-icon://list");
                } else {
                    vUserIdViewMode.setTitle("Prefer Master/Detail mode");
                    vUserIdViewMode.setIcon("sap-icon://detail-view");
                }

                var vUserIdWLmode = that.getView().byId("UserIdWLmode");
                switch(that.userDetails.PreferedOiFilter) {
                    case "ONLY_OI":
                        vUserIdWLmode.setTitle("Only partner with open items");
                        vUserIdWLmode.setIcon("sap-icon://collections-insight");
                        break;
                    default:
                        vUserIdWLmode.setTitle("All in filter");
                        vUserIdWLmode.setIcon("sap-icon://add-activity");
                }
                
                if (window.cordova && appContext && !window.sap_webide_companion && !externalURL) {
					var vLogTile = that.getView().byId("LogUploadID");
					vLogTile.setVisible(true);
	                if (typeof UserPreferences.loggerstatus === "undefined") {
						UserPreferences.loggerstatus = true;
					}
					if 	(UserPreferences.loggerstatus === true) {
						sap.Logger.upload();
						vLogTile.setTitle("Activate Logging");
						UserPreferences.loggerstatus = false;
					} else {
						sap.Logger.setLogLevel(sap.Logger.DEBUG);
						vLogTile.setTitle("Upload Logging");
						UserPreferences.loggerstatus = true;
					}
					sap.ui.getCore().setModel(UserPreferences, "UserPreferences");
				}
			},
			function(oError) {
                var vUserIdActive  = that.getView().byId("UserIdAnctive");
                vUserIdActive.setTitle("Offline Mode");
                vUserIdActive.setType(sap.m.ListType.Inactive);
                vUserIdActive.setInfo("OFFLINE");
                vUserIdActive.setInfoState(sap.ui.core.ValueState.Warning);
                that.getView().byId("UserIdAnctive").setTitle("Offline Mode");
                that.getView().byId("UserIdInfo").setTitle("No Connection");
                that.getView().byId("UserIdWLmode").setVisible(false);
                that.getView().byId("UserIdViewMode").setVisible(false);
                that.getView().byId("NewCountryArea").setVisible(false);
                that.getView().byId("SAPCollArea").setVisible(false);
			}
		);
	},
    onChangeListStatus: function() {
        var vUserIdViewMode  = this.getView().byId("UserIdViewMode");
		var oModel = this.getView().getModel();
        if (this.userDetails.PrefereListMode === "X") {
            this.userDetails.PrefereListMode = " ";
            vUserIdViewMode.setTitle("Prefer Master/Detail mode");
            vUserIdViewMode.setIcon("sap-icon://detail-view");
        } else {
            this.userDetails.PrefereListMode = "X";
            vUserIdViewMode.setTitle("Prefer List mode");
            vUserIdViewMode.setIcon("sap-icon://list");
        }
		oModel.update("APP_USER_PREFERENCESSet('EXTERN')", this.userDetails, null, null, null);
		var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
        UserPreferences.PrefereListMode = this.userDetails.PrefereListMode;
		sap.ui.getCore().setModel(UserPreferences, "UserPreferences");
    },
    onChangeWLmode: function() {
        var vUserIdWLmode  = this.getView().byId("UserIdWLmode");
		var oModel = this.getView().getModel();
        switch(this.userDetails.PreferedOiFilter) {
            case "ONLY_OI":
                this.userDetails.PreferedOiFilter = "ALL";
                vUserIdWLmode.setTitle("All in filter");
                vUserIdWLmode.setIcon("sap-icon://add-activity");
                break;
            default:
                this.userDetails.PreferedOiFilter = "ONLY_OI";
                vUserIdWLmode.setTitle("Only partner with open items");
                vUserIdWLmode.setIcon("sap-icon://collections-insight");
        }
		oModel.update("APP_USER_PREFERENCESSet('EXTERN')", this.userDetails, null, null, null);
		var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
        UserPreferences.PreferedOiFilter = this.userDetails.PreferedOiFilter;
		sap.ui.getCore().setModel(UserPreferences, "UserPreferences");
    },

    onNewCountrySelection : function() {
        var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		UserPreferences.newCollArea = true;
        sap.ui.getCore().setModel(UserPreferences,"UserPreferences");
		var bReplace = jQuery.device.is.phone ? false : true;
		this.getRouter().navTo("_A1_FirstVisitCheck", {
			currentView: this.getView()
		}, bReplace);
	},
    onTriggerActivation: function() {
        //if ( this.userDetails.UserActive !== "X") {
            var vMessage = "Activation Request for User" + this.userDetails.UserId;
            var oModel = this.getView().getModel();
            sap.ui.controller("com.springer.financefscmapp.view.SecondLevel.MessageCollector").onNewMessage(oModel, vMessage, "W", "UserProfile");
        //}
	},

	onLogHandler : function() {
		var vLogTile = this.getView().byId("LogUploadID");
        var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		if (typeof UserPreferences.loggerstatus === "undefined") {
			UserPreferences.loggerstatus = true;
		}
		if 	(UserPreferences.loggerstatus === true) {
			sap.Logger.upload();
			vLogTile.setTitle("Activate Logging");
			UserPreferences.loggerstatus = false;
		} else {
			sap.Logger.setLogLevel(sap.Logger.DEBUG);
			vLogTile.setTitle("Upload Logging");
			UserPreferences.loggerstatus = true;
		}
		sap.ui.getCore().setModel(UserPreferences, "UserPreferences");
	},

	onNavBack : function() {
		var bReplace = jQuery.device.is.phone ? false : true;
		this.getRouter().navTo("_A2_Welcome", {
			currentView: this.getView()
		},  bReplace);
	}

});
