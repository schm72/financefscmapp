jQuery.sap.require("com.springer.springerfscmapp.util.Formatter");
jQuery.sap.require("com.springer.springerfscmapp.util.Controller");

com.springer.springerfscmapp.util.Controller.extend("com.springer.springerfscmapp.view.SecondLevel.MessageCollector", {

	_oDialog: null,
	parameter: 0,
	countCalls: 0,

	onInit: function() {
		this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
		this.getEventBus().subscribe("MessageCollector", "UserMessage", this.onUserMessage, this);
	},

	onRouteMatched: function(evt) {
		// check that the called view name is like expected
		if (evt.getParameter("name") !== "_MessageCollector") {
			return;
		}

		this.parameter = 0;
		this.countCalls = 0;

		var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		UserPreferences.NewMessage = " ";
		sap.ui.getCore().setModel(UserPreferences, "UserPreferences");

		var that = this;
		this.mGroupFunctions = {
			MessageType: function(oContext) {
				var name = oContext.getProperty("MessageType");
				return {
					key: name,
					text: name
				};
			},
			ChangeTime: function(oContext) {
				var today = new Date();
				var yesterday = new Date(today.setDate(today.getDate() - 1));
				var old = new Date(today.setDate(today.getDate() - 1));
				var messageYear = new Date(oContext.getProperty("ChangeTime")).getFullYear();
				var messageMonth = new Date(oContext.getProperty("ChangeTime")).getMonth();
				var messageDay = new Date(oContext.getProperty("ChangeTime")).getDate();
				var messageDate = new Date(messageYear, messageMonth, messageDay);
				var vCheck = that.compare(messageDate, yesterday);
				var vCheck2 = that.compare(messageDate, old);
				var key, text;
				if (vCheck2 < 0) {
					key = "OLD";
					text = "Old messages";
				} else if (vCheck < 0) {
					key = "YESTERDAY";
					text = "Messages from Yesterday";
				} else {
					key = "TODAY";
					text = "New Messages";
				}
				return {
					key: key,
					text: text
				};
			}
		};
	},
	onNewMessage: function(oModel, message, messageType, origin) {
		// save messgaes
		var vSolved = "";
		if (messageType === "N" || messageType === "S") {
			vSolved = "X";
		}
		var oEntry = {
			EntryId: "EXTERN",
			UserId: "EXTERN",
			Application: "SPRINGERFSCMAPP",
			Origin: origin,
			MessageType: messageType,
			Message: message,
			Solved: vSolved,
			ChangeTime: null,
			ChangeUser: null,
			MessageStatus: "READ"
		};
		// Send OData Create request
		oModel.create("/APP_MESSAGESSet", oEntry, null, null, null);

		// show the text to frontend
		if (messageType === "U") {
			sap.m.MessageToast.show("Message sent: " + message);
		} else {
			sap.m.MessageToast.show(message);
		}
	},

	onMessageSearch: function() {
		// add filter for search
		var filters = [];
		var searchString = this.getView().byId("MessageSearchText").getValue();
		if (searchString && searchString.length > 0) {
			filters = [new sap.ui.model.Filter("Message", sap.ui.model.FilterOperator.Contains, searchString)];
		}
		// update list binding
		this.getView().byId("idMessageTable").getBinding("items").filter(filters);
	},

	onExit: function() {
		if (this._oDialog) {
			this._oDialog.destroy();
		}
	},

	handleViewSettingsDialogButtonPressed: function(oEvent) {
		if (!this._oDialog) {
			this._oDialog = sap.ui.xmlfragment("com.springer.springerfscmapp.view.HelpDialogs.Dialog_Messages", this);
		}
		// toggle compact style
		jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
		this._oDialog.open();
	},

	handleConfirm: function(oEvent) {

		var oView = this.getView();
		var oTable = oView.byId("idMessageTable");

		var mParams = oEvent.getParameters();
		var oBinding = oTable.getBinding("items");

		// apply sorter to binding
		// (grouping comes before sorting)
		var aSorters = [];
		var sPath;
		var bDescending;
		if (mParams.groupItem) {
			sPath = mParams.groupItem.getKey();
			bDescending = mParams.groupDescending;
			var vGroup = this.mGroupFunctions[sPath];
			aSorters.push(new sap.ui.model.Sorter(sPath, bDescending, vGroup));
		}
		sPath = mParams.sortItem.getKey();
		bDescending = mParams.sortDescending;
		aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
		oBinding.sort(aSorters);

		// apply filters to binding
		var aFilters = [];
		jQuery.each(mParams.filterItems, function(i, oItem) {
			var aSplit = oItem.getKey().split("___");
			sPath = aSplit[0];
			var sOperator = aSplit[1];
			var sValue1 = aSplit[2];
			var oFilter;
			if (sOperator === "BT" || sOperator === "LE" || sOperator === "GT") {
				var date = new Date();
				var today = new Date(date.setDate(date.getDate() - 1));
				var yesterday = new Date(date.setDate(date.getDate() - 1));
				var old = new Date(date.setDate(date.getDate() - 1));
				if (sPath === "ChangeTime") {
					switch (sValue1) {
						case "TODAY":
							if (aSplit.length > 3) {
								oFilter = new sap.ui.model.Filter(sPath, sOperator, yesterday, today);
							} else {
								oFilter = new sap.ui.model.Filter(sPath, sOperator, today);
							}
							break;
						case "OLD":
							oFilter = new sap.ui.model.Filter(sPath, sOperator, old);
							break;
						default:
					}
				} else {
					oFilter = new sap.ui.model.Filter(sPath, sOperator, sValue1);
				}
			} else {
				oFilter = new sap.ui.model.Filter(sPath, sOperator, sValue1);
			}
			aFilters.push(oFilter);
		});
		if (aFilters.length > 0) {
			oBinding.filter(aFilters);
		}
		// update filter bar
		oView.byId("vsdFilterBar").setVisible(aFilters.length > 0);
		oView.byId("vsdFilterLabel").setText(mParams.filterString);

	},

	handleDeleteMessage: function() {
		this.getView().setBusy(true);
		var that = this;
		var oModel = this.getView().getModel();
		var oTable = this.getView().byId("idMessageTable");
		var listItems = oTable.getSelectedItems();
		var item    = {};
        var context = {};
        var entryId = "";
		this.countCalls = listItems.length;
		for (var i = 0; i < listItems.length; i++) {
			item    = listItems[i];
			context = item.getBindingContext();
			entryId = context.getProperty("EntryId");
			oModel.read("APP_MESSAGESSet", null, ["$filter=EntryId eq '" + entryId + "'"], true,
				function(oData, oResponse) {
					if (oData.results[0]) {
						oData.results[0].MessageStatus = "DELETED";
						oModel.update("APP_MESSAGESSet('" + entryId + "')", oData.results[0], null, null, null);
					}
					that.onUpdateFinished();
				},
				function(oError) {
					sap.m.MessageToast.show("Update failed " + oError);
					that.onUpdateFinished();
				}
			);

		}
	},
	handleSolveMessage: function() {
		this.getView().setBusy(true);
		var that = this;
		var oModel = this.getView().getModel();
		var listItems = this.getView().byId("idMessageTable").getSelectedItems();
		var item    = {};
        var context = {};
        var entryId = "";
		this.countCalls = listItems.length;
		for (var i = 0; i < listItems.length; i++) {
			item = listItems[i];
			context = item.getBindingContext();
			entryId = context.getProperty("EntryId");
			oModel.read("APP_MESSAGESSet", null, ["$filter=EntryId eq '" + entryId + "'"], true,
				function(oData, oResponse) {
					if (oData.results[0]) {
						oData.results[0].Solved = "X";
						oModel.update("APP_MESSAGESSet('" + entryId + "')", oData.results[0], null, null, null);
					}
					that.onUpdateFinished();
				},
				function(oError) {
					sap.m.MessageToast.show("Update failed " + oError);
					that.onUpdateFinished();
				}
			);

		}
	},
	
	onUpdateFinished: function() {
// check if all updates are ready and start the refresh 1 second later asynchronous
		this.parameter++;
		if (this.parameter >= this.countCalls) {
            this.parameter = 0;
            this.getView().setBusy(false);
            var that = this;
            window.setTimeout(function(){ 
                that.getView().getModel().refresh(true);
             }, 1000);
		}
	},
	
	convert: function(d) {
		// Converts the date in d to a date-object. The input can be:
		//   a date object: returned without modification
		//  an array      : Interpreted as [year,month,day]. NOTE: month is 0-11.
		//   a number     : Interpreted as number of milliseconds
		//                  since 1 Jan 1970 (a timestamp)
		//   a string     : Any format supported by the javascript engine, like
		//                  "YYYY/MM/DD", "MM/DD/YYYY", "Jan 31 2009" etc.
		//  an object     : Interpreted as an object with year, month and date
		//                  attributes.  **NOTE** month is 0-11.
		return (
			d.constructor === Date ? d :
			d.constructor === Array ? new Date(d[0], d[1], d[2]) :
			d.constructor === Number ? new Date(d) :
			d.constructor === String ? new Date(d) :
			typeof d === "object" ? new Date(d.year, d.month, d.date) :
			NaN
		);
	},
	compare: function(a, b) {
		// Compare two dates (could be of any type supported by the convert
		// function above) and returns:
		//  -1 : if a < b
		//   0 : if a = b
		//   1 : if a > b
		// NaN : if a or b is an illegal date
		// NOTE: The code inside isFinite does an assignment (=).
		return (
			isFinite(a = this.convert(a).valueOf()) &&
			isFinite(b = this.convert(b).valueOf()) ?
			(a > b) - (a < b) :
			NaN
		);
	},
	onViewUserMessage: function() {
		var feedbackText = this.byId("UserMessageField").getValue();
		if (feedbackText === "") {
			return;
		}
		this.getEventBus().publish("MessageCollector", "UserMessage", feedbackText);
	},
	onUserMessage: function(sChannel, sEvent, message) {
		var oModel = this.getView().getModel();
		sap.ui.controller("com.springer.springerfscmapp.view.SecondLevel.MessageCollector").onNewMessage(oModel, message, "U", "UserMessage");
	},

	onNavBack: function() {
		var bReplace = jQuery.device.is.phone ? false : true;
		this.getRouter().navTo("_A2_Welcome", {
			currentView: this.getView()
		}, bReplace);
	}

});