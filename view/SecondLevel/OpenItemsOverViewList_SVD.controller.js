jQuery.sap.require("com.springer.springerfscmapp.util.Formatter");
jQuery.sap.require("com.springer.springerfscmapp.util.Controller");

com.springer.springerfscmapp.util.Controller.extend("com.springer.springerfscmapp.view.SecondLevel.OpenItemsOverViewList_SVD", {
	_oDialog: null,
	showTexts: false,
	//documentView: false,
	filterOImodeA: new sap.ui.model.Filter("AppFilter", sap.ui.model.FilterOperator.EQ, "ONLY_OI"),
	filterOImodeB: new sap.ui.model.Filter("AppFilter", sap.ui.model.FilterOperator.EQ, "ALL"),
	filterOImodeActive: {},
	_UserPreferences: {},
	_vUserIdWLmode: {},
	_vListViewChanger: {},
	_vListDrpd: {},
	activeHeaderToolbar: {},

	onInit: function() {
		this.getView().addEventDelegate({
			onAfterShow: jQuery.proxy(function(evt) {
				this.onAfterShow(evt);
			}, this)
		});
		this._oTable = this.getView().byId("idOIListTable");
		this._UserPreferences = sap.ui.getCore().getModel("UserPreferences");
		this._vUserIdWLmode = this.getView().byId("UserIdWLmode");
		this._vListViewChanger = this.getView().byId("oiListViewChanger");
		this._vListDrpd = this.getView().byId("ioListDrpd");
		this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
		if (this._UserPreferences.device === "Desktop" || this._UserPreferences.device === "undefined" || this._UserPreferences.device.indexOf("Tablet") > -1) {
			this.showTexts = true;
		}
	},
	onRouteMatched: function(evt) {
		// check that the called view name is like expected
		if (evt.getParameter("name") !== "_OpenItemsOverViewList_SVD") {
			return;
		}

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

	onAfterShow: function() {
		this.getView().setBusy(false); 
		// parameter which View is active
		if (this._UserPreferences._vVisible_oi_SVD === false) {
			this._vListViewChanger.setIcon("sap-icon://drill-down");
		} else {
			this._vListViewChanger.setIcon("sap-icon://drill-up");
		}
		// check text view on/off
		if (this.showTexts === true) {
			if (this._UserPreferences._vVisible_oi === false) {
				this._vListViewChanger.setText("Extend View");
			} else {
				this._vListViewChanger.setText("Slim View");
			}
		} else {
			this._vListViewChanger.setText("");
			this._vUserIdWLmode.setText("");
		}
		// style class depends on view mode
		if (this._UserPreferences._vVisible_oi_SVD === false || document.body.clientWidth > 9001) {
			this._oTable.removeStyleClass("classStripColor");
			this._oTable.addStyleClass("classEvery2Color");
		} else {
			this._oTable.removeStyleClass("classEvery2Color");
			this._oTable.addStyleClass("classStripColor");
		}
		// at the first time collapse view
		if (this._UserPreferences.enteredOIListView_SVD == undefined) {
			this._UserPreferences.enteredOIListView_SVD = true;
			this.handleViewChangeTop();
		}
		
		// check filter item mode
		switch (this._UserPreferences.PreferedOiFilter) {
			case "ONLY_OI":
				this.filterOImodeActive = this.filterOImodeA;
				this._vUserIdWLmode.setText("Only Open Items");
				this._vUserIdWLmode.setIcon("sap-icon://collections-insight");
				break;
			default:
				this.filterOImodeActive = this.filterOImodeB;
				this._vUserIdWLmode.setText("All in Filter");
				this._vUserIdWLmode.setIcon("sap-icon://add-activity");
		}

		this.checkNoDataDetails();
	},
	checkNoDataDetails: function() {
		// when there are no items - check wether there is a background load running - or just no data with current filter
		var oModel = this.getView().getModel();
		var that = this;
		var items = this.getView().byId("idOIListTable").getItems();
		if (items.length < 1) {
			var that = this;
			oModel.read("APP_OI_USER_LOGSet", null, null, true,
				function(oData, oResponse) {
					if (oData.results[0]) {
						if (oData.results[0].CountSame > 0) {
							that._oTable.setNoDataText("No data for current filter - Coll Segment: " + oData.results[0].CollSegments + " - Countries: " + oData
								.results[0].Countries);
						} else {
							if (sap.ui.Device.system.phone) {
								that._oTable.setNoDataText("Data load in progress");
							} else {
								that._oTable.setNoDataText("Data load in progress asynchronous - please try again later");
							}
						}
					} else {
						that._oTable.setNoDataText("No loading entry - please try again");
					}
					that.getView().setBusy(false); 
				},
				function(oError) {
					that._oTable.setNoDataText("No Server Connection");
					that.getView().setBusy(false); 
				}
			);
		} else {
			// when table tdata available - check if data up to data
			that.getView().setBusy(false); 
			var data = oModel.getProperty(items[0].getBindingContext().getPath());
			if (data['OldDataDueToCurrentLoad'] === "X") {
				sap.m.MessageToast.show("New data load in progress\nShown data is outdated");
			}
		}
	},
	onItemSearch1: function() {
		// add filter for search
		this.getView().setBusy(true); 
		var filters = [];
		var searchString = this.getView().byId("OpenItemSearchText1").getValue();
		if (searchString && searchString.length > 0) {
			var filter1 = new sap.ui.model.Filter("Partner", sap.ui.model.FilterOperator.EQ, searchString);
			//var filter2 = new sap.ui.model.Filter("PartnerDesc", sap.ui.model.FilterOperator.Contains, searchString);
			filters = [filter1];
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

	onExit: function() {
		if (this._oDialog) {
			this._oDialog.destroy();
		}
	},

	handleViewSettingsDialogButtonPressed: function(oEvent) {
		if (!this._oDialog) {
			this._oDialog = sap.ui.xmlfragment("com.springer.springerfscmapp.view.HelpDialogs.Dialog_OpenItems", this);
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
		var bReplace = jQuery.device.is.phone ? false : true;
		this.getRouter().navTo("_OI_Saved_Master", {
			currentView: this.getView()
		}, bReplace);
	},

	handleViewChangeTop: function() {
		var vId = null;
		this._UserPreferences._vVisible_oi_SVD = true;
		var Columns = this._oTable.getColumns();
		for (var i = 0; i < Columns.length; i++) {
			vId = Columns[i].getId();
			if (vId.indexOf("idHiddenColmn") > -1) {
				if (Columns[i].getVisible() === true) {
					Columns[i].setVisible(false);
					this._UserPreferences._vVisible_oi_SVD = false;
					this._vListViewChanger.setIcon("sap-icon://drill-down");
					if (this.showTexts === true) {
						this._vListViewChanger.setText("Extend View");
					}
				} else {
					Columns[i].setVisible(true);
					this._UserPreferences._vVisible_oi_SVD = true;
					this._vListViewChanger.setIcon("sap-icon://drill-up");
					if (this.showTexts === true) {
						this._vListViewChanger.setText("Slim View");
					}
				}
			}
		}
		if (this._UserPreferences._vVisible_oi_SVD === false || document.body.clientWidth > 9001) {
			this._oTable.removeStyleClass("classStripColor");
			this._oTable.addStyleClass("classEvery2Color");
		} else {
			this._oTable.removeStyleClass("classEvery2Color");
			this._oTable.addStyleClass("classStripColor");
		}
		sap.ui.getCore().setModel(this._UserPreferences, "UserPreferences");
	},

	handleChangeOImode: function() {

		this.getView().setBusy(true);
		switch (this._UserPreferences.PreferedOiFilter) {
			case "ONLY_OI":
				this.filterOImodeActive = this.filterOImodeB;
				this._vUserIdWLmode.setText("All in Filter");
				this._vUserIdWLmode.setIcon("sap-icon://add-activity");
				this._UserPreferences.PreferedOiFilter = "ALL";
				break;
			default:
				this.filterOImodeActive = this.filterOImodeA;
				this._vUserIdWLmode.setText("With Open Items");
				this._vUserIdWLmode.setIcon("sap-icon://collections-insight");
				this._UserPreferences.PreferedOiFilter = "ONLY_OI";
		}
		this._oTable.getBinding("items").filter([this.filterOImodeActive]);
		sap.ui.getCore().setModel(this._UserPreferences, "UserPreferences");
		
		var that = this;
        var oModel = this.getView().getModel();
		oModel.read("APP_USER_PREFERENCESSet('EXTERN')", null, null, true,
			function(oData, oResponse) {
                oData.PreferedOiFilter = that._UserPreferences.PreferedOiFilter;
				oModel.update("APP_USER_PREFERENCESSet('EXTERN')", oData, null, null, null);
				that.getView().setBusy(false);
			},
			function(oError) {
				that.getView().setBusy(false);
			}
		);
	},

	onNavBack: function() {
		var bReplace = jQuery.device.is.phone ? false : true;
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
		partner = com.springer.springerfscmapp.util.Formatter.overlayTenZero(partner);
		var that = this;
		var oModel = this.getView().getModel();
		oModel.read("OPEN_ITEMS_SAVED_PER_USERSet", null, ["$filter=Partner eq '" + partner + "'"], true,
				function(oData, oResponse) {
					if (oData.results[0]) {
						if(addedFavorite) {
							oData.results[0].AddedFavorite = "X";
							sap.m.MessageToast.show("Added Favorite: " + partner );
						} else {
							oData.results[0].AddedFavorite = "";
							sap.m.MessageToast.show("Removed Favorite: " + partner );
						}
						oModel.update("OPEN_ITEMS_SAVED_PER_USERSet(Partner='" + partner + "',UserId='EXTERN')", oData.results[0], null, 
							function() {
								that.getView().setBusy(false); 
							},
							function(oError) {
								that.getView().setBusy(false); 
								sap.m.MessageToast.show("Update failed" + oError);
							}
						);
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
		if (this._UserPreferences.PreferedOiFilter === "ONLY_OI") {
			contextModel.onlyOI  = true;
		} else {
			contextModel.onlyOI  = false;
		}
		sap.ui.getCore().setModel(contextModel, "ContextModel");

		var bReplace = jQuery.device.is.phone ? false : true;
		this.getRouter().navTo("_BPInvoiceList_SVD", {
			from: "_OpenItemsOverViewList_SVD",
			entity: oItem.getBindingContext().getPath().substr(1)
		}, bReplace);
	},
	
	refreshData : function() {
		var model = this.getView().getModel();
		if (devapp.isLoaded) {
			var UserPreferences = sap.ui.getCore().getModel("UserPreferences");
			if (UserPreferences.onlineStatus) {
				var oEventBus = this.getEventBus();
				oEventBus.publish("OfflineStore", "Refreshing");
			} else {
				var filters = [];
				this.getView().byId("idOIListTable").getBinding("items").filter(filters);
			}
		} else {
			var filters = [];
			this.getView().byId("idOIListTable").getBinding("items").filter(filters);
		}
	}

});