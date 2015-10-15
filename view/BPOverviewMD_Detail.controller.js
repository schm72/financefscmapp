jQuery.sap.require("com.springer.financefscmapp.util.Formatter");
jQuery.sap.require("com.springer.financefscmapp.util.Controller");

com.springer.financefscmapp.util.Controller.extend("com.springer.financefscmapp.view.BPOverviewMD_Detail", {

	i18model: {},

	/**
	 * Called when the detail list controller is instantiated.
	 */
	onInit: function() {
		this.getView().addEventDelegate({
			onAfterShow: jQuery.proxy(function(evt) {
				this.onAfterShow(evt);
			}, this)
		});

		this.getEventBus().subscribe("BPOverviewMD_Master", "FirstItemSelected", this.checkDeleteButtonVisible, this);

		this.oInitialLoadFinishedDeferred = jQuery.Deferred();
		if (sap.ui.Device.system.phone) {
			//don't wait for the master on a phone
			this.oInitialLoadFinishedDeferred.resolve();
		} else {
			this.getView().setBusy(true);
			this.getEventBus().subscribe("BPOverviewMD_Master", "InitialLoadFinished", this.onMasterLoaded, this);
		}

		this.getRouter().attachRouteMatched(this.onRouteMatched, this);
	},

	/**
	 * online icon formatter
	 */
	onlineIconVisible: function(bIsOffline, bIsPhone) {
		return bIsPhone && bIsOffline;
	},

	onMasterLoaded: function(sChannel, sEvent, oData) {
		console.log("MasterLoaded");
		if (oData.oListItem) {
			this.bindView(oData.oListItem.getBindingContext().getPath());
			this.getView().setBusy(false);
			this.oInitialLoadFinishedDeferred.resolve();
		}
	},

	onRouteMatched: function(oEvent) {
		var oParameters = oEvent.getParameters();
		jQuery.when(this.oInitialLoadFinishedDeferred).then(jQuery.proxy(function() {
			this.getView().setBusy(false);
			// when detail navigation occurs, update the binding context
			if (oParameters.name !== "_BPOverviewMD_Detail") {
				return;
			}

			var sEntityPath = "/" + oParameters.arguments.entity;
			this.bindView(sEntityPath);
			// activate first tab
			var idIconTabBar = this.getView().byId("idIconTabBar");
			if (idIconTabBar.getSelectedKey() !== "Details") {
				idIconTabBar.setSelectedKey("Details");
			}
		}, this));
	},

	checkDeleteButtonVisible: function() {
		var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		var button = this.getView().byId("deleteButton");
		if (UserPreferences.AppView === "OpenItemLive") {
			button.setVisible(false);
		} else {
			button.setVisible(true);
		}
	},

	onAfterShow: function() {
		this.i18model = this.getView().getModel("i18n").getResourceBundle();
	},

	bindView: function(sEntityPath) {
		var oView = this.getView();
		oView.bindElement(sEntityPath);

		//Check if the data is already on the client
		if (!oView.getModel().getData(sEntityPath)) {
			// Check that the entity specified actually was found.
			oView.getElementBinding().attachEventOnce("dataReceived", jQuery.proxy(function() {
				var oData = oView.getModel().getData(sEntityPath);
				if (!oData) {
					this.showEmptyView();
					this.fireDetailNotFound();
				} else {
					this.fireDetailChanged(sEntityPath);
				}
			}, this));
		} else {
			this.fireDetailChanged(sEntityPath);
		}
		this.checkDeleteButtonVisible();
	},

	showEmptyView: function() {
		this.getRouter().myNavToWithoutHash({
			currentView: this.getView(),
			targetViewName: "com.springer.financefscmapp.view.HelpDialogs.NotFound",
			targetViewType: "XML"
		});
	},

	fireDetailChanged: function(sEntityPath) {
		this.getEventBus().publish("BPOverviewMD_Detail", "Changed", {
			sEntityPath: sEntityPath
		});
	},

	fireDetailNotFound: function() {
		this.getEventBus().publish("BPOverviewMD_Detail", "NotFound");
	},

	onAddFav: function(oEvent) {

		this.getView().setBusy(true);
		this.addedFavorite = "";
		if (oEvent.getParameter("state") === true) {
			this.addedFavorite = "X";
		}

		this.currentFavoritePartner = com.springer.financefscmapp.util.Formatter.overlayTenZero(oEvent.getSource().getBindingContext().getProperty(
			"Partner"));

		var oModel = this.getView().getModel();
		var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		// change the favorite information
		if (UserPreferences.AppView === "OpenItemLive") {
			this.addRemoveFavorite(this.addedFavorite, oModel, "OPEN_ITEM_BP_OVERVIEWSet('" + this.currentFavoritePartner + "')", this.currentFavoritePartner,
				this);
		} else {
			this.openDeleteConfirmDialog();
		}
	},

	openDialog: function(sI18nKeyword) {
		if (!this._dialog) {
			var id = this.getView().getId();
			var frgId = id + "-msgDialog";
			this._dialog = sap.ui.xmlfragment(frgId, "com.springer.financefscmapp.view.HelpDialogs.MsgDialog", this);
			this.getView().addDependent(this._dialog);
			this._dialogText = sap.ui.core.Fragment.byId(frgId, "dialogText");
		}
		this._dialogText.bindProperty("text", sI18nKeyword);
		this._dialog.open();
	},
	closeDialog: function() {
		this.getView().setBusy(false);
		if (this._dialog) {
			this._dialog.close();
		}
	},
	openDeleteConfirmDialog: function() {
		console.log("deleteDialogStart");
		if (!this._deleteConfirmDialog) {
			var id = this.getView().getId();
			var frgId = id + "-_dialog_DeleteConfirm";
			this._deleteConfirmDialog = sap.ui.xmlfragment(frgId, "com.springer.financefscmapp.view.HelpDialogs.Dialog_DeleteConfirm", this);
			this.getView().addDependent(this._deleteConfirmDialog);
		}
		this._deleteConfirmDialog.open();
	},

	confirmDelete: function() {
		if (this._deleteConfirmDialog) {
			this._deleteConfirmDialog.close();
		}
		if (this.currentFavoritePartner !== "") {
			// delete from favorite table
			var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
			var delPath = "/OPEN_ITEMS_SAVED_PER_USERSet(UserId='" + UserPreferences.UserId + "',Partner='" + this.currentFavoritePartner +
				"')";
			var model = this.getView().getModel();
			if (model) {
				this.getView().setBusy(true);
				model.remove(delPath, {
					success: jQuery.proxy(function() {
						this.getView().setBusy(false);
						UserPreferences.CountFscmFav--;
						sap.ui.getCore().setModel(UserPreferences, "UserPreferences");
						this.onNavBack();
						//this.openDialog("i18n>deleteSuccess");
					}, this),
					error: jQuery.proxy(function() {
						this.getView().setBusy(false);
						this.openDialog("i18n>deleteFailed");
					}, this)
				});
			}
		}
	},

	closeDeleteConfirmDialog: function() {

		var oSwitch = this.getView().byId("oSwitch");
		if (this.addedFavorite === "X") {
			oSwitch.setState(false);
		} else {
			oSwitch.setState(true);
		}

		this.getView().setBusy(false);
		if (this._deleteConfirmDialog) {
			this._deleteConfirmDialog.close();
		}
	},

	deleteItem: function(oEvent) {
		//this.openDeleteConfirmDialog();
		//var oModel = this.getView().getModel();
		//var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		this.currentFavoritePartner = com.springer.financefscmapp.util.Formatter.overlayTenZero(oEvent.getSource().getBindingContext().getProperty("Partner"));
		//var oDataPath = "OPEN_ITEMS_SAVED_PER_USERSet(UserId='" + UserPreferences.UserId + "',Partner='" + this.currentFavoritePartner + "')";
		//this.addRemoveFavorite("", oModel, oDataPath, this.currentFavoritePartner, this);
		this.openDeleteConfirmDialog();
	},

	onDetailSelect: function(oEvent) {
		var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		var currentEntity = this.getView().getBindingContext().getPath();

		var key = oEvent.getParameters().key;
		switch (key) {
			case "Details":
				//sap.m.MessageToast.show("Info");
				break;
			case "Invoices":
				var sAggregationPath = "";
				if (UserPreferences.AppView === "OpenItemLive") {
					sAggregationPath = currentEntity + "/OPEN_ITEM_BP_DETAILVIEWSet";
				} else {
					sAggregationPath = currentEntity + "/OPEN_ITEMS_SAVED_INVOICES_PER_USERSet";
				}
				var oTable = this.getView().byId("idInvListTable");
				oTable.bindAggregation("items", sAggregationPath, sap.ui.xmlfragment(
					"com.springer.financefscmapp.view.HelpDialogs.RowFiDocument", this));
				//sap.m.MessageToast.show("Attach"); 
				break;
			case "Actions":
				//sap.m.MessageToast.show("Action"); 
				break;
			case "Notes":
				//sap.m.MessageToast.show("Note"); 
				break;
			default:
		}
	},
	handleSelectionChange: function(oEvent) {
		var partner = com.springer.financefscmapp.util.Formatter.overlayTenZero(oEvent.getSource().getBindingContext().getProperty("Partner"));
		sap.ui.controller("com.springer.financefscmapp.view.SecondLevel.BPInvoiceList").handleSelectionChange(oEvent, this, partner);
	},
	refreshData: function() {
		console.log("refresh");
		var model = this.getView().getModel();
		var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		if (UserPreferences.AppView === "OpenItemLive") {
			model.refresh();
		} else {
			if (com.springer.financefscmapp.dev.devapp.isLoaded) {
				if (UserPreferences.onlineStatus) {
					var oEventBus = this.getEventBus();
					oEventBus.publish("OfflineStore", "Refreshing");
				} else {
					//var filters = [];
					//this.getView().byId("list").getBinding("items").filter(filters);
					model.refresh();
				}
			} else {
				//var filters = [];
				//this.getView().byId("list").getBinding("items").filter(filters);
				model.refresh();
			}
		}
	},

	onNavBack: function() {
		// This is only relevant when running on phone devices
		this.getRouter().myNavBack("BPOverviewMD_Master");
	}

});