(function ($) {

    $.widget('rf.orderingList', {

        options: {
            disabled: false,
            header: '',
            showButtons: true,
            mouseOrderable: true,
            widgetEventPrefix: 'orderingList_',
            dropOnEmpty: true
        },

        _create: function() {
            var self = this;
            this.selectableOptions = {
                disabled: self.options.disabled
            };
            this.sortableOptions = { handle: ".handle",
                disabled: this.options.disabled,
                dropOnEmpty: this.options.dropOnEmpty,
                start: function(event, ui) {
                    $(self.element).find(".ui-selected").removeClass('ui-selected');
                    $(ui.item).addClass('ui-selected');
                },
                stop: function(event, ui) {
                    var ui = self._dumpState();
                    ui.movement = 'drag';
                    self._trigger("change", event, ui);
                    }
                };
            if (this.element.is("table")) {
                this.strategy = "table";
                this.$pluginRoot = $( this.element).find("tbody");
                this.selectableOptions.filter = "tr";
                this.sortableOptions.placeholder = "placeholder";
                this.sortableOptions.helper = $.proxy(this._rowHelper, this);
            } else {
                this.strategy = "list";
                this.$pluginRoot = $( this.element);
                this.selectableOptions.filter = "li";
            }
            this._addDomElements();
            this.widgetEventPrefix = this.options.widgetEventPrefix;
            if (this.options.mouseOrderable === true) {
                this.$pluginRoot.sortable(this.sortableOptions);
            }
            this.$pluginRoot.selectable(this.selectableOptions);
            if (this.options.disabled === true) {
                self._disable();
            }
        },

        destroy: function() {
            $.Widget.prototype.destroy.call( this );
            this._removeDomElements();
            this.$pluginRoot
                .sortable("destroy")
                .selectable("destroy");
            return this;
        },

        _rowHelper: function(e, tr) {
            var $helper = tr.clone();
            $helper.addClass("ui-selected rowhelper");
            // we lose the cell width in the clone, so we re-set it here:
            $helper.css('width', tr.css('width'));
            $helper.children().each(function (index) {
                var original_cell = tr.children().get(index);
                var original_width = $(original_cell).css('width');
                $(this).css('width', original_width);
            });
            return $helper;
        },

        _setOption: function(key, value) {
            var self = this;
            if (this.options.key === value) {
                return;
            }
            switch (key) {
                case "disabled":
                    if (value === true) {
                        self._disable();
                    } else {
                        self._enable();
                    }
                    break;
            }
            $.Widget.prototype._setOption.apply(self, arguments);
        },

        /** Public API methods **/

        isSelected: function (item) {
            return $(item).hasClass('ui-selected');
        },

        selectItem: function (item) {
            $(item).addClass('ui-selected');
        },

        unSelectItem: function (item) {
            $(item).removeClass('ui-selected');
        },

        unSelectAll: function() {
            var self = this;
            this._removeDomElements();
            this.element.children().each(function() {
                self.unSelectItem(this);
            });
        },

        moveTop: function (items, event) {
            if (this.options.disabled) return;
            var first = items.prevAll().not('.ui-selected').last();
            $(items).insertBefore(first);
            var ui = this._dumpState();
            ui.movement = 'moveTop';
            this._trigger("change", event, ui);
        },

        moveUp: function (items, event) {
            if (this.options.disabled) return;
            $(items).each( function () {
                var $item = $(this);
                var prev = $item.prevAll().not('.ui-selected').first();
                if (prev.length > 0) {
                    $item.insertBefore(prev);
                }
            });
            var ui = this._dumpState();
            ui.movement = 'moveUp';
            this._trigger("change", event, ui);
        },

        moveDown: function (items, event) {
            if (this.options.disabled) return;
            $(items).sort(function() {return 1}).each( function () {
                var $item = $(this);
                var next = $item.nextAll().not('.ui-selected').first();
                if (next.length > 0) {
                    $item.insertAfter(next);
                }
            });
            var ui = this._dumpState();
            ui.movement = 'moveDown';
            this._trigger("change", event, ui);
        },

        moveLast: function (items, event) {
            if (this.options.disabled) return;
            var last = items.nextAll().not('.ui-selected').last();
            $(items).insertAfter(last);
            var ui = this._dumpState();
            ui.movement = 'moveLast';
            this._trigger("change", event, ui);
        },

        getOrderedElements: function () {
            return this.element.find('.ui-selectee');
        },

        getOrderedKeys: function () {
            var keys = new Array();
            this.getOrderedElements().each( function() {
                var $this = $(this);
                var data_key = $this.data('key');
                var key = (data_key) ? data_key : $this.text();
                keys.push(key);
            })
            return keys;
        },

        /** Initialisation methods **/

        _addDomElements: function() {
            this._addParents();
            this._addMouseHandles();
            if (this.options.showButtons === true) {
                this._addButtons();
            }
            if (this.strategy === 'table') { // round the table row corners
                $( this.element )
                    .find( "tr").each(function() {
                        $(this).children().last().addClass('last');
                        $(this).children().first().addClass('first');
                    })
            }
        },

        _addButtons: function() {
            var button = $("<button/>")
                .attr('type', 'button')
                .addClass("btn")
            var buttonStack = $("<div/>")
                .addClass("btn-group-vertical");
            buttonStack
                .append(
                button.clone()
                    .addClass('first')
                    .html("<i class='icon-arrow-up'></i>")
                    .bind('click.orderingList', $.proxy(this._topHandler, this))
            )
                .append(
                button.clone()
                    .addClass('up')
                    .html("<i class='icon-arrow-up'></i>")
                    .bind('click.orderingList', $.proxy(this._upHandler, this))
            )
                .append(
                button.clone()
                    .addClass('down')
                    .html("<i class='icon-arrow-down'></i>")
                    .bind('click.orderingList', $.proxy(this._downHandler, this))
            )
                .append(
                button
                    .clone()
                    .addClass('last')
                    .html("<i class='icon-arrow-down'></i>")
                    .bind('click.orderingList', $.proxy(this._lastHandler, this))
            );
            this.content.append(
                $('<div />').addClass('buttonColumn').append(buttonStack));
        },

        _addMouseHandles: function () {
            if (this.options.mouseOrderable === true) {
                this.content.addClass('with-handle');
                if (this.strategy === 'table') {
                    $( this.element )
                        .find( "tbody > tr" )
                        .prepend( "<th class='handleRow'><div class='handle'><i class='icon-move'></i></div></th>");
                    $( this.element )
                        .find("thead > tr")
                        .prepend( "<th class='handleRow'></th>");
                } else if (this.strategy === 'list') {
                    $( this.element )
                        .find( "li" )
                        .prepend( "<div class='handle'><i class='icon-move'></i></div>" );
                }
            }
        },

        _addParents: function() {
            this.element.wrap(
                $("<div />").addClass('orderingList outer').append(
                    $('<div />').addClass('content').append(
                        $('<div />').addClass('list')
                    )
                )
            );
            this.outer = this.element.parents(".outer").first();
            this.outer.prepend(
                $("<div />").addClass('header').append(
                    $("<h3/>").html(this.options.header)
                )
            );
            this.content = this.outer.find(".content");
        },

        _disable: function() {
            this.$pluginRoot
                .sortable("option", "disabled", true)
                .selectable("option", "disabled", true);
            this.element
                .addClass('disabled')
                .find(".ui-selected").removeClass('ui-selected');
            $('.buttonColumn', this.content).find("button").attr("disabled", true);
        },

        _enable: function() {
            this.$pluginRoot
                .sortable("option", "disabled", false)
                .selectable("option", "disabled", false);
            this.element.removeClass('disabled');
            $('.buttonColumn', this.content).find("button").attr("disabled", false);
        },

        _dumpState: function() {
            var ui = {};
            ui.orderedElements = this.getOrderedElements();
            ui.orderedKeys = this.getOrderedKeys();
            return ui;
        },

        /** Cleanup methods **/

        _removeDomElements: function() {
            // TODO: impl
            var list = this.element.detach();
            this.outer.replaceWith(list);
        },

        /** Event Handlers **/

        _topHandler: function (event) {
            this.moveTop($('.ui-selected', this.element), event);
        },

        _upHandler: function (event) {
            this.moveUp($('.ui-selected', this.element), event);
        },

        _downHandler: function (event) {
            this.moveDown($('.ui-selected', this.element), event);
        },

        _lastHandler: function (event) {
            this.moveLast($('.ui-selected', this.element), event);
        }

    });

}(jQuery));