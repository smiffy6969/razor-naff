// naff.js
// version: (please see package.js)
// author: Paul Smith
// license: MIT
var naff = (function ()
{
    'use strict';

    /* CONFIG */

    if (typeof rivets != 'undefined')
    {
		rivets.configure({
			prefix: 'naff',
			preloadData: true,
			rootInterface: '.',
			templateDelimiters: ['{{', '}}'],

			// Augment the event handler of the on-* binder
			handler: function(target, event, binding)
			{
				// need to send in all arguments, resolve them to model
				target = getScope(target);
				var parts = binding.keypath.replace(')', '').split('(');
				var args = parts[1].split(',');

				for (var i = 0; i < args.length; i++) args[i] = _parseData(args[i], target);
				if (typeof target[parts[0]] == 'undefined') throw 'Error: cannot find function \'' + parts[0] + '\' in element scope';

                args.unshift(event);
				target[parts[0]].apply(target, args);
			}
		});
	}

	if (!document.head.querySelector('style#naff-resolver'))
	{
		var resolver = document.createElement("STYLE");
		resolver.setAttribute('id', 'naff-resolver');
		resolver.innerHTML = "*[resolve]{display:block;opacity:1;-webkit-transition:opacity 1s ease-in-out;-moz-transition:opacity 1s ease-in-out;transition:opacity 1s ease-in-out;}*[unresolved]{opacity:0;}";
		document.head.appendChild(resolver);
	}

	/* PUBLIC */

	/**
	 * [public] - Get origins working scope (custom element root)
	 * @param mixed origin The place to start looking from, usually 'this' but can be selector string
	 * @return object Custom element root working scope
	 */
	var getScope = function(origin)
	{
		origin = _getOrigin(origin);
		if (!origin) throw 'Origin not found, please add starting point for scope lookup';

		var parent = origin;
		while (!!parent.tagName && !parent.scope) parent = parent.parentNode;
		return !!parent.scope ? parent.scope : (parent.toString() === '[object ShadowRoot]' ? parent.host.scope : null);
	};

	/**
	 * [public] - Get origins parent working scope (custom elements parent custom element root)
	 * @param mixed origin The place to start looking from, usually 'this' but can be selector string
	 * @param string name [optional] The name of the parent custom element to stop at (go back multiple parents by looking for id)
	 * @return object Custom element root working scope
	 */
	var getParentScope = function(origin, name)
	{
		origin = _getOrigin(origin);
		if (!origin) throw 'Origin not specified, please add starting point for scope lookup';

		var parent = getScope(origin).parentNode;
		while (!!parent.tagName && !(!!name && parent.tagName == name.toUpperCase() && parent.scope) && !(!name && parent.scope)) parent = parent.parentNode;
		return !!parent.scope ? parent.scope : (parent.toString() === '[object ShadowRoot]' ? parent.host.scope : null);
	};

	/**
	 * [public] - Register a new custom element as an app, creating a naff working scope for the interface but no templating
	 * @param object blueprint The custom element blueprint to create the custom element from
	 */
	var registerApplication = function(blueprint)
	{
		// create proto
		var proto = Object.create(HTMLElement.prototype);

		// forward callbacks
		proto.createdCallback = function()
		{
			if (this.hasAttribute('resolve')) this.setAttribute('unresolved', '');
			this.scope = cloneObject(blueprint);
		};

		proto.attachedCallback = function()
		{
			var app = this;
			rivets.bind(app, app.scope);

			// ensure end of stack
			setTimeout(function()
			{
				app.removeAttribute('unresolved');
				if (typeof app.scope.ready != 'undefined') app.scope.ready();
			}, 0);
		};

		// register custom element
		document.registerElement(blueprint.name, {prototype: proto});
	};

	/**
	 * [public] - Register a new custom element, creating a naff working scope for the interface
	 * @param object blueprint The custom element blueprint to create the custom element from
	 */
	var registerElement = function(blueprint)
	{
		// create proto
		var proto = Object.create(HTMLElement.prototype);
		var template = document._currentScript.ownerDocument.querySelector('#' + blueprint.name);

		// forward callbacks
		proto.createdCallback = function()
		{
			this.scope = cloneObject(blueprint);

			if (!!template)
			{
				applyTemplate(this, template, blueprint.shadowDom, blueprint.dataBind);
				this.scope.template = !!this.shadowRoot ? this.shadowRoot : this;
			}

			var scope = this.scope.host = this;
			if (!this.scope.fire) this.scope.fire = function(name, detail) { naff.fire.call(scope, null, name, detail); };
			if (!!blueprint.created) this.scope.created();
            fire(this, 'created');
		};

		proto.attachedCallback = function()
		{
			if (!!blueprint.attached) this.scope.attached();
            fire(this, 'attached');
		};

		proto.detachedCallback = function()
		{
			if (!!blueprint.detached) this.scope.detached();
            fire(this, 'detached');
		};

		proto.attributeChangedCallback = function(name, oldVal, newVal)
		{
			if (!!blueprint.attributeChanged) this.scope.attributeChanged(name, oldVal, newVal);
		    fire(this, name + 'attributechanged', {name: name, oldVal: oldVal, newVal: newVal});
        };

		// register custom element
		var protoWrap = {prototype: proto};
		if (!!blueprint.extends) protoWrap.extends = blueprint.extends;
		document.registerElement(blueprint.name, protoWrap);
	};

	/**
	 * [public] - Apply a template to a new custom element in light dom (default) or shadow dom (with 'shadow-dom' attribute on custom element)
	 * @param mixed host The custom element to apply the template to, usually 'this' but can be selector string
	 */
	var applyTemplate = function(host, template, shadowDom, dataBind)
	{
		host = _getElement(host);
		if (!host) throw 'Host custom element not specified, please add custom element reference or lookup';

		var shadow = !!shadowDom;
		var bind = host.hasAttribute('data-bind') || !!dataBind;
		var matches = template.content.querySelectorAll('content[select]');
		var match = template.content.querySelector('content');
        var content, root, ele, found;

		if (matches.length > 0)
		{
			content = {};

			// cache content from host
			for (var i = 0; i < matches.length; i++)
			{
				if (!matches[i].hasAttribute('select')) continue;
				var name = matches[i].getAttribute('select');
				found = host.querySelector(name);
                if (found)
                {
                    content[name] = found;
                    found.parentNode.removeChild(found);
                }
			}

			// apply template
            if (shadow)
			{
				root = host.createShadowRoot();
				root.innerHTML = template.innerHTML;
			}
			else host.innerHTML = template.innerHTML;

			// apply any content
			for (var key in content)
			{
				ele = shadow ? root.querySelector('content[select=' + key + ']') : host.querySelector('content[select=' + key + ']');
            	if (!!content[key]) ele.parentNode.insertBefore(content[key], ele);
				ele.parentNode.removeChild(ele);
			}
		}
		else if (match)
		{
			// cache content from host
			content = host.innerHTML;

			// apply template
			if (shadow)
			{
				root = host.createShadowRoot();
				root.innerHTML = template.innerHTML;
			}
			else host.innerHTML = template.innerHTML;

			// apply content
			ele = shadow ? root.querySelector('content') : host.querySelector('content');
			ele.innerHTML = content;

			// remove parent content div
			var fragment = document.createDocumentFragment();
			while(ele.firstChild) fragment.appendChild(ele.firstChild);
			ele.parentNode.replaceChild(fragment, ele);
		}
		else
		{
			// apply template
			if (shadow)
			{
				root = host.createShadowRoot();
				root.innerHTML = template.innerHTML;
				if (typeof window.ShadowDOMPolyfill != 'undefined') window.ShadowDOMPolyfill.assert(root); // polyfill those that need it, support is limited
			}
			else host.innerHTML = template.innerHTML;
		}

		// apply data binding to template if set
		if (!!bind && typeof rivets != 'undefined') rivets.bind((shadow ? root : host), host.scope);
	};

	/**
	 * [public] - Clone an objects properties and methods
	 * @param object The object to clone
	 * @return object The cloned object (not a reference to an object)
	 */
	var cloneObject = function(obj)
	{
	    if (obj === null || obj.toString() !== '[object Object]') return obj;
	    var temp = obj.constructor();
	    for (var key in obj) temp[key] = cloneObject(obj[key]);

	    return temp;
	};

	/**
	 * [public] - Fires an event off, from the provided element, or from scope if element not set
	 * @param HTML obejct element The element to fire from
	 * @param string name The name of the event
	 * @param mixed detail [optional] Any optional details you wish to send
	 */
	var fire = function(element, name, detail)
	{
		if (!element) element = this;
		if (element.host) element = element.host;
		var event = !detail ? new Event(name) : new CustomEvent(name, { 'detail': detail });
		element.dispatchEvent(event);
	};

	/* PRIVATE */

	/**
	 * [private] - parse all data to return correct type
	 * @param string data The initial data as a string
	 * @param object model The scope to refer to when converting data
	 * @param bool returnFunc The force function return flag, for binding functions to events
	 * @return mixed The resulting data type forced (or a function if flag set)
	 */
	var _parseData = function(data, model)
	{
		if (!data) return;
		data = data.trim();

		if (/^[0-9]+$/i.test(data)) return parseInt(data); // integer
		else if (data == 'true' || data == 'false') return data === 'true' ? true : false; // boolean
		else if (data == 'null') return null; // null
		else if (/^(\'|\"){1}.*(\'|\"){1}$/.test(data))	return data.substring(1, data.length-1); // string
		else
		{
			// property with . seperators and [] sperators
			var dots = data.split('.');
			var result = model;
			for (var i = 0; i < dots.length; i++)
			{
				var bracks = dots[i].split('[');
				for (var c = 0; c < bracks.length; c++)
				{
					var key = !/^[0-9 ]+$/i.test(bracks[c]) ? bracks[c].replace(/[\'\"\] ]/g, '') : parseInt(bracks[c].replace(/[ ]/g, ''));
					result = !result ? result : result[key];
				}
			}

			return result;
		}
	};

	/**
	 * [private] - Resolve to dom element and return
	 * @param mixed element The element/string to resolve to a dom element
	 * @return mixed Dom element or null
	 */
	var _getOrigin = function(element)
	{
		switch (typeof element)
		{
			case 'undefined': return null;
			case 'string': return document.querySelector(element);
			case 'object': return !!element.scope ? element.parentNode : element;
		}
	};

	/**
	 * [private] - Resolve to dom element and return
	 * @param mixed element The element/string to resolve to a dom element
	 * @return mixed Dom element or null
	 */
	var _getElement = function(element)
	{
		switch (typeof element)
		{
			case 'undefined': return null;
			case 'string': return document.querySelector(element);
			case 'object': return element;
		}
	};

	return {
		getScope: getScope,
		getParentScope: getParentScope,
		registerElement: registerElement,
		registerApplication: registerApplication,
		applyTemplate: applyTemplate,
		cloneObject: cloneObject,
		fire: fire
	};
})();
