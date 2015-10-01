jQuery.sap.require("com.springer.financefscmapp.util.Formatter");
jQuery.sap.require("com.springer.financefscmapp.util.Controller");

com.springer.financefscmapp.util.Controller.extend("com.springer.financefscmapp.view.SecondLevel.BPOverviewList", {
	
	_oDialog: null,
	showTexts: false,
	filterOImodeA: new sap.ui.model.Filter("AppFilter", sap.ui.model.FilterOperator.EQ, "ONLY_OI"),
	filterOImodeB: new sap.ui.model.Filter("AppFilter", sap.ui.model.FilterOperator.EQ, "ALL"),
	filterOImodeActive: {},
	UserPreferences: {},
	_vUserIdWLmode: {},
	_vListViewChanger: {},
	_vListDrpd: {},
	activeHeaderToolbar: {},
	i18model: {},

	onInit: function() {
		this.getView().addEventDelegate({
			onAfterShow: jQuery.proxy(function(evt) {
				this.onAfterShow(evt);
			}, this)
		});
		this.oInitialLoadFinishedDeferred = jQuery.Deferred();
		this._oTable = this.getView().byId("idOIListTable");
		this._oTable.attachEventOnce("updateFinished", function() {
			this.oInitialLoadFinishedDeferred.resolve();
		}, this);
		
		this.UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		this._vUserIdWLmode = this.getView().byId("UserIdWLmode");
		this._vListViewChanger = this.getView().byId("oiListViewChanger");
		this._vListDrpd = this.getView().byId("ioListDrpd");
		this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
		if (this.UserPreferences.device === "Desktop" || this.UserPreferences.device === "undefined" || this.UserPreferences.device.indexOf("Tablet") > -1 || sap.ui.Device.orientation.landscape) {
			this.showTexts = true;
		}
	},
	waitForInitialListLoading: function(fnToExecute) {
		jQuery.when(this.oInitialLoadFinishedDeferred).then(jQuery.proxy(fnToExecute, this));
	},
	onRouteMatched: function(evt) {
		// check that the called view name is like expected
		if (evt.getParameter("name") !== "_BPOverviewList") {
			return;
		}
		
		this.i18model = this.getView().getModel("i18n").getResourceBundle();
		
		var sAggregationPath = "";
		if (this.UserPreferences.AppView === "OpenItemLive") {
			sAggregationPath = "/OPEN_ITEM_BP_OVERVIEWSet";
		} else {
			sAggregationPath = "/OPEN_ITEMS_SAVED_PER_USERSet";
		}
		this._oTable.unbindAggregation("items");
		this._oTable.bindAggregation("items",sAggregationPath,sap.ui.xmlfragment("com.springer.financefscmapp.view.HelpDialogs.OpenItemPartnerListRows", this));
		
		this.waitForInitialListLoading(function() {
			this.checkNoDataDetails();
		});
		
		this.mGroupFunctions = {
			DeliveryBlock: function(oContext) {
				var name = oContext.getProperty("DeliveryBlock");
				return {
					key: name,
					text: name
				};
			}
		};
	},
	checkNoDataDetails: function() {
		// when there are no items - check wether there is a background load running - or just no data with current filter
		var oModel = this.getView().getModel();
		var items = this._oTable.getItems();
		var that = this;
		if (items.length < 1) {
			var that = this;
			oModel.read("APP_OI_USER_LOGSet('" + this.UserPreferences.UserId + "')", null, null, true,
				function(oData, oResponse) {
					if (oData) {
						if (oData.CountSame > 0) {
							that._oTable.setNoDataText(that.i18model.getText("OINoDataFilter") + " " +  
							oData.CollSegments + " - Countries: " + oData.Countries);
						} else {
							if (sap.ui.Device.system.phone) {
								that._oTable.setNoDataText(that.i18model.getText("OIDataLodInProgress"));
							} else {
								that._oTable.setNoDataText(that.i18model.getText("OIDataLodInProgressLong"));
							}
						}
					} else {
						that._oTable.setNoDataText(that.i18model.getText("OINoDataSuccess"));
					}
					that.getView().setBusy(false); 
				},
				function(oError) {
					that._oTable.setNoDataText(that.i18model.getText("OINoServerCon"));
					that.getView().setBusy(false); 
				}
			);
		} else {
			// read first row
			var data = oModel.getProperty(items[0].getBindingContext().getPath());
			// check property of first row
			if (data['OldDataDueToCurrentLoad'] === "X") {
				sap.m.MessageToast.show(that.i18model.getText("OIDataLodInProgress"));
			}
			that.getView().setBusy(false); 
		}
	},

	onAfterShow: function() {
		// parameter which View is active
		if (this.UserPreferences.vVisibleOpenItemEnhanced === false) {
			this._vListViewChanger.setIcon("sap-icon://drill-down");
		} else {
			this._vListViewChanger.setIcon("sap-icon://drill-up");
		}
		// check text view on/off
		if (this.showTexts === true) {
			if (this.UserPreferences.vVisibleOpenItemEnhanced === false) {
				this._vListViewChanger.setText(this.i18model.getText("OIExtendView"));
			} else {
				this._vListViewChanger.setText(this.i18model.getText("OISlimView"));
			}
		} else {
			this._vListViewChanger.setText("");
			this._vUserIdWLmode.setText("");
		}
		// style class depends on view mode
		if (this.UserPreferences.vVisibleOpenItemEnhanced === false || document.body.clientWidth > 9001) {
			this._oTable.removeStyleClass("classStripColor");
			this._oTable.addStyleClass("classEvery2Color");
		} else {
			this._oTable.removeStyleClass("classEvery2Color");
			this._oTable.addStyleClass("classStripColor");
		}
		
		// at the first time view is collapsed
		if (this.UserPreferences.enteredOIListView === undefined) {
			this.UserPreferences.enteredOIListView = true;
			this.UserPreferences.vVisibleOpenItemEnhanced = false;
			this._vListViewChanger.setIcon("sap-icon://drill-down");
			if (this.showTexts === true) {
				this._vListViewChanger.setText(this.i18model.getText("OIExtendView"));
			}
			if (this.UserPreferences.vVisibleOpenItemEnhanced === false || document.body.clientWidth > 9001) {
				this._oTable.removeStyleClass("classStripColor");
				this._oTable.addStyleClass("classEvery2Color");
			} else {
				this._oTable.removeStyleClass("classEvery2Color");
				this._oTable.addStyleClass("classStripColor");
			}
		}

		// check filter item mode
		switch (this.UserPreferences.PreferedOiFilter) {
			case "ONLY_OI":
				this.filterOImodeActive = this.filterOImodeA;
				this._vUserIdWLmode.setText(this.i18model.getText("OIOnlyOpenItems"));
				this._vUserIdWLmode.setIcon("sap-icon://collections-insight");
				break;
			default:
				this.filterOImodeActive = this.filterOImodeB;
				this._vUserIdWLmode.setText(this.i18model.getText("OIAllInFilter"));
				this._vUserIdWLmode.setIcon("sap-icon://add-activity");
		}
		
	},
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
		this.getView().byId("idOIListTable").getBinding("items").filter(filters);

		this.checkNoDataDetails();
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
		this.getView().byId("idOIListTable").getBinding("items").filter(filters);
		this.getView().setBusy(false); 
	},

	handleViewSettingsDialogButtonPressed: function(oEvent) {
		if (!this._oDialog) {
			this._oDialog = sap.ui.xmlfragment("com.springer.financefscmapp.view.HelpDialogs.Dialog_OpenItems", this);
		}
		// toggle compact style
		jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
		this._oDialog.open();
	},

	handleConfirm: function(oEvent) {

		var oView = this.getView();
		var oTable = oView.byId("idOIListTable");

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
			var key = oItem.getKey();
			var oFilter;
			oFilter = new sap.ui.model.Filter(key, sap.ui.model.FilterOperator.GT, 0);
			aFilters.push(oFilter);
		});
		if (aFilters.length > 0) {
			oBinding.filter(aFilters);
		}
		// update filter bar
		oView.byId("vsdFilterBar").setVisible(aFilters.length > 0);
		oView.byId("vsdFilterLabel").setText(mParams.filterString);

	},
	onDetailView: function() {
		var bReplace = sap.ui.Device.system.phone ? false : true;
		this.getRouter().navTo("_BPOverviewMD_Master", {
			currentView: this.getView()
		}, bReplace);
	},

	handleViewChangeTop: function() {
		var vId = null;
		this.UserPreferences.vVisibleOpenItemEnhanced = true;
		var Columns = this._oTable.getColumns();
		for (var i = 0; i < Columns.length; i++) {
			vId = Columns[i].getId();
			if (vId.indexOf("idHiddenColmn") > -1) {
				if (Columns[i].getVisible() === true) {
					Columns[i].setVisible(false);
					this.UserPreferences.vVisibleOpenItemEnhanced = false;
					this._vListViewChanger.setIcon("sap-icon://drill-down");
					if (this.showTexts === true) {
						this._vListViewChanger.setText(this.i18model.getText("OIExtendView"));
					}
				} else {
					Columns[i].setVisible(true);
					this.UserPreferences.vVisibleOpenItemEnhanced = true;
					this._vListViewChanger.setIcon("sap-icon://drill-up");
					if (this.showTexts === true) {
						this._vListViewChanger.setText(this.i18model.getText("OISlimView"));
					}
				}
			}
		}
		if (this.UserPreferences.vVisibleOpenItemEnhanced === false || document.body.clientWidth > 9001) {
			this._oTable.removeStyleClass("classStripColor");
			this._oTable.addStyleClass("classEvery2Color");
		} else {
			this._oTable.removeStyleClass("classEvery2Color");
			this._oTable.addStyleClass("classStripColor");
		}

		sap.ui.getCore().setModel(this.UserPreferences, "UserPreferences");
	},

	handleChangeOImode: function() {

		this.getView().setBusy(true);
		switch (this.UserPreferences.PreferedOiFilter) {
			case "ONLY_OI":
				this.filterOImodeActive = this.filterOImodeB;
				this._vUserIdWLmode.setText(this.i18model.getText("OIAllInFilter"));
				this._vUserIdWLmode.setIcon("sap-icon://add-activity");
				this.UserPreferences.PreferedOiFilter = "ALL";
				break;
			default:
				this.filterOImodeActive = this.filterOImodeA;
				this._vUserIdWLmode.setText(this.i18model.getText("OIOnlyOpenItems"));
				this._vUserIdWLmode.setIcon("sap-icon://collections-insight");
				this.UserPreferences.PreferedOiFilter = "ONLY_OI";
		}
		this._oTable.getBinding("items").filter([this.filterOImodeActive]);
		sap.ui.getCore().setModel(this.UserPreferences, "UserPreferences");
		
		var that = this;
        var oModel = this.getView().getModel();
		oModel.read("APP_USER_PREFERENCESSet('EXTERN')", null, null, true,
			function(oData, oResponse) {
                oData.PreferedOiFilter = that.UserPreferences.PreferedOiFilter;
				oModel.update("APP_USER_PREFERENCESSet('EXTERN')", oData, null, null, null);
				that.getView().setBusy(false);
			},
			function(oError) {
				that.getView().setBusy(false);
			}
		);
	},

	onNavBack: function() {
		var bReplace = sap.ui.Device.system.phone ? false : true;
		this.getRouter().navTo("_A2_Welcome", {
			currentView: this.getView()
		}, bReplace);
	},
	
	onAddFav: function(oEvent) {
		
		this.getView().setBusy(true);
		var addedFavorite = "";
		if( oEvent.getParameter("state") === true ) {
		    addedFavorite = "X";
		} 

		var partner = oEvent.getSource().getBindingContext().getProperty("Partner");
		partner = com.springer.financefscmapp.util.Formatter.overlayTenZero(partner);
		this.UserPreferences.partner = partner;
		var that = this;
		var oModel = this.getView().getModel();

		if (this.UserPreferences.AppView === "OpenItemLive") {
			oModel.read("OPEN_ITEM_BP_OVERVIEWSet", null, ["$filter=Partner eq '" + partner + "'"], true,
				function(oData, oResponse) {
					if (oData.results[0]) {
						if(addedFavorite) {
							oData.results[0].AddedFavorite = "X";
							sap.m.MessageToast.show(that.i18model.getText("OIAddedFav") + " " +  partner );
						} else {
							oData.results[0].AddedFavorite = "";
							sap.m.MessageToast.show(that.i18model.getText("OIRemovedFav") + " " +  partner );
						}
						oModel.update("OPEN_ITEM_BP_OVERVIEWSet('" + partner + "')", oData.results[0], null, 
							function() {
								that.getView().setBusy(false); 
							},
							function(oError) {
								that.getView().setBusy(false); 
								sap.m.MessageToast.show(that.i18model.getText("OIUpdatFavFail") + " " +  oError);
							}
						);
					} else {
						that.getView().setBusy(false); 
						sap.m.MessageToast.show(that.i18model.getText("OIFavNoData"));
					}
				},
				function(oError) {
					that.getView().setBusy(false); 
					sap.m.MessageToast.show(that.i18model.getText("ConnectionProb") + " " +  oError);
				}
			);
		} else {
			oModel.read("OPEN_ITEMS_SAVED_PER_USERSet", null, ["$filter=Partner eq '" + partner + "'"], true,
				function(oData, oResponse) {
					if (oData.results[0]) {
						if(addedFavorite) {
							oData.results[0].AddedFavorite = "X";
							sap.m.MessageToast.show(that.i18model.getText("OIAddedFav") + " " +  partner );
							oModel.update("OPEN_ITEMS_SAVED_PER_USERSet(UserId='" + that.UserPreferences.UserId + "',Partner='" + partner + "')", oData.results[0], null, 
								function() {
									that.getView().setBusy(false); 
								},
								function(oError) {
									that.getView().setBusy(false); 
									sap.m.MessageToast.show(that.i18model.getText("OIUpdatFavFail") + " " +  oError);
								}
							);
						} else {
							that.getView().setBusy(false); 
							oData.results[0].AddedFavorite = "";
							sap.m.MessageToast.show(that.i18model.getText("OIRemovedFav") + " " +  partner );
							that.deleteItem();
						}
					} else {
						that.getView().setBusy(false); 
						sap.m.MessageToast.show(that.i18model.getText("OIFavNoData"));
					}
				},
				function(oError) {
					that.getView().setBusy(false); 
					sap.m.MessageToast.show(that.i18model.getText("ConnectionProb") + " " +  oError);
				}
			);
		}
	},
	
	// Take care of the navigation through the hierarchy when the user selects a table row
	handleSelectionChange: function(oEvent) {

		this.getView().setBusy(true);
		var oItem = oEvent.getSource();

		var contextModel = {};
		contextModel = sap.ui.getCore().getModel("ContextModel");
		if (typeof contextModel === "undefined") {
			contextModel = new sap.ui.model.json.JSONModel();
		}
		contextModel.partner = oItem.getBindingContext().getProperty("Partner");
		if (this.UserPreferences.PreferedOiFilter === "ONLY_OI") {
			contextModel.onlyOI  = true;
		} else {
			contextModel.onlyOI  = false;
		}
		sap.ui.getCore().setModel(contextModel, "ContextModel");
		
		var bReplace = sap.ui.Device.system.phone ? false : true;
		this.getRouter().navTo("_BPInvoiceList", {
			from: "_BPOverviewList",
			entity: oItem.getBindingContext().getPath().substr(1)
		}, bReplace);
	},
	
	refreshData : function() {
		var model = this.getView().getModel();
		if (this.UserPreferences.AppView === "OpenItemLive") {
	        model.refresh(true);
		} else {
			if (devapp.isLoaded) {
				var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
				if (UserPreferences.onlineStatus) {
					var oEventBus = this.getEventBus();
					oEventBus.publish("OfflineStore", "Refreshing");
				} else {
					//var filters = [];
					//this.getView().byId("idOIListTable").getBinding("items").filter(filters);
	        		model.refresh(true);
				}
			} else {
				//var filters = [];
				//this.getView().byId("idOIListTable").getBinding("items").filter(filters);
	        	model.refresh(true);
			}
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
		if (this._dialog) {
			this._dialog.close();
		}
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
		if(this.UserPreferences.partner !== ""){ 
			var delPath = "/OPEN_ITEMS_SAVED_PER_USERSet(UserId='" + this.UserPreferences.UserId + "',Partner='" + this.UserPreferences.partner + "')"
			var model = this.getView().getModel();
			if (model){
				this.getView().setBusy(true);
				model.remove(delPath, {
					success: jQuery.proxy(function(oData, oResponse){
						this.getView().setBusy(false);
						this.openDialog("i18n>deleteSuccess");
						//this.onNavBack();
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
	}
});
