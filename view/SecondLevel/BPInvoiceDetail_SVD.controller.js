jQuery.sap.require("com.springer.springerfscmapp.util.Formatter");
jQuery.sap.require("com.springer.springerfscmapp.util.Controller");

com.springer.springerfscmapp.util.Controller.extend("com.springer.springerfscmapp.view.SecondLevel.BPInvoiceDetail_SVD", {
	
	sEntityPath:null,
	
	/**
	 * Called when the detail list controller is instantiated.
	 */
	onInit : function() { 
		this.getView().addEventDelegate({
			onAfterShow: jQuery.proxy(function(evt) {
				this.onAfterShow(evt);
			}, this)
		});
		this.getRouter().attachRoutePatternMatched(this.onRouteMatched, this);
	},

	onRouteMatched : function(oEvent) {
		var oParameters = oEvent.getParameters();

		// when detail navigation occurs, update the binding context
		if (oParameters.name !== "_BPInvoiceDetail_SVD") { 
			return;
		}
		
		this.sEntityPath = "/" + oParameters.arguments.entity;

		var oView = this.getView();
		oView.bindElement(this.sEntityPath);

		//Check if the data is already on the client
		if(!oView.getModel().getData(this.sEntityPath)) {
			// Check that the entity specified actually was found.
			oView.getElementBinding().attachEventOnce("dataReceived", jQuery.proxy(function() {
				var oData = oView.getModel().getData(this.sEntityPath);
				if (!oData) {
					this.showEmptyView();
				}
			}, this));
		}
		
		// activate first tab
		var idIconTabBar = this.getView().byId("idIconTabBar");
		if( idIconTabBar.getSelectedKey() !== "Details" ) {
			idIconTabBar.setSelectedKey("Details");
		}
	},

	onAfterShow: function() {
		var openItemINV = this.getView().byId("openItemINV");
		var contextModel = sap.ui.getCore().getModel("ContextModel");
		if (contextModel.isOpen) {
			openItemINV.removeStyleClass("classGreenicon");
			openItemINV.addStyleClass("classRedIcon");
		} else {
			openItemINV.removeStyleClass("classRedIcon");
			openItemINV.addStyleClass("classGreenicon");
		}
		
		// only show details for Dispute case, when they are available
		if (contextModel.disputeCase === "") {
            this.getView().byId("DisV1").setVisible(false);
            this.getView().byId("DisV2").setVisible(false);
            this.getView().byId("DisV3").setVisible(false);
            this.getView().byId("DisV4").setVisible(false);
		} else {
            this.getView().byId("DisV1").setVisible(true);
            this.getView().byId("DisV2").setVisible(true);
            this.getView().byId("DisV3").setVisible(true);
            this.getView().byId("DisV4").setVisible(true);
		}
		
		
		// only show details for Promise 2 pay, when they are available
		if (contextModel.FinPromisedAmt > 0) {
            this.getView().byId("PspV1").setVisible(true);
            this.getView().byId("PspV2").setVisible(true);
            this.getView().byId("PspV3").setVisible(true);
            this.getView().byId("PspV4").setVisible(true);
            this.getView().byId("PspV5").setVisible(true);
            this.getView().byId("PspV6").setVisible(true);
            this.getView().byId("PspV7").setVisible(true);
            this.getView().byId("PspV8").setVisible(true);
            this.getView().byId("PspV9").setVisible(true);
            this.getView().byId("PspV10").setVisible(true);
		} else {
            this.getView().byId("PspV1").setVisible(false);
            this.getView().byId("PspV2").setVisible(false);
            this.getView().byId("PspV3").setVisible(false);
            this.getView().byId("PspV4").setVisible(false);
            this.getView().byId("PspV5").setVisible(false);
            this.getView().byId("PspV6").setVisible(false);
            this.getView().byId("PspV7").setVisible(false);
            this.getView().byId("PspV8").setVisible(false);
            this.getView().byId("PspV9").setVisible(false);
            this.getView().byId("PspV10").setVisible(false);
		}
		
		this.getView().setBusy(false); 
	},
	
	onDetailSelect: function (oEvent) {
		
		//var idIconTabBar = this.getView().byId("idIconTabBar");
		
        var key = oEvent.getParameters().key;
        switch (key) {
			case "Details":
				//sap.m.MessageToast.show("Info");
				break;
			case "Attached":
				var sAggregationPath = this.sEntityPath + "/ATTACHMENT_INFO_LIST_SVDSet";
		        var oTable = this.getView().byId("attachmentList");
				oTable.bindAggregation("items",sAggregationPath,sap.ui.xmlfragment("com.springer.springerfscmapp.view.HelpDialogs.DetailInvoiceAttach", this));

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
	
	showEmptyView : function () {
		this.getRouter().myNavToWithoutHash({ 
			currentView : this.getView(),
			targetViewName : "com.springer.springerfscmapp.view.HelpDialogs.NotFound",
			targetViewType : "XML"
		});
	},

	handleSelectionChange: function(evt) {
		this.getView().setBusy(true);
		var html = new sap.ui.core.HTML();
		var oModel = this.getView().getModel();

		var oItem = evt.getSource();
		var ArcDocId = oItem.getBindingContext().getProperty("ArcDocId");
		var Reserve = oItem.getBindingContext().getProperty("Reserve");
		var ArchivId = oItem.getBindingContext().getProperty("ArchivId");

		//Example URL: http://senldogomqs.springer-sbm.com:8003/sap/opu/odata/SBMC/MOBILE_FIFS_SRV/ATTACHMENT_BINARYSet(ArchivId='M2',Reserve='PDF',ArcDocId='005056B032E51EE597F6CD776EEA1C8E')/$value
		var that = this;
		oModel.read("ATTACHMENT_BINARYSet(ArchivId='" + ArchivId + "',Reserve='" + Reserve + "',ArcDocId='" + ArcDocId + "')/$value", null, null,
			true,
			function(oData, oResponse) {
				var docType = oResponse.headers["Content-Type"];
				var docURL = oResponse.requestUri;
				//if (docType === "application/pdf" || docType === "image/jpeg") {
				html.setContent("<iframe src=" + docURL + " type='" + docType + "' width='700' height='700'></iframe>");
				//} else {
				//	html.setContent("<embed src='" + docURL + "' title='document' width='1000px' height='1000px'></embed>");
				//}
				html.placeAt("content");
				that.getView().setBusy(false);
			}, function() {
				console.log("Read failed");
				that.getView().setBusy(false);
			}
		);
	},
	
	onNavBack : function() {
		var contextModel = sap.ui.getCore().getModel("ContextModel");
		this.getView().setBusy(true); 
		var bReplace = jQuery.device.is.phone ? false : true;
		this.getRouter().navTo("_BPInvoiceList_SVD", {
			currentView: this.getView(),
			entity: contextModel.backentity
		}, bReplace);
	}

});