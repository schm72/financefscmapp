jQuery.sap.declare("com.springer.financefscmapp.util.Controller");

sap.ui.core.mvc.Controller.extend("com.springer.financefscmapp.util.Controller", {
	/**
	 * get the event bus of the applciation component
	 * @returns {Object} the event bus
	 */
	getEventBus: function() {
		return sap.ui.getCore().getEventBus();
	},

	/**
	 * get the UIComponent router
	 * @param{Object} this either a view or controller
	 * @returns {Object} the event bus
	 */
	getRouter: function() {
		return sap.ui.core.UIComponent.getRouterFor(this);
	},
	
	addRemoveFavorite: function(addedFavorite,oModel,oDataPath,partner,that) {
		oModel.read(oDataPath, null, null, true,
			function(oData) {
				if (oData) {
					if(addedFavorite) {
						oData.AddedFavorite = "X";
						sap.m.MessageToast.show(that.i18model.getText("OIAddedFav") + " " +  partner );
					} else {
						oData.AddedFavorite = "";
						sap.m.MessageToast.show(that.i18model.getText("OIRemovedFav") + " " +  partner );
					}
					oModel.update(oDataPath, oData, null, 
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
	}
	
});
