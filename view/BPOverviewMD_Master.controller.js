jQuery.sap.require("com.springer.financefscmapp.util.Formatter");
jQuery.sap.require("com.springer.financefscmapp.util.Controller");

com.springer.financefscmapp.util.Controller.extend("com.springer.financefscmapp.view.BPOverviewMD_Master", {

	i18model: {},

	/**
	 * Called when the master list controller is instantiated.
	 * It sets up the event handling for the master/detail communication and other lifecycle tasks.
	 */
	onInit: function() {
		this.getView().addEventDelegate({
			onAfterShow: jQuery.proxy(function(evt) {
				this.onAfterShow(evt);
			}, this)
		});
		this.oInitialLoadFinishedDeferred = jQuery.Deferred();
		var oEventBus = this.getEventBus();

		this.getView().byId("list").attachEventOnce("updateFinished", function() {
			this.oInitialLoadFinishedDeferred.resolve();
			oEventBus.publish("BPOverviewMD_Master", "InitialLoadFinished", {
				oListItem: this.getView().byId("list").getItems()[0]
			});
		}, this);

		oEventBus.subscribe("BPOverviewMD_Detail", "TabChanged", this.onDetailTabChanged, this);

		//on phones, we will not have to select anything in the list so we don't need to attach to events
		this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
		if (sap.ui.Device.system.phone) {
			return;
		}
		oEventBus.subscribe("BPOverviewMD_Detail", "Changed", this.onDetailChanged, this);
		oEventBus.subscribe("BPOverviewMD_Detail", "NotFound", this.onNotFound, this);
	},

	/**
	 * Master view RoutePatternMatched event handler
	 * @param{sap.ui.base.Event} oEvent router pattern matched event object
	 */
	onRouteMatched: function(oEvent) {
		var sName = oEvent.getParameter("name");
		if (sName !== "_BPOverviewMD_Master") {
			return;
		}

		var oList = this.getView().byId("list");
		var sAggregationPath = "";
		var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		if (UserPreferences.AppView === "OpenItemLive") {
			sAggregationPath = "/OPEN_ITEM_BP_OVERVIEWSet";
		} else {
			sAggregationPath = "/OPEN_ITEMS_SAVED_PER_USERSet";
		}
		oList.unbindAggregation("items");
		oList.bindAggregation("items", sAggregationPath, sap.ui.xmlfragment(
			"com.springer.financefscmapp.view.HelpDialogs.OpenItemPartnerMasterRows", this));

		//Load the detail view in desktop
		this.getRouter().myNavToWithoutHash({
			currentView: this.getView(),
			targetViewName: "com.springer.financefscmapp.view.BPOverviewMD_Detail",
			targetViewType: "XML"
		});
		
		//Wait for the list to be loaded once
		this.waitForInitialListLoading(function() {
			var contextModel = sap.ui.getCore().getModel("ContextModel");
			if (typeof contextModel !== "undefined" && typeof contextModel.navFromPartnerToMD !== "undefined" && contextModel.navFromPartnerToMD !== null) {
				var bReplace = sap.ui.Device.system.phone ? false : true;
				this.getRouter().navTo("_BPOverviewMD_Detail", {
					from: "_BPOverviewMD_Master",
					entity: contextModel.navFromPartnerToMD
				}, bReplace);
				contextModel.navFromPartnerToMD = null;
			} else {
				//On the empty hash select the first item
				this.selectFirstItem();
			}
		});
		var oEventBus = this.getEventBus();
		oEventBus.publish("BPOverviewMD_Master", "FirstItemSelected");
	},

	onAfterShow: function() {
		this.i18model = this.getView().getModel("i18n").getResourceBundle();
		var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		if (UserPreferences.onlineStatus) {
			this.getView().byId("refreshOIButton").setVisible(true);
			this.getView().byId("OpenItemSearchText1").setVisible(true);
			this.getView().byId("OpenItemSearchText2").setVisible(true);
		} else {
			this.getView().byId("refreshOIButton").setVisible(false);
			this.getView().byId("OpenItemSearchText1").setVisible(false);
			this.getView().byId("OpenItemSearchText2").setVisible(false);
		}
	},

	onDetailChanged: function(sChanel, sEvent, oData) {
		var sEntityPath = oData.sEntityPath;

		//Wait for the list to be loaded once
		this.waitForInitialListLoading(function() {
			var oList = this.getView().byId("list");

			var oSelectedItem = oList.getSelectedItem();
			// the correct item is already selected
			if (oSelectedItem && oSelectedItem.getBindingContext().getPath() === sEntityPath) {
				return;
			}

			var aItems = oList.getItems();

			for (var i = 0; i < aItems.length; i++) {
				if (aItems[i].getBindingContext().getPath() === sEntityPath) {
					oList.setSelectedItem(aItems[i], true);
					break;
				}
			}
		});
	},

	onDetailTabChanged: function(sChanel, sEvent, oData) {
		//this.sTab = oData.sTabKey;
	},

	/**
	 * wait until this.oInitialLoadFinishedDeferred is resolved, and list view updated
	 * @param{function} fnToExecute the function will be executed if this.oInitialLoadFinishedDeferred is resolved
	 */
	waitForInitialListLoading: function(fnToExecute) {
		jQuery.when(this.oInitialLoadFinishedDeferred).then(jQuery.proxy(fnToExecute, this));
	},

	/**
	 * Detail NotFound event handler
	 */
	onNotFound: function() {
		this.getView().byId("list").removeSelections();
	},

	/**
	 * set the first item as selected item
	 */
	selectFirstItem: function() {
		var oList  = this.getView().byId("list");
		var aItems = oList.getItems();
		if (aItems.length) {
			oList.setSelectedItem(aItems[0], true);
			this._selectedItemIdx = 0;
		}

		// when there are no items - check wether there is a background load running - or just no data with current filter
		var oModel = this.getView().getModel();
		var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		var that = this;
		if (aItems.length < 1) {
			oModel.read("APP_OI_USER_LOGSet('" + UserPreferences.UserId + "')", null, null, true,
				function(oData, oResponse) {
					if (oData) {
						if (oData.CountSame > 0) {
							oList.setNoDataText(that.i18model.getText("OINoDataFilter") + " " + 
							oData.CollSegments + " - Countries: " + oData.Countries);
						} else {
							if (sap.ui.Device.system.phone) {
								oList.setNoDataText(that.i18model.getText("OIDataLodInProgress"));
							} else {
								oList.setNoDataText(that.i18model.getText("OIDataLodInProgressLong"));
							}
						}
					} else {
						oList.setNoDataText(that.i18model.getText("OINoDataSuccess"));
					}
				},
				function(oError) {
					oList.setNoDataText(that.i18model.getText("OINoServerCon"));
				}
			);
		} else {
			// when table tdata available - check if data up to data
			var data = oModel.getProperty(aItems[0].getBindingContext().getPath());
			if (data['OldDataDueToCurrentLoad'] === "X") {
				sap.m.MessageToast.show(that.i18model.getText("OIDataLodInProgress"));
			}
		}
	},

	/**
	 * Event handler for the master search field. Applies current
	 * filter value and triggers a new search. If the search field's
	 * 'refresh' button has been pressed, no new search is triggered
	 * and the list binding is refresh instead.
	 */
	onItemSearch1: function() {
		// add filter for search
		this.getView().setBusy(true); 
		var filters = [];
		var searchString = this.getView().byId("OpenItemSearchText1").getValue();
		if (searchString && searchString.length > 0) {
			filters = [new sap.ui.model.Filter("Partner", sap.ui.model.FilterOperator.EQ, searchString)];
		} else {
			filters = [this.filterOImodeActive];
		}

		// update list binding
		var list = this.getView().byId("list");
		list.getBinding("items").filter(filters);
		this._selectedItemIdx = list.indexOfItem(list.getSelectedItem());
		this.getView().setBusy(false); 
	},
	onItemSearch2: function() {
		// add filter for search
		this.getView().setBusy(true); 
		var filters = [];
		var searchString = this.getView().byId("OpenItemSearchText2").getValue();
		if (searchString && searchString.length > 0) {
			filters = [new sap.ui.model.Filter("Lid", sap.ui.model.FilterOperator.EQ, searchString)];
		} else {
			filters = [this.filterOImodeActive];
		}
		
		// update list binding
		var list = this.getView().byId("list");
		list.getBinding("items").filter(filters);
		this._selectedItemIdx = list.indexOfItem(list.getSelectedItem());
		this.getView().setBusy(false); 
	},

	/**
	 * Event handler for the list selection event
	 * @param {sap.ui.base.Event} oEvent the list selectionChange event
	 */
	onSelect: function(oEvent) {
		// Get the list item, either from the listItem parameter or from the event's
		// source itself (will depend on the device-dependent mode).
		var list = this.getView().byId("list");
		var item = oEvent.getParameter("listItem") || oEvent.getSource();

		this._selectedItemIdx = list.indexOfItem(oEvent.getParameter("listItem"));
		this.showDetail(item);
	},

	/**
	 * Shows the selected item on the detail page
	 * On phones a additional history entry is created
	 * @param {sap.m.ObjectListItem} oItem selected Item
	 */
	showDetail: function(oItem) {
		// If we're on a phone, include nav in history; if not, don't.
		var bReplace = sap.ui.Device.system.phone ? false : true;
		this.getRouter().navTo("_BPOverviewMD_Detail", {
			from: "_BPOverviewMD_Master",
			entity: oItem.getBindingContext().getPath().substr(1)
		}, bReplace);
	},

	refreshData: function() {
		this.getView().setBusy(true); 
		var model = this.getView().getModel();
		var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		if (UserPreferences.AppView === "OpenItemLive") {
			model.refresh(true);
		} else {
			if (com.springer.financefscmapp.dev.devapp.isLoaded) {
				if (UserPreferences.onlineStatus) {
					var oEventBus = this.getEventBus();
					oEventBus.publish("OfflineStore", "Refreshing");
				} else {
					//var filters = [];
					//this.getView().byId("list").getBinding("items").filter(filters);
					model.refresh(true);
				}
			} else {
				//var filters = [];
				//this.getView().byId("list").getBinding("items").filter(filters);
				model.refresh(true);
			}
		}
		this.getView().setBusy(false); 
	},

	onListView: function() {
		var bReplace = sap.ui.Device.system.phone ? false : true;
		this.getRouter().navTo("_BPOverviewList", {
			currentView: this.getView()
		}, bReplace);
	},

	onNavBack: function() {
		var bReplace = sap.ui.Device.system.phone ? false : true;
		this.getRouter().navTo("_A2_Welcome", {
			currentView: this.getView()
		}, bReplace);
		//window.history.go(-1);
	}
});
