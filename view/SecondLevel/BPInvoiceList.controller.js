jQuery.sap.require("com.springer.financefscmapp.util.Formatter");
jQuery.sap.require("com.springer.financefscmapp.util.Controller");

com.springer.financefscmapp.util.Controller.extend("com.springer.financefscmapp.view.SecondLevel.BPInvoiceList", {

	UserPreferences: {},
	currentEntity: null,
	i18model: {},
	
	onInit: function() {
		this.getView().addEventDelegate({
			onAfterShow: jQuery.proxy(function(evt) {
				this.onAfterShow(evt);
			}, this)
		}); 
		this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
	},
	
	onRouteMatched: function(evt) {
		var oParameters = evt.getParameters();
		// check that the called view name is like expected
		if (oParameters.name !== "_BPInvoiceList") {
			return;
		}
		this.i18model = this.getView().getModel("i18n").getResourceBundle();
		this.currentEntity = oParameters.arguments.entity;
		var sAggregationPath = "";
		if (Object.keys(this.UserPreferences).length < 1) {
			this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		}
		if (this.UserPreferences.AppView === "OpenItemLive") {
			sAggregationPath = "/" + this.currentEntity + "/OPEN_ITEM_BP_DETAILVIEWSet";
		}else {
			sAggregationPath = "/" + this.currentEntity + "/OPEN_ITEMS_SAVED_INVOICES_PER_USERSet";
		}
        var oTable = this.getView().byId("idInvListTable");
		oTable.bindAggregation("items",sAggregationPath,sap.ui.xmlfragment("com.springer.financefscmapp.view.HelpDialogs.RowFiDocument", this));
	},

	onAfterShow: function() {
		var contextModel = sap.ui.getCore().getModel("ContextModel");
		if (contextModel.Partner !== "") {
			this.getView().byId("invoiceOverviewBP").setTitle("Invoices BP " + contextModel.partner);
		}
		this.getView().setBusy(false); 
	},
	
	onInvoiceSearch: function() {
		// add filter for search
		var filters = [];
		var searchString = this.getView().byId("InvoiceSearchText").getValue();
		if (searchString && searchString.length > 0) {
			var filter1 = new sap.ui.model.Filter("SapDocumentId", sap.ui.model.FilterOperator.EQ, searchString);
			//var filter2 = new sap.ui.model.Filter("PartnerDesc", sap.ui.model.FilterOperator.Contains, searchString);
			filters = [filter1];
		} else {
			filters = [this.filterOImodeActive];
		}

		// update list binding
		this.getView().byId("idInvListTable").getBinding("items").filter(filters);
	},

	onNavBack: function() {
		this.getView().setBusy(true); 
		var bReplace = sap.ui.Device.system.phone ? false : true;
		this.getRouter().navTo("_BPOverviewList", {
			currentView: this.getView()
		}, bReplace);
	},

	// Take care of the navigation through the hierarchy when the user selects a table row
	handleSelectionChange: function(oEvent,that, partner) {
		var oItem = oEvent.getSource();
		
		if (typeof that === "undefined") {
			that = this;
		}
		var contextModel = sap.ui.getCore().getModel("ContextModel");
		if (typeof contextModel === "undefined") {
			contextModel = new sap.ui.model.json.JSONModel();
		}
		if (typeof this.currentEntity === "undefined" || this.currentEntity === null) {
			if (typeof partner !== "undefined") {
				contextModel.partner = partner;
			}
			if(typeof contextModel.partner !== "undefined" && contextModel.partner !== "") {
				if (Object.keys(this.UserPreferences).length < 1) {
					this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
				}
				if (this.UserPreferences.AppView === "OpenItemLive") {
					this.currentEntity = "OPEN_ITEM_BP_OVERVIEWSet('" + contextModel.partner + "')";
				} else {
					this.currentEntity = "OPEN_ITEMS_SAVED_PER_USERSet(UserId='" + this.UserPreferences.UserId + "',Partner='" + contextModel.partner + "')";
				}
			}
		}
		contextModel.backentity = this.currentEntity;
		contextModel.isOpen     = oItem.getBindingContext().getProperty("Openitem");
		contextModel.invoice    = oItem.getBindingContext().getProperty("SapDocumentId");
		contextModel.disputeCase    = oItem.getBindingContext().getProperty("DisputeCase");
		contextModel.FinPromisedAmt = oItem.getBindingContext().getProperty("FinPromisedAmt");
		sap.ui.getCore().setModel(contextModel, "ContextModel");

		var bReplace = sap.ui.Device.system.phone ? false : true;
		that.getRouter().navTo("_BPInvoiceDetail", {
			from: "_BPInvoiceList",
			entity: oItem.getBindingContext().getPath().substr(1),
			docid: oItem.getBindingContext().getProperty("SapDocumentId")
		}, bReplace);
	}
});