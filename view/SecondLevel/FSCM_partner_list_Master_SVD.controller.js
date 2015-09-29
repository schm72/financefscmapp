jQuery.sap.require("com.springer.financefscmapp.util.Formatter");
jQuery.sap.require("com.springer.financefscmapp.util.Controller");

com.springer.financefscmapp.util.Controller.extend("com.springer.financefscmapp.view.SecondLevel.FSCM_partner_list_Master_SVD", {

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
			oEventBus.publish("FSCM_partner_list_Master_SVD", "InitialLoadFinished", {
				oListItem: this.getView().byId("list").getItems()[0]
			});
		}, this);

		oEventBus.subscribe("FSCM_partner_list_Detail_SVD", "TabChanged", this.onDetailTabChanged, this);

		//on phones, we will not have to select anything in the list so we don't need to attach to events
		if (sap.ui.Device.system.phone) {
			return;
		}

		this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);

		oEventBus.subscribe("FSCM_partner_list_Detail_SVD", "Changed", this.onDetailChanged, this);
		oEventBus.subscribe("FSCM_partner_list_Detail_SVD", "NotFound", this.onNotFound, this);
	},

	/**
	 * Master view RoutePatternMatched event handler
	 * @param{sap.ui.base.Event} oEvent router pattern matched event object
	 */
	onRouteMatched: function(oEvent) {
		var sName = oEvent.getParameter("name");
		if (sName !== "_FSCM_partner_list_Master_SVD") {
			return;
		}
		//Load the detail view in desktop
		this.getRouter().myNavToWithoutHash({
			currentView: this.getView(),
			targetViewName: "com.springer.financefscmapp.view.SecondLevel.FSCM_partner_list_Detail_SVD",
			targetViewType: "XML"
		});
		//Wait for the list to be loaded once
		this.waitForInitialListLoading(function() {
			//On the empty hash select the first item
			this.selectFirstItem();
		});
	},


	onAfterShow: function() {
		var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		if (UserPreferences.onlineStatus) {
        	this.byId("refreshOIButton").setVisible(true);
        	this.byId("OpenItemSearchText1").setVisible(true);
        	this.byId("OpenItemSearchText2").setVisible(true);
		} else {
            this.byId("refreshOIButton").setVisible(false);
            this.byId("OpenItemSearchText1").setVisible(false);
            this.byId("OpenItemSearchText2").setVisible(false);
		}
	},
	

	/**
	 * Detail changed event handler, set selected item
	 * @param{String} sChanel event channel name
	 * @param{String}} sEvent event name
	 * @param{Object}} oData event data object
	 */
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

	/**
	 * Detail TabChanged event handler
	 * @param{String} sChanel event channel name
	 * @param{String}} sEvent event name
	 * @param{Object}} oData event data object
	 */
	onDetailTabChanged: function(sChanel, sEvent, oData) {
		this.sTab = oData.sTabKey;
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
		var oList = this.getView().byId("list");
		var aItems = oList.getItems();
		if (aItems.length) {
			oList.setSelectedItem(aItems[0], true);
			this._selectedItemIdx = 0;
		}
	},

	/**
	 * Event handler for the master search field. Applies current
	 * filter value and triggers a new search. If the search field's
	 * 'refresh' button has been pressed, no new search is triggered
	 * and the list binding is refresh instead.
	 */
	onItemSearch1 : function() {
		// add filter for search
		var filters = [];
		var searchString = this.getView().byId("OpenItemSearchText1").getValue();
		if (searchString && searchString.length > 0) {
			filters = [ new sap.ui.model.Filter("Partner", sap.ui.model.FilterOperator.Contains, searchString) ];
		}

		// update list binding
		var list = this.getView().byId("list");
		list.getBinding("items").filter(filters);
		this._selectedItemIdx = list.indexOfItem(list.getSelectedItem());
	},
	onItemSearch2 : function() {
		// add filter for search
		var filters = [];
		var searchString = this.getView().byId("OpenItemSearchText2").getValue();
		if (searchString && searchString.length > 0) {
			filters = [ new sap.ui.model.Filter("Lid", sap.ui.model.FilterOperator.eq, searchString) ];
		}

		// update list binding
		var list = this.getView().byId("list");
		list.getBinding("items").filter(filters);
		this._selectedItemIdx = list.indexOfItem(list.getSelectedItem());
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
		var bReplace = jQuery.device.is.phone ? false : true;
		this.getRouter().navTo("_FSCM_partner_list_Detail_SVD", {
			from: "_FSCM_partner_list_Master_SVD",
			entity: oItem.getBindingContext().getPath().substr(1),
			tab: this.sTab
		}, bReplace);
	},

	refreshData : function() {
		if (com.springer.financefscmapp.dev.devapp.isLoaded) {
			var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
			if (UserPreferences.onlineStatus) {
				var oEventBus = this.getEventBus();
				oEventBus.publish("OfflineStore", "Refreshing");
			} else {
				//var filters = [];
				//this.getView().byId("list").getBinding("items").filter(filters);
				this.getView().getModel().refresh(true);
			}
		} else {
			//var filters = [];
			//this.getView().byId("list").getBinding("items").filter(filters);
			this.getView().getModel().refresh(true);
		}
	},

	onListView: function() {
		var bReplace = jQuery.device.is.phone ? false : true;
		this.getRouter().navTo("_OpenItemsOverViewList_SVD", {
			currentView: this.getView()
		}, bReplace);
	},
	
	onNavBack: function() {
		this.getRouter().navTo("_A2_Welcome", {
			currentView: this.getView()
		}, this.bReplace);
		//window.history.go(-1);
	}
});