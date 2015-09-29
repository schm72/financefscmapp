jQuery.sap.require("com.springer.financefscmapp.util.Formatter");
jQuery.sap.require("com.springer.financefscmapp.util.Controller");

com.springer.financefscmapp.util.Controller.extend("com.springer.financefscmapp.view.SecondLevel.FSCM_partner_list_Detail_SVD", {
	
	/**
	 * Called when the detail list controller is instantiated.
	 */
	onInit : function() {
		this.oInitialLoadFinishedDeferred = jQuery.Deferred();
		if(sap.ui.Device.system.phone) {
			//don't wait for the master on a phone
			this.oInitialLoadFinishedDeferred.resolve();
		} else {
			this.getView().setBusy(true);
			this.getEventBus().subscribe("FSCM_partner_list_Master_SVD", "InitialLoadFinished", this.onMasterLoaded, this);
		} 
		this.getRouter().attachRouteMatched(this.onRouteMatched, this);
	},

	/**
	 * online icon formatter
	 */
	onlineIconVisible: function(bIsOffline, bIsPhone) {
		return bIsPhone && bIsOffline;
	},
	
	/**
	 * Master InitialLoadFinished event handler
	 * @param{String} sChanel event channel name
	 * @param{String}} sEvent event name
	 * @param{Object}} oData event data object
	 */
	onMasterLoaded: function(sChannel, sEvent, oData) {
		if (oData.oListItem) {
			this.bindView(oData.oListItem.getBindingContext().getPath());
			this.getView().setBusy(false);
			this.oInitialLoadFinishedDeferred.resolve();
		}
	},

	/**
	 * Detail view RoutePatternMatched event handler
	 * @param{sap.ui.base.Event} oEvent router pattern matched event object
	 */
	onRouteMatched : function(oEvent) {
		var oParameters = oEvent.getParameters();

		jQuery.when(this.oInitialLoadFinishedDeferred).then(jQuery.proxy(function () {
			var oView = this.getView();

			// when detail navigation occurs, update the binding context
			if (oParameters.name !== "_FSCM_partner_list_Detail_SVD") { 
				return;
			}

			var sEntityPath = "/" + oParameters.arguments.entity;
			this.bindView(sEntityPath);
/*
			var oIconTabBar = oView.byId("idIconTabBar");
			oIconTabBar.getItems().forEach(function(oItem) {
				oItem.bindElement(com.springer.financefscmapp.util.Formatter.uppercaseFirstChar(oItem.getKey()));
			});

			// Which tab?
			var sTabKey = oParameters.arguments.tab;
			this.getEventBus().publish("FSCM_partner_list_Detail_SVD", "TabChanged", { sTabKey : sTabKey });

			if (oIconTabBar.getSelectedKey() !== sTabKey) {
				oIconTabBar.setSelectedKey(sTabKey);
			}
*/
		}, this));
	},

	bindView : function (sEntityPath) {
		var oView = this.getView();
		oView.bindElement(sEntityPath);

		//Check if the data is already on the client
		if(!oView.getModel().getData(sEntityPath)) {
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

	},
	
	showEmptyView : function () {
		this.getRouter().myNavToWithoutHash({ 
			currentView : this.getView(),
			targetViewName : "com.springer.financefscmapp.view.HelpDialogs.NotFound",
			targetViewType : "XML"
		});
	},

	fireDetailChanged : function (sEntityPath) {
		this.getEventBus().publish("FSCM_partner_list_Detail_SVD", "Changed", { sEntityPath : sEntityPath });
	},

	fireDetailNotFound : function () {
		this.getEventBus().publish("FSCM_partner_list_Detail_SVD", "NotFound");
	},


	onAddFav: function(oEvent) {
		
		this.getView().setBusy(true);
		var addedFavorite = "";
		if( oEvent.getParameter("state") === true ) {
		    addedFavorite = "X";
		} 

		var partner = oEvent.getSource().getBindingContext().getProperty("Partner");
		partner = com.springer.financefscmapp.util.Formatter.overlayTenZero(partner);
		var that = this;
		var oModel = this.getView().getModel();
		oModel.read("OPEN_ITEM_BP_OVERVIEWSet", null, ["$filter=Partner eq '" + partner + "'"], true,
				function(oData, oResponse) {
					if (oData.results[0]) {
						if(addedFavorite) {
							oData.results[0].AddedFavorite = "X";
							sap.m.MessageToast.show("Added Favorite: " + partner );
							oModel.update("OPEN_ITEM_BP_OVERVIEWSet('" + partner + "')", oData.results[0], null, 
								function() {
									that.getView().setBusy(false); 
								},
								function(oError) {
									that.getView().setBusy(false); 
									sap.m.MessageToast.show("Update failed" + oError);
								}
							);
						} else {
							oData.results[0].AddedFavorite = "";
							sap.m.MessageToast.show("Removed Favorite: " + partner );
							that.deleteItem();
						}
					} else {
						that.getView().setBusy(false); 
						sap.m.MessageToast.show("No data received");
					}
				},
				function(oError) {
					that.getView().setBusy(false); 
					sap.m.MessageToast.show("Connection Problems " + oError);
				}
			);
	},

	onDetailSelect : function(oEvent) {
/*
		sap.ui.core.UIComponent.getRouterFor(this).navTo("_FSCM_partner_list_Detail_SVD",{
			entity : oEvent.getSource().getBindingContext().getPath().slice(1),
			tab: oEvent.getParameter("selectedKey")
		}, true);
*/
	},

	openDeleteConfirmDialog: function () {
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
		if(this.getView().getBindingContext()){ 
			var model = this.getView().getModel();
			if (model){
				this.getView().setBusy(true);
				model.remove(this.getView().getBindingContext().getPath(), {
					success: jQuery.proxy(function(oData, oResponse){
						this.getView().setBusy(false);
						this.openDialog("i18n>deleteSuccess");
						if(sap.ui.Device.system.phone) {
							this.onNavBack();
						}
					},this), 
					error: jQuery.proxy(function(){
						this.getView().setBusy(false);
						this.openDialog("i18n>deleteFailed");
					},this)
				});
			}
		}
	},

	closeDeleteConfirmDialog: function() {
		if (this._deleteConfirmDialog) {
			this._deleteConfirmDialog.close();
		}
	},
	
	deleteItem: function(){
		this.openDeleteConfirmDialog();
	},

	refreshData : function() {
		if (com.springer.financefscmapp.dev.devapp.isLoaded) {
			var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
			if (UserPreferences.onlineStatus) {
				var oEventBus = this.getEventBus();
				oEventBus.publish("OfflineStore", "Refreshing");
			} else {
				this.getView().getModel().refresh(true);
			}
		} else {
			this.getView().getModel().refresh(true);
		}
	},
	
	onNavBack : function() {
		// This is only relevant when running on phone devices
		this.getRouter().myNavBack("FSCM_partner_list_Master_SVD");
	}
});