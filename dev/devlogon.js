jQuery.sap.declare("com.springer.springerfscmapp.dev.devlogon");
jQuery.sap.require("com.springer.springerfscmapp.dev.devapp");

sap.ui.base.ManagedObject.extend("com.springer.springerfscmapp.dev.devlogon", {
	appContext: null,
	appOfflineStore: {},

	/********************************************************************
	 * constructor
	 ********************************************************************/
	constructor: function() {
		if (typeof com.springer.springerfscmapp.dev.devlogon.__instance === "object") {
			return com.springer.springerfscmapp.dev.devlogon.__instance;
		}
		com.springer.springerfscmapp.dev.devlogon.__instance = this;
	},

	/********************************************************************
	 * Initialize the application
	 * In this case, it will check first of the application has already
	 * registered with the SMP server. If not, it will register the app
	 * then proceed to manage the logon process.
	 * @param{Object} context SMP/HCPms logon input context
	 * @param{String} appId SMP/HCPms application ID
	 * @param{String} entity Master view collection name
	 * @param{String} navName navigator collection name
	 ********************************************************************/
	doLogonInit: function(context, appId, entity, navName) {
		//Init needs to happen before anything else.
		console.log("Entering doLogonInit");

		//Is there a host address populated?
		if (context.serverHost.length < 1) {
			//If not, nothing we can do now
			console.log("You must set a SMP/HCPms Server host before you can initialize the server connection.");
			return;
		}
		//set offline store attribute first
		this.appOfflineStore.appID = appId;
		this.appOfflineStore.entity = entity;
		this.appOfflineStore.interval = 300000; //5 minutes
		if (entity) {
			this.appOfflineStore.definedStore = "/" + entity;
			if (navName) {
				this.appOfflineStore.definedStore += ("?$expand=" + navName);
			}
		}
		//Make call to Logon's Init method to get things registered and all setup
		this.openStore = true;
		var that = this;
		sap.Logon.init(
			function(ctx) {
				that.onLogonInitSuccess(ctx);
			},
			function(err) {
				that.onLogonError(err);
			}, appId, context);

		console.log("Leaving doLogonInit");
	},

	/********************************************************************
	 * Success Callback function for logon
	 * @param{Object} context the returned context
	 ********************************************************************/
	onLogonInitSuccess: function(context) {
		console.log("Entering LogonInitSuccess");
		//Make sure Logon returned a context for us to work with
		if (context) {
			if (this.openStore) {
				//Store the context away to be used later if necessary
				this.appContext = context;
				//open offline store
				this.openAppOfflineStore();
				this.openStore = false;
			}
		} else {
			//Something went seriously wrong here, context is not populated
			console.error("context null");
		}
		console.log("Leaving LogonInitSuccess");
	},

	/********************************************************************
	 * Error Callback function
	 * @param{Object} errObj the returned error object
	 ********************************************************************/
	onLogonError: function(errObj) {
		//Generic error function, used as a callback by several of the methods
		console.error("Entering logonError");
		//write the contents of the error object to the console.
		console.error(JSON.stringify(errObj));
		console.error("Leaving logonError");
	},

	/********************************************************************
	 * Delete the application's registration information
	 * Disconnects the app from the SMP server
	 ********************************************************************/
	doDeleteRegistration: function() {
		console.log("Entering doDeleteRegistration");
		var that = this;
		if (this.appContext) {
			//Call logon's deleteRegistration method
			sap.Logon.core.deleteRegistration(
				function(res) {
					that.onDeleteRegistrationSuccess(res);
				},
				function(err) {
					that.onLogonError(err);
				});
		} else {
			//nothing to do here, move along...
			var msg = "The application is not initialized, cannot delete context";
			console.log(msg);
		}
		console.log("Leaving doDeleteRegistrationU");
	},

	/********************************************************************
	 * Success Callback function for sap.Logon.core.deleteRegistration()
	 * @param{Object} res the returned information object
	 ********************************************************************/
	onDeleteRegistrationSuccess: function(res) {
		console.log("Entering unregisterSuccess");
		console.log("Unregister result: " + JSON.stringify(res));
		//Set appContext to null so the app will know it's not registered
		this.appContext = null;
		//reset the app to its original packaged version
		//(remove all updates retrieved by the AppUpdate plugin)
		sap.AppUpdate.reset();
		console.log("Leaving unregisterSuccess");
	},

	/********************************************************************
	 * Lock the DataVault
	 ********************************************************************/
	doLogonLock: function() {
		console.log("Entering doLogonLock");
		//Everything here is managed by the Logon plugin, there's nothing for
		//the developer to do except to make the call to lock to
		//Lock the DataVault
		sap.Logon.lock(this.onLogonLockSuccess, this.onLogonError);
		console.log("Leaving doLogonLock");
	},

	/********************************************************************
	 * Success Callback function for sap.Logon.lock()
	 ********************************************************************/
	onLogonLockSuccess: function() {
		console.log("Entering logonLockSuccess");
		console.log("Leaving logonLockSuccess");
	},

	/********************************************************************
	 * Unlock the DataVault
	 ********************************************************************/
	doLogonUnlock: function() {
		console.log("Entering doLogonUnlock");
		//Everything here is managed by the Logon plugin, there's nothing for
		//the developer to do except to make the call to unlock.
		//we'll be using the same success callback as
		//with init as the signatures are the same and have the same functionality
		var that = this;
		sap.Logon.unlock(
			function(ctx) {
				that.onLogonInitSuccess(ctx);
			},
			function(err) {
				that.onLogonError(err);
			});
		console.log("Leaving doLogonUnlock");
	},

	/********************************************************************
	 * Show the application's registration information
	 ********************************************************************/
	doLogonShowRegistrationData: function() {
		console.log("Entering doLogonShowRegistrationData");
		//Everything here is managed by the Logon plugin, there's nothing for
		//the developer to do except to make a call to showRegistratioData
		sap.Logon.showRegistrationData(this.onShowRegistrationSuccess, this.onShowRegistrationError);
		console.log("Leaving doLogonShowRegistrationData");
	},

	/********************************************************************
	 * Success Callback function for sap.Logon.showRegistrationData()
	 ********************************************************************/
	onShowRegistrationSuccess: function() {
		console.log("Entering showRegistrationSuccess");
		//Nothing to see here, move along...
		console.log("Leaving showRegistrationSuccess");
	},

	/********************************************************************
	 * Error Callback function for sap.Logon.showRegistrationData()
	 * @param{Object} errObj the returned error object
	 ********************************************************************/
	onShowRegistrationError: function(errObj) {
		console.log("Entering showRegistrationError");
		console.error(JSON.stringify(errObj));
		console.log("Leaving showRegistrationError");
	},

	/********************************************************************
	 * Update the DataVault password for the user
	 ********************************************************************/
	doLogonChangePassword: function() {
		console.log("Entering doLogonChangePassword");
		//Everything here is managed by the Logon plugin, there's nothing for
		//the developer to do except to make the call to changePassword
		sap.Logon.changePassword(this.onPasswordSuccess, this.onPasswordError);
		console.log("Leaving doLogonChangePassword");
	},

	/********************************************************************
	 * Change the DataVaule passcode
	 ********************************************************************/
	doLogonManagePasscode: function() {
		console.log("Entering doLogonManagePassword");
		//Everything here is managed by the Logon plugin, there's nothing for
		//the developer to do except to make the call to managePasscode
		sap.Logon.managePasscode(this.onPasswordSuccess, this.onPasswordError);
		console.log("Leaving doLogonManagePassword");
	},

	/********************************************************************
	 * Success Callback function
	 ********************************************************************/
	onPasswordSuccess: function() {
		console.log("Entering passwordSuccess");
		//Nothing to see here, move along...
		console.log("Leaving passwordSuccess");
	},

	/********************************************************************
	 * Error Callback function
	 * @param{Object} errObj the returned error object
	 ********************************************************************/
	onPasswordError: function(errObj) {
		console.error("Entering passwordError");
		console.error("Password/passcode error");
		console.error(JSON.stringify(errObj));
		console.error("Leaving passwordError");
	},

	/********************************************************************
	 * Write values from the DataVault
	 * @param{String} theKey the key to store the provided object on
	 * @param{Object} theValue the object to be set on the given key. Must be JSON serializable (cannot contain circular references).
	doLogonSetDataVaultValue: function(theKey, theValue) {
		console.log("Entering doLogonSetDataVaultValue");
		//Make sure we have both a key and a value before continuing
		//No sense writing a blank value to the DataVault
		if (theKey !== "" && theValue !== "") {
			console.log("Writing values to the DataVault");
			//Write the values to the DataVault
			sap.Logon.set(this.onDataVaultSetSuccess, this.onDataVaultSetError, theKey, theValue);
		} else {
			//One of the input values is blank, so we can't continue
			console.error("Key and/or value missing.");
		}
		console.log("Leaving doLogonSetDataVaultValue");
	},

	/********************************************************************
	 * Success Callback function for sap.Logon.set()
	 ********************************************************************/
	onDataVaultSetSuccess: function() {
		console.log("Entering dataVaultSetSuccess");
		//Clear out the input fields
		//Cordova alerts are asynchronous, so this code will likely clear the input
		//fields before the alert dialog displays
		console.log("Leaving dataVaultSetSuccess");
	},

	/********************************************************************
	 * Error Callback function
	 * @param{Object} errObj the returned error object
	 ********************************************************************/
	onDataVaultSetError: function(errObj) {
		console.error("Entering dataVaultSetError");
		console.error("Error writing to the DataVault");
		console.error("Leaving dataVaultSetError");
	},

	/********************************************************************
	 * Read values from the DataVault
	 * @param{String}} theKey the key with which to query the DataVault.
	 ********************************************************************/
	doLogonGetDataVaultValue: function(theKey) {
		console.log("Entering doLogonGetDataVaultValue");
		//Make sure we have a key before continuing
		if (theKey !== "") {
			console.log("Reading value for " + theKey + " from the DataVault");
			//Read the value from the DataVault
			sap.Logon.get(this.onDataVaultGetSuccess, this.onDataVaultGetError, theKey);
		} else {
			//One of the input values is blank, so we can't continue
			console.error("Value for key missing.");
		}
		console.log("Leaving doLogonGetDataVaultValue");
	},

	/********************************************************************
	 * Success Callback function for sap.Logon.get()
	 ********************************************************************/
	onDataVaultGetSuccess: function(value) {
		console.log("Entering dataVaultGetSuccess");
		console.log("Received: " + JSON.stringify(value));
		console.log("Leaving dataVaultGetSuccess");
	},

	/********************************************************************
	 * Error Callback function
	 * @param{Object} errObj the returned error object
	 ********************************************************************/
	onDataVaultGetError: function(errObj) {
		console.error("Entering dataVaultGetError");
		console.error(JSON.stringify(errObj));
		console.error("Leaving dataVaultGetError");
	},

	/********************************************************************
	 * Error Callback function for open offline store
	 * @param{Object} e the returned error object
	 ********************************************************************/
	storeErrorCallback: function(e) {
		console.log("Failed to open offline store.");
		console.error("An error occurred: " + JSON.stringify(e));
		alert("Failed to open offline store.");
	},

	/********************************************************************
	 * Success Callback function for open offline store
	 ********************************************************************/
	openStoreSuccessCallback: function() {
		var endTime = new Date();
		var duration = (endTime - this.appOfflineStore.startTime) / 1000;
		console.log("Offline Store opened in  " + duration + " seconds");
	
		// creating a json model to handle properties for the user session globally
		var UserPreferences = new sap.ui.model.json.JSONModel();
		// recheck if offline by reaching SAP mobile platform
		var oGetResponse = jQuery.sap.sjax({  
		    url: "https://mobile-base.springer-sbm.com:443",
		    type: "GET"
		}); 
		if (oGetResponse.success){  
			sap.m.MessageToast.show("Online");
			UserPreferences.onlineStatus = true;
			navigator.onLine = true;
		}	else	{  
			UserPreferences.onlineStatus = false;
			sap.m.MessageToast.show("Offline");
			sap.OData.applyHttpClient();
		}
		sap.ui.getCore().setModel(UserPreferences, "UserPreferences");

		startApp();
		com.springer.springerfscmapp.dev.devapp.isLoaded = true;
	},

	/********************************************************************
	 * Creates a new OfflineStore object.
	 * Need to be online in the first time when the store is created.
	 * The store will be available for offline access only after it is open successfully.
	 ********************************************************************/
	openAppOfflineStore: function() {
		console.log("openAppOfflineStore");
		if (!this.appOfflineStore.store) {
			this.appOfflineStore.startTime = new Date();

			var reqObj = {};
			if (com.springer.springerfscmapp.dev.devapp.definedStore) {
				reqObj = com.springer.springerfscmapp.dev.devapp.definedStore;
			} else {
				reqObj[this.appOfflineStore.entity + "DR"] = this.appOfflineStore.definedStore;
			}

			var properties = {
				"name": "MasterDetailAppOfflineStore",
				"host": this.appContext.registrationContext.serverHost,
				"port": this.appContext.registrationContext.serverPort,
				"https": this.appContext.registrationContext.https,
				"serviceRoot": this.appContext.applicationEndpointURL + "/",
				"definingRequests": reqObj
			};
			var that = this;
			this.appOfflineStore.store = sap.OData.createOfflineStore(properties);
			this.appOfflineStore.store.open(
				function() {
					that.openStoreSuccessCallback();
				},
				function(e) {
					that.storeErrorCallback(e);
				});
		}
	},

	/********************************************************************
	 * refresh offline store error Callback function
	 * @param{Object} e the returned error object
	 ********************************************************************/
	offlineRefreshErrorCallback: function(e) {
		console.log("failed to refresh offline store.");
		//reset flag
		com.springer.springerfscmapp.dev.devapp.refreshing = false;

		//publish ui5 offlineStore Synced event
		var oEventBus = sap.ui.getCore().getEventBus();
		oEventBus.publish("OfflineStore", "Synced");

		console.error("An error occurred: " + JSON.stringify(e));
		alert("Failed to refresh data from server");
	},

	/********************************************************************
	 * refresh offlient store success Callback function
	 ********************************************************************/
	offlineRefreshStoreCallback: function() {
		var endTime = new Date();
		var duration = (endTime - this.appOfflineStore.startTimeRefresh) / 1000;
		console.log("Store refreshed in  " + duration + " seconds");

		com.springer.springerfscmapp.dev.devapp.refreshing = false;

		//publish ui5 offlineStore Synced event
		var oEventBus = sap.ui.getCore().getEventBus();
		oEventBus.publish("OfflineStore", "Synced");
	},

	/********************************************************************
	 * refresh offline store, synchronize data from server
	 * need to be online
	 ********************************************************************/
	refreshAppOfflineStore: function() {
		console.log("enter offline refresh.");
		if (!this.appOfflineStore.store) {
			console.log("The kapsel offline store must be open before it can be refreshed");
			return;
		}
		
		var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		if (typeof UserPreferences === "undefined") {
			sap.m.MessageToast.show("UserPreferences Don't exist yet ?"); 
			UserPreferences = new sap.ui.model.json.JSONModel();
			UserPreferences.onlineStatus = navigator.onLine;
		}
		if (UserPreferences.onlineStatus) {
			this.appOfflineStore.startTimeRefresh = new Date();
			console.log("offline store refresh called");
			var that = this;
			this.appOfflineStore.store.refresh(
				function() {
					that.offlineRefreshStoreCallback();
				},
				function(e) {
					that.offlineRefreshErrorCallback(e);
				});
		}
		
	},

	/********************************************************************
	 * flush offline store error Callback function
	 * if com.springer.springerfscmapp.dev.devapp.refreshing is set to true,
	 * application will continue to call refreshAppOfflineStore() to refresh the offline store.
	 * @param{Object} e the returned error object
	 ********************************************************************/
	flushErrorCallback: function(e) {
		console.log("Failed to flush offline store.");
		console.error("An error occurred: " + JSON.stringify(e));

		if (com.springer.springerfscmapp.dev.devapp.refreshing) {
			this.refreshAppOfflineStore();
		}

		alert("Failed to flush data back to server");
	},

	/********************************************************************
	 * flush offlient store success Callback function
	 * if com.springer.springerfscmapp.dev.devapp.refreshing is set to true,
	 * application will continue to call refreshAppOfflineStore() to refresh the offline store.
	 ********************************************************************/
	flushStoreCallback: function() {
		var endTime = new Date();
		var duration = (endTime - this.appOfflineStore.startTimeRefresh) / 1000;
		console.log("Store flushed in  " + duration + " seconds");

		if (com.springer.springerfscmapp.dev.devapp.refreshing) {
			this.refreshAppOfflineStore();
		}
	},

	/********************************************************************
	 * flush offline store, push changed data to server, need to be online
	 * if com.springer.springerfscmapp.dev.devapp.refreshing is set to true,
	 * application will continue to call refreshAppOfflineStore() to refresh the offline store.
	 ********************************************************************/
	flushAppOfflineStore: function() {
		console.log("flushAppOfflineStore.");
		if (!this.appOfflineStore.store) {
			console.log("The kapsel offline store must be open before it can be flushed");
			return;
		}

		var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		if (typeof UserPreferences === "undefined") {
			sap.m.MessageToast.show("UserPreferences Don't exist yet ?"); 
			UserPreferences = new sap.ui.model.json.JSONModel();
			UserPreferences.onlineStatus = navigator.onLine;
		}
		if (UserPreferences.onlineStatus) {
			this.appOfflineStore.startTimeRefresh = new Date();
			console.log("offline store flush called");
			var that = this;
			this.appOfflineStore.store.flush(
				function() {
					that.flushStoreCallback();
				},
				function(e) {
					that.flushErrorCallback(e);
				});
		}
	}

	/*
	function refreshOfflineStoreOnInterval() {
		var that = this;
		this.appOfflineStore.refreshTimeID = setInterval(function () {
			that.refreshAppOfflineStore()}, 
			that.appOfflineStore.interval);  //call refreshStore every interval,
	}
	*/
});