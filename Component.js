jQuery.sap.declare("com.springer.financefscmapp.Component");
jQuery.sap.require("com.springer.financefscmapp.MyRouter");

sap.ui.core.UIComponent.extend("com.springer.financefscmapp.Component", {
	metadata: {
		name: "Springer FSCM App",
		version: "0.9.6",
		includes: [],
		dependencies: { 
			libs: ["sap.m", "sap.ui.layout"],
			components: []
		},

		rootView: "com.springer.financefscmapp.view.App",

		config: {
			resourceBundle: "i18n/messageBundle.properties",
			serviceConfig: {
				name: "MOBILE_FIFS_SRV",
				serviceUrl: "/sap/opu/odata/sbmc/MOBILE_FIFS_SRV/"
			}
		},
		routing: {
			config: {
				routerClass: com.springer.financefscmapp.MyRouter,
				viewType: "XML",
				viewPath: "com.springer.financefscmapp.view",
				targetAggregation: "pages",
				clearTarget: false
			},
			routes : [
				{
					pattern: "",
					name: "_A1_firstVisitCheck",
					view: "A1_FirstVisitCheck",
					viewLevel: 0,
					targetAggregation: "pages",
					targetControl: "idAppControl"
				},
				{
					pattern: "Welcome",
					name: "_A2_Welcome",
					view: "A2_Welcome",
					targetAggregation: "pages",
					targetControl: "idAppControl",
					viewLevel: 0
                },
				{
					pattern: "Profile",
					name: "_Profile",
					view: "SecondLevel/Profile",
					targetAggregation: "pages",
					targetControl: "idAppControl",
					viewLevel: 1
                },
				{
					pattern: "OIO",
					name: "BPOverviewMD",
					view: "AppSplit",
					targetAggregation: "pages",
					targetControl: "idAppControl",
					viewLevel: 1,
                    subroutes: [
                        {
                            pattern : "OIO",
                            name : "_BPOverviewMD_Master",
                            view : "BPOverviewMD_Master",
                            targetAggregation : "masterPages",
                            targetControl : "idSplitAppControl",
                            viewLevel: 2,
                            subroutes : [
                                {
                                    pattern : "OIO/{entity}",
                                    name : "_BPOverviewMD_Detail",
                                    view : "BPOverviewMD_Detail",
                                    targetAggregation: "detailPages",
                                    viewLevel: 3
                                }
                            ]
                        }
                    ]
                },
				{
					pattern: "OIOVL",
					name: "_BPOverviewList",
					view: "SecondLevel/BPOverviewList",
					targetAggregation: "pages",
					targetControl: "idAppControl",
					viewLevel: 1,
                    subroutes : [
                        {
                            pattern : "OIOVL/{entity}",
                            name : "_BPInvoiceList",
                            view : "SecondLevel/BPInvoiceList",
                            targetAggregation: "pages",
                            viewLevel: 2,
		                    subroutes : [
		                        {
		                            pattern : "OIOVL/{entity}/{docid}",
		                            name : "_BPInvoiceDetail",
		                            view : "SecondLevel/BPInvoiceDetail",
		                            targetAggregation: "pages",
		                            viewLevel: 3
		                        }
		                   ]
                        }
                    ]
                },
				{
					pattern: "Mssages",
					name: "_MessageCollector",
					view: "SecondLevel/MessageCollector",
					targetAggregation: "pages",
					targetControl: "idAppControl",
					viewLevel: 1
                },
				{
					pattern: "{all*}",
					name: "_notFound",
					view: "HelpDialogs/NotFound",
					targetAggregation: "pages",
					targetControl: "idAppControl",
					viewLevel: 1
                }
			]
		}
	},

	/**
	 * The component is initialized by UI5 automatically during the startup of the app and calls the init method once.
	 * In this method, the resource and application models are set and the router is initialized.
	 */
	init: function() {
		sap.ui.core.UIComponent.prototype.init.apply(this, arguments);

		var mConfig = this.getMetadata().getConfig();

		// always use absolute paths relative to our own component
		// (relative paths will fail if running in the Fiori Launchpad)
		var oRootPath = jQuery.sap.getModulePath("com.springer.financefscmapp");

		// set i18n model
		var i18nModel = new sap.ui.model.resource.ResourceModel({
			bundleUrl: [oRootPath, mConfig.resourceBundle].join("/")
		});
		this.setModel(i18nModel, "i18n");

		var oModel;
		var externalURL = com.springer.financefscmapp.dev.devapp.externalURL;
		var appContext = null;
		if (com.springer.financefscmapp.dev.devapp.devLogon) {
			appContext = com.springer.financefscmapp.dev.devapp.devLogon.appContext;
		}
		if (window.cordova && appContext && !window.sap_webide_companion && !externalURL) {
			var url = appContext.applicationEndpointURL + "/";
			var oHeader = {
				"X-SMP-APPCID": appContext.applicationConnectionId
			};
			if (appContext.registrationContext.user) {
				oHeader.Authorization = "Basic " + btoa(appContext.registrationContext.user + ":" + appContext.registrationContext.password);
			}
			oModel = new sap.ui.model.odata.ODataModel(url, true, null, null, oHeader);
			this._setModel(oModel);
		} else {
			var sServiceUrl = mConfig.serviceConfig.serviceUrl;
			if (externalURL) {
				sServiceUrl = externalURL;
			}

			//This code is only needed for testing the application when there is no local proxy available, and to have stable test data.
			var bIsMocked = jQuery.sap.getUriParameters().get("responderOn") === "true";
			// start the mock server for the domain model
			if (bIsMocked) {
				this._startMockServer(sServiceUrl);
			}

			var self = this;
			// Create and set domain model to the component
			// only call customized logon dialog when in android companion app to workaround cordova browser for 'basic' auth issue
			if ((window.sap_webide_companion || externalURL) && device) {
				if (device.platform === 'Android') {
					this._logon(sServiceUrl, null, null, function() {
						oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
						self._setModel(oModel);
					}, function() {
						self._openLogonDialog(sServiceUrl);
					}, null);
				} else {
					var username = "";
					var password = "";
					this._logon(sServiceUrl, username, password, function() {
						var auth = "Basic " + btoa(username + ":" + password);
						var uHeader = {
							"Authorization": auth
						};
						oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true, null, null, uHeader);
						self._setModel(oModel);
					}, null, null);
				}
			} else {
				var isSafari = false,
					av = navigator.appVersion;
				if (/AppleWebKit\/(\S+)/.test(av)) {
					if (!/Chrome\/(\S+)/.test(av) && av.indexOf("Safari") >= 0) {
						isSafari = true;
					}
				}
				if (isSafari) {
					self._logon(sServiceUrl, null, null, function() {
						oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
						self._setModel(oModel);
					}, function() {
						self._openLogonDialog(sServiceUrl);
					}, null);
				} else {
					// Create and set domain model to the component
					oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, {
						json: true,
						loadMetadataAsync: true
					});
					this._setModel(oModel);
				}
			}
		}
	},

	/**
	 * perform an ajax asynchronous HTTP request
	 * param{String} url OData service Url
	 * param{String} usr OData service username
	 * param{String} pwd OData service password
	 * param{Object} onLogonSuccess success callback function
	 * param{Object} onUnauthorized authentication error callback function
	 * param{Object} onLogonError general error callback function
	 */
	_logon: function(url, usr, pwd, onLogonSuccess, onUnauthorized, onLogonError) {
		var auth = "Basic " + btoa(usr + ":" + pwd);
		$.ajax({
			type: "GET",
			url: url,
			username: usr,
			password: pwd,
			beforeSend: function(request) {
				request.setRequestHeader("Authorization", auth);
			},
			statusCode: {
				401: onUnauthorized
			},
			error: onLogonError,
			success: onLogonSuccess
		});
	},

	/**
	 * open an authentication dialog to get OData service username and password from user
	 * param{String} sServiceUrl OData service Url
	 */
	_openLogonDialog: function(sServiceUrl) {
		var logonDialog = new sap.m.Dialog();
		logonDialog.setTitle("Basic Authentication");

		var vbox = new sap.m.VBox();
		this._userInput = new sap.m.Input();
		this._userInput.setPlaceholder("Username");
		this._pwdInput = new sap.m.Input();
		this._pwdInput.setPlaceholder("Password");
		this._pwdInput.setType(sap.m.InputType.Password);
		vbox.addItem(this._userInput);
		vbox.addItem(this._pwdInput);
		logonDialog.addContent(vbox);

		var self = this;
		logonDialog.addButton(new sap.m.Button({
			text: "OK",
			press: function() {
				var username = self._userInput.getValue();
				var password = self._pwdInput.getValue();

				self._logon(sServiceUrl, username, password, function() {
					logonDialog.close();
					// Create and set domain model to the component
					var oModel;
					if (username && password) {
						var auth = "Basic " + btoa(username + ":" + password);
						var uHeader = {
							"Authorization": auth
						};
						oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true, null, null, uHeader);
					} else {
						oModel = new sap.ui.model.odata.ODataModel(sServiceUrl, true);
					}
					self._setModel(oModel);
				}, function() {
					alert("Username or Password is incorrect!");
					self._userInput.setValue("");
					self._pwdInput.setValue("");
				}, function(e) {
					console.error(JSON.stringify(e));
				});
			}
		}));
		logonDialog.addButton(new sap.m.Button({
			text: "Cancel",
			press: function() {
				logonDialog.close();
			}
		}));
		logonDialog.open();
	},

	/**
	 * set UI5 OData model and device model, initialize router
	 * param{Object} oModel application OData model
	 */
	_setModel: function(oModel) {
		if (oModel) {
			oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
		}
		this.setModel(oModel);

		// set device model
		var oDeviceModel = new sap.ui.model.json.JSONModel({
			isTouch: sap.ui.Device.support.touch,
			isNoTouch: !sap.ui.Device.support.touch,
			isPhone: sap.ui.Device.system.phone,
			isNoPhone: !sap.ui.Device.system.phone,
			listMode: sap.ui.Device.system.phone ? "None" : "SingleSelectMaster",
			listItemType: sap.ui.Device.system.phone ? "Active" : "Inactive",
			isOffline: !navigator.onLine
		});
		oDeviceModel.setDefaultBindingMode("OneWay");
		this.setModel(oDeviceModel, "device");

		if (window.cordova) {
			com.springer.financefscmapp.dev.devapp.deviceModel = oDeviceModel;
		}
		this.getRouter().initialize();
	},

	/**
	 * start application mock server
	 * param{String} sServiceUrl mock server url
	 */
	_startMockServer: function(sServiceUrl) {
		jQuery.sap.require("sap.ui.core.util.MockServer");
		var oMockServer = new sap.ui.core.util.MockServer({
			rootUri: sServiceUrl
		});

		var iDelay = +(jQuery.sap.getUriParameters().get("responderDelay") || 0);
		sap.ui.core.util.MockServer.config({
			autoRespondAfter: iDelay
		});

		oMockServer.simulate("model/metadata.xml", "model/");
		oMockServer.start();
		sap.m.MessageToast.show("Running in demo mode with mock data.", {
			duration: 2000
		});
	}
});
