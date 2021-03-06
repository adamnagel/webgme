/*
 * Copyright (C) 2013 Vanderbilt University, All rights reserved.
 *
 * Author: Robert Kereskenyi
 */

"use strict";

define(['js/DragDrop/DragSource',
    'js/DragDrop/DragHelper',
    './DiagramDesignerWidget.Constants'], function (dragSource,
                                                    dragHelper,
                                                    DiagramDesignerWidgetConstants) {

    var DiagramDesignerWidgetDraggable,
        DRAG_HELPER_CLASS = 'diagram-designer-drag-outline';

    DiagramDesignerWidgetDraggable = function () {
    };


    DiagramDesignerWidgetDraggable.prototype._makeDraggable = function (item) {
        var self = this;

        dragSource.makeDraggable(item.$el, {
            'helper': function (event, dragInfo) {
                return self._dragHelper(this, event, dragInfo);
            },
            'dragItems': function (el) {
                return self.getDragItems(self.selectionManager.getSelectedElements());
            },
            'dragEffects': function (el, event) {
                return self.getDragEffects(self.selectionManager.getSelectedElements(), event);
            },
            'dragParams': function (el, event) {
                return self.getDragParams(self.selectionManager.getSelectedElements(), event);
            },
            'start': function (event) {
                var ret = false;
                //enable drag mode only in
                //- DESIGN MODE
                //- if the mousedown is not on a connection drawing start point
                if (self.mode === self.OPERATING_MODES.DESIGN &&
                    !$(event.originalEvent.target).hasClass(DiagramDesignerWidgetConstants.CONNECTOR_CLASS)) {
                    ret = true;
                }
                return ret;
            }
        });
    };

    DiagramDesignerWidgetDraggable.prototype._destroyDraggable = function (item) {
        dragSource.destroyDraggable(item.$el);
    };

    /* OVERWRITE DragSource.prototype.dragHelper */
    DiagramDesignerWidgetDraggable.prototype._dragHelper = function (el, event, dragInfo) {
        var helperEl = $('<div/>', {'class': DRAG_HELPER_CLASS}),
            selectionBBox = this.selectionManager._getSelectionBoundingBox(),
            mousePos = this.getAdjustedMousePos(event),
            dragEffects = dragHelper.getDragEffects(dragInfo);

        this.logger.debug("_dragHelper's dragInfo: " + JSON.stringify(dragInfo));

        if (selectionBBox) {
            helperEl.css({'width': (selectionBBox.x2 - selectionBBox.x) * this._zoomRatio,
                'height': (selectionBBox.y2 - selectionBBox.y) * this._zoomRatio,
                'line-height': ((selectionBBox.y2 - selectionBBox.y) * this._zoomRatio) + "px",
                'text-align': 'center',
                'border': '2px dashed #666',
                'background-color': 'rgba(100, 100, 100, 0.1)',
                'margin-top': (selectionBBox.y - mousePos.mY + dragSource.DEFAULT_CURSOR_AT.top) * this._zoomRatio,
                'margin-left': (selectionBBox.x - mousePos.mX + dragSource.DEFAULT_CURSOR_AT.left) * this._zoomRatio});

            if (dragEffects.length === 1) {
                if (dragEffects[0] === dragSource.DRAG_EFFECTS.DRAG_MOVE) {
                    helperEl.append($('<i class="icon-move"></i>')).append(' Move...');
                } else if (dragEffects[0] === dragSource.DRAG_EFFECTS.DRAG_COPY) {
                    helperEl.append($('<i class="icon-plus"></i>')).append(' Copy...');
                }
            }
        }

        return helperEl;
    };


    DiagramDesignerWidgetDraggable.prototype.getDragItems = function (selectedElements) {
        this.logger.warning("DiagramDesignerWidgetDraggable.getDragItems is not overridden in the controller!!! selectedElements: " + selectedElements);
        return [];
    };

    DiagramDesignerWidgetDraggable.prototype.getDragEffects = function (selectedElements, event) {
        var ctrlKey = event.ctrlKey || event.metaKey,
            effects = [dragSource.DRAG_EFFECTS.DRAG_MOVE];

        //by default the drag is a MOVE

        //CTRL key --> copy
        if (ctrlKey) {
            effects = [dragSource.DRAG_EFFECTS.DRAG_COPY];
        }

        return effects;
    };

    DiagramDesignerWidgetDraggable.prototype.getDragParams = function (selectedElements, event) {
        var params = { 'positions': {}},
            i = selectedElements.length,
            itemID,
            selectionBBox = this.selectionManager._getSelectionBoundingBox(),
            mousePos = this.getAdjustedMousePos(event);

        while (i--) {
            itemID = selectedElements[i];
            if (this.itemIds.indexOf(itemID) !== -1) {
                params.positions[itemID] = {'x': this.items[itemID].positionX - mousePos.mX,
                                     'y': this.items[itemID].positionY - mousePos.mY};
            }
        }

        return params;
    };

    DiagramDesignerWidgetDraggable.prototype.DRAG_EFFECTS = dragSource.DRAG_EFFECTS;



    return DiagramDesignerWidgetDraggable;
});
