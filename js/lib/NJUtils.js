/* <copyright>
This file contains proprietary software owned by Motorola Mobility, Inc.<br/>
No rights, expressed or implied, whatsoever to this software are provided by Motorola Mobility, Inc. hereunder.<br/>
(c) Copyright 2011 Motorola Mobility, Inc.  All Rights Reserved.
</copyright> */

var Montage = require("montage/core/core").Montage,
    ElementModel        = require("js/models/element-model").ElementModel,
    Properties3D    = require("js/models/properties-3d").Properties3D,
    ShapeModel    = require("js/models/shape-model").ShapeModel,
    ControllerFactory   = require("js/controllers/elements/controller-factory").ControllerFactory;

exports.NJUtils = Object.create(Object.prototype, {
    
    
    
    /* =============== DOM Access ================ */
    
    ///// Quick "getElementById"
    $ : {
        value: function(id) {
            return document.getElementById(id);            
        }
    },
    
    ///// Quick "getElementsByClassName" which also returns as an Array
    ///// Can return as NodeList by passing true as second argument
    $$ : {
        value: function(className, asNodeList) {
            var list = document.getElementsByClassName(className);
            return (asNodeList) ? list : this.toArray(list);
        }
    },
    
    ///// Get child nodes of element
    ///// Omit filter to only return element nodes
    ///// Pass in filter function to minimize collection, or
    ///// set to true to include all nodes
    children : {
        value : function(el, filter) {
            var f = filter || function(item) {
        		return item.nodeType === 1;
        	};
        	return this.toArray(el.childNodes).filter(f);
        }
    },
    
     /* ============= DOM Manipulation ============= */
    
    ///// Creates and returns text node from string
    textNode : {
        value: function(text) {
            return document.createTextNode(text);
        }
    },
    
    ///// Quick "createElement" function "attr" can be classname or object
    ///// with attribute key/values
    make : {
        value: function(tag, attr) {
            var el = document.createElement(tag);
            if (typeof attr === 'object') {
                for (var a in attr) {
                    if (attr.hasOwnProperty(a)) {
                        el[a] = attr[a];
                    }
                }
            } else if (typeof attr === 'string') {
                el.className = (el.className + ' ' + attr).trim();
            }
            
            return el;
        }
    },

    ///// Element factory function for Ninja Elements
    ///// selection is the string displayed in the PI
    makeNJElement: {
        value: function(tag, selection, controller, attr, isShape) {
            var el = this.make(tag, attr);
            this.makeElementModel(el, selection, controller, isShape);

            return el;
        }
    },

    ///// Element Model creation for existing elements
    ///// TODO: find a different place for this function
    makeElementModel: {
        value: function(el, selection, controller, isShape) {
            var p3d = Montage.create(Properties3D).init(el);
            var shapeProps = null;
            if(isShape) {
                shapeProps = Montage.create(ShapeModel);
            }

            el.elementModel = Montage.create(ElementModel, {
                    type:       { value: el.nodeName},
                    selection:  { value: selection},
                    controller: { value: ControllerFactory.getController(controller)},
                    pi:         { value: controller + "Pi"},
                    props3D:    { value: p3d},
                    shapeModel: { value: shapeProps}
            });

        }
    },

    ///// Element Model creation for existing elements based on element type.
    ///// TODO: find a different place for this function and return different element models based on type.
    makeElementModel2: {
        value: function(el) {
            this.makeElementModel(el, "Div", "block", false);
        }
    },

    ///// Removes all child nodes and returns node
    ///// Accepts a single node, or an array of dom nodes
    empty : {
        value: function(node) {
            var elements = [],
                self = this;
            if (node.constructor === Array) {
                node.forEach(function(el) { self.empty(el) });
            } else {
                this.toArray(node.childNodes).forEach(function(child) {
                    child.parentNode.removeChild(child);
                });
            }

            return node;
        }
    },
    
    queryParentSelector : {
    	value: function(el, strSelector) {
			// queryParentSelector:
			// Given a DOM element el (required), walk up the DOM tree
			// and find the first parent that matches selector strSelector (required).
			// Returns: The element that matches, or false if there is no match
			// or if insufficient parameters are supplied.
			
			if ((typeof(el) === "undefined") || (typeof(strSelector) === "undefined")) {
				// Parameters are required, m'kay?
				return false;
			} else if ((typeof(el) !== "object") || (typeof(strSelector) !== "string" )) {
				// You also have to use the right parameters.
				return false;
			}
			
			// First, get an empty clone of the parent.
			var myParent = el.parentNode;
			var clone = myParent.cloneNode(false);
			if (clone === null) {
				return false;
			}
			
			// If we're at the top of the DOM, our clone will be an htmlDocument.
			// htmlDocument has no tagName.
			if (typeof(clone.tagName) !== "undefined") {
				// create a bogus div to use as a base for querySelector
				var temp = document.createElement("div");
				
				// Append the clone to the bogus div
				temp.appendChild(clone);
				
				// Now we can use querySelector!  Sweet.
				var selectorTest = temp.querySelector(strSelector);
				
				// What has querySelector returned?
				if (selectorTest === null) {
					// No match, so recurse.
					return this.queryParentSelector(myParent, strSelector);
				} else {
					// Match! Return the element.
					return myParent;
				}
			} else {
				// We're at the top of the DOM so we're done.
				return false;
			}
		}
    	
    },

    /* ================= Style methods ================= */
    
    ///// Get computed height of element
    height : {
        value: function(node, pseudo) {
            return node.ownerDocument.defaultView.getComputedStyle(node, pseudo).getPropertyValue('height');
        }
    },
    
    /* ================= Array methods ================= */

    ///// Return an array from an array-like object
    toArray : {
        value: function(arrayLikeObj) {
            return Array.prototype.slice.call(arrayLikeObj);
        }
    },
    
    /* ================= String methods ================= */
    
    ///// Return the last part of a path (e.g. filename)
    getFileNameFromPath : {
        value: function(path) {
            return path.substr(path.lastIndexOf('/') + 1);
        }
    }
    
});