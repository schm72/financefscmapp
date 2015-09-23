jQuery.sap.require("com.springer.financefscmapp.util.Formatter");
jQuery.sap.require("com.springer.financefscmapp.util.Controller");

com.springer.financefscmapp.util.Controller.extend("com.springer.financefscmapp.view.SecondLevel.BPInvoiceList_SVD", {

	_UserPreferences: {},
	currentEntity: null,
	
	onInit: function() {
		this.getView().addEventDelegate({
			onAfterShow: jQuery.proxy(function(evt) {
				this.onAfterShow(evt);
			}, this)
		}); 
		this._UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
	},
	
	onRouteMatched: function(evt) {
		var oParameters = evt.getParameters();
		// check that the called view name is like expected
		if (oParameters.name !== "_BPInvoiceList_SVD") {
			return;
		}
		this.currentEntity = oParameters.arguments.entity;
		var sAggregationPath = "/" + this.currentEntity + "/OPEN_ITEMS_SAVED_INVOICES_PER_USERSet";
        var oTable = this.byId("idInvListTable");
		oTable.bindAggregation("items",sAggregationPath,sap.ui.xmlfragment("com.springer.financefscmapp.view.HelpDialogs.RowFiDocument", this));
	},

	onAfterShow: function() {
		this.getView().setBusy(false); 
		var contextModel = sap.ui.getCore().getModel("ContextModel");
		if (contextModel.Partner !== "") {
			this.byId("invoiceOverviewBP").setTitle("Saved Invoices BP " + contextModel.partner);
		}
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
		var bReplace = jQuery.device.is.phone ? false : true;
		this.getRouter().navTo("_OpenItemsOverViewList_SVD", {
			currentView: this.getView()
		}, bReplace);
	},

	// Take care of the navigation through the hierarchy when the user selects a table row
	handleSelectionChange: function(oEvent) {
		this.getView().setBusy(true);
		
		var oItem = oEvent.getSource();
		var contextModel = sap.ui.getCore().getModel("ContextModel");
		contextModel.backentity = this.currentEntity;
		contextModel.isOpen = oItem.getBindingContext().getProperty("Openitem");
		contextModel.invoice = oItem.getBindingContext().getProperty("SapDocumentId");
		contextModel.disputeCase = oItem.getBindingContext().getProperty("DisputeCase");
		contextModel.FinPromisedAmt = oItem.getBindingContext().getProperty("FinPromisedAmt");
		sap.ui.getCore().setModel(contextModel, "ContextModel");
		
		var bReplace = jQuery.device.is.phone ? false : true;
		this.getRouter().navTo("_BPInvoiceDetail_SVD", {
			from: "_BPInvoiceList_SVD",
			entity: oItem.getBindingContext().getPath().substr(1),
			docid: oItem.getBindingContext().getProperty("SapDocumentId")
		}, bReplace);
	}
});
