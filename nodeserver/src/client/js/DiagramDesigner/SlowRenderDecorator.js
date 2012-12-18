"use strict";

define(['logManager',
    'clientUtil',
    'js/DiagramDesigner/DefaultDecorator'], function (logManager,
                                                         util,
                                                         DefaultDecorator) {

    var SlowRenderDecorator,
        __parent__ = DefaultDecorator,
        __parent_proto__ = DefaultDecorator.prototype;

    SlowRenderDecorator = function (options) {
        var opts = _.extend( {}, options);

        opts.loggerName = opts.loggerName || "SlowRenderDecorator";

        __parent__.apply(this, [opts]);

        this.counter = 5;
        this.timerFreq = 1000;

        this.logger.debug("SlowRenderDecorator ctor");
    };

    _.extend(SlowRenderDecorator.prototype, __parent_proto__);

    /*********************** OVERRIDE DECORATORBASE MEMBERS **************************/

    //Called right after on_addTo and before the host designer item is added to the canvas DOM
    SlowRenderDecorator.prototype.on_addTo = function () {
        var self = this;
        //find name placeholder
        this.skinParts.$name = this.$el.find(".name");
        this.skinParts.$name.text(this.counter);

        setTimeout(function () {
            self._updateProgress();
        }, this.timerFreq);
    };

    SlowRenderDecorator.prototype._updateProgress = function () {
        var self = this;

        this.counter -= 1;

        if (this.counter > 0) {
            this.skinParts.$name.text(this.counter);

            setTimeout(function () {
                self._updateProgress();
            }, this.timerFreq);
        } else {
            this.skinParts.$name.html(this.name + '<br/>Completed...');

            this.$el.css("height", "70px");

            this.hostDesignerItem.decoratorUpdated();
        }
    };

    SlowRenderDecorator.prototype.on_renderGetLayoutInfo = function () {
        //check if this guy is ready
        if (this.counter === 0) {
            //let the parent decorator class do its job first
            __parent_proto__.on_renderGetLayoutInfo.apply(this, arguments);

            this.renderLayoutInfo.nameHeight = this.skinParts.$name.outerHeight();
            this.renderLayoutInfo.boxHeight = this.$el.height();
        }
    };

    SlowRenderDecorator.prototype.on_renderSetLayoutInfo = function () {
        var shift;

        //check if this guy is ready
        if (this.counter === 0) {
            shift = (this.renderLayoutInfo.boxHeight - this.renderLayoutInfo.nameHeight) / 2;

            this.skinParts.$name.css({"margin-top": shift});


            //let the parent decorator class do its job finally
            __parent_proto__.on_renderSetLayoutInfo.apply(this, arguments);
        }
    };

    SlowRenderDecorator.prototype.update = function (objDescriptor, silent) {
        if (this.counter === 0) {
            this.hostDesignerItem.decoratorUpdated();
        }
    };

    return SlowRenderDecorator;
});