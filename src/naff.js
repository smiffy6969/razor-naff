// create module
var naff = (function () 
{
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
	}

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
	}

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
				_applyTemplate(this, template, blueprint.shadowDom, blueprint.dataBind);
				this.scope.template = !!this.shadowRoot ? this.shadowRoot : this;
				this.scope.host = this;
			}

			if (!!blueprint.created) this.scope.created(); 
		};

		proto.attachedCallback = function()
		{
			_observeNested(this, this.scope, _observeBinding);

			if (!!blueprint.attached) this.scope.attached();
		};

		proto.detachedCallback = function()
		{
			// garbage collection
			Object.unobserve(this.scope, _observeBinding);
			_removeBindings(this);

			if (!!blueprint.detached) this.scope.detached();
		};

		proto.attributeChangedCallback = function(name, oldVal, newVal)
		{
			if (!!blueprint.attributeChanged) this.scope.attributeChanged(name, oldVal, newVal);
		};
		
		// register custom element
		var protoWrap = {prototype: proto};
		if (!!blueprint.extends) protoWrap.extends = blueprint.extends;
		document.registerElement(blueprint.name, protoWrap);
	};

	/**
	 * [private] - Clone an objects properties and methods
	 * @param object The object to clone
	 * @return object The cloned object (not a reference to an object)
	 */
	var cloneObject = function(obj)
	{
	    if (obj === null || obj.toString() !== '[object Object]') return obj;
	    var temp = obj.constructor();
	    for (var key in obj) temp[key] = cloneObject(obj[key]);
	 
	    return temp;
	}

	/* PRIVATE */

	/**
	 * [private] - Apply a template to a new custom element in light dom (default) or shadow dom (with 'shadow-dom' attribute on custom element)
	 * @param mixed host The custom element to apply the template to, usually 'this' but can be selector string
	 */
	var _applyTemplate = function(host, template, shadowDom, dataBind)
	{
		host = _getElement(host);
		if (!host) throw 'Host custom element not specified, please add custom element reference or lookup';
		
		var shadow = host.hasAttribute('shadow-dom') || !!shadowDom;
		var bind = host.hasAttribute('data-bind') || !!dataBind;
		var matches = template.content.querySelectorAll('content[select]');
		var match = template.content.querySelector('content');

		if (matches.length > 0) 
		{
			var content = {};

			// cache content from host
			for (var i = 0; i < matches.length; i++) 
			{
				if (!matches[i].hasAttribute('select')) continue;
				var name = matches[i].getAttribute('select');
				content[name] = host.querySelector(name);
			};

			// apply template
			if (shadow)
			{
				var root = host.createShadowRoot();
				root.innerHTML = template.innerHTML;
			}
			else host.innerHTML = template.innerHTML;
			
			// apply any content
			for (var key in content)
			{
				var ele = shadow ? root.querySelector('content[select=' + key + ']') : host.querySelector('content[select=' + key + ']');
				ele.parentNode.insertBefore(content[key], ele);
				ele.parentNode.removeChild(ele);
			}
		} 
		else if (match)
		{	
			// cache content from host
			var content = host.innerHTML;

			// apply template
			if (shadow)
			{
				var root = host.createShadowRoot();
				root.innerHTML = template.innerHTML;
			}
			else host.innerHTML = template.innerHTML;

			// apply content
			var ele = shadow ? root.querySelector('content') : host.querySelector('content');
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
				var root = host.createShadowRoot();
				root.innerHTML = template.innerHTML;
			}
			else host.innerHTML = template.innerHTML;
		}

		// apply data binding to template if set
		if (!!bind) _applyBindings((shadow ? root : host), host.scope);
	};

	/**
	 * [private] - Find all elements in templat eto remove bindings and issue remove
	 * @param object element The element to find all children from
	 */
	var _removeBindings = function(element)
	{
		var elements = _getBindableChildren(element);
		for (var i = 0; i < elements.length; i++) _removeBind(elements[i]);
	};

	/**
	 * [private] - Find all elements in template to add bindings
	 * @param object element The element to find all children from
	 * @param object model The scoipe to bind to
	 */
	var _applyBindings = function(element, model)
	{
		var elements = _getBindableChildren(element);
		for (var i = 0; i < elements.length; i++) _updateBind(elements[i], model);
	};

	/**
	 * [private] - parse all data to return correct type
	 * @param string data The initial data as a string
	 * @param object model The scope to refer to when converting data
	 * @param bool returnFunc The force function return flag, for binding functions to events
	 * @return mixed The resulting data type forced (or a function if flag set)
	 */
	var _parseData = function(data, model, returnFunc)
	{
		data = data.trim();

		if (/^[0-9]+$/i.test(data)) return parseInt(data); // integer
		else if (data == 'true' || data == 'false') return data === 'true' ? true : false; // boolean
		else if (data == 'null') return null; // null
		else if (/^[a-z0-9-_.]+$/i.test(data))
		{
			// property
			var parts = data.split('.');
			var result = model[parts[0]];
			for (var i = 1; i < parts.length; i++) result = result[parts[i]];
			return result;
		}
		else if (/^[a-z0-9-_]+\({1}.*\){1}\;?$/i.test(data))
		{
			// function
			var details = data.replace(/[\)\;]/g, '').split('(');
			var func = details[0];
			var props = details[1].split(',');

			for (var i = 0; i < props.length; i++) props[i] = _parseData(props[i], model);

			if (!model[func]) return;
			
			if (!returnFunc) return model[func].apply(model, props);
			return {func: model[func], props: props};

		}
		else if (/^(\'|\"){1}.*(\'|\"){1}$/.test(data))	return data.substring(1, data.length-1); // string
	};

	/**
	 * [private] - Update bind for a specific element
	 * @param object element The element to update
	 * @param object model the scope to refer to when updating
	 */
	var _updateBind = function(element, model)
	{		
		var details = element.getAttribute('naff').split('|');
		if (details.length < 2) return;
		
		switch (details[0])
		{
			case 'text':
				element.innerText = _parseData(details[1], model);
			break;
			case 'html':
				element.innerHTML = _parseData(details[1], model);
			break;
			default:
				if (details[0].substring(0, 2) == 'on') element.addEventListener(details[0].substring(2, details[0].length), _listener, false);
			break;
		}
	};

	/**
	 * [private] - remove bind for a specific element
	 * @param object element The element to remove binding
	 */
	var _removeBind = function(element)
	{		
		var details = element.getAttribute('naff').split('|');
		if (details.length < 2) return;
		if (details[0].substring(0, 2) == 'on') element.removeEventListener(details[0].substring(2, details[0].length), _listener, false);
	};

	/**
	 * [private] - global naff listener, for applying/removing events
	 * @param object event The event from the listening service as it happens
	 */
	var _listener = function(event)
	{
		var details = this.getAttribute('naff').split('|');
		if (details.length < 2) return;
		
		var model = naff.getScope(this);
		var data = _parseData(details[1], model, true);
		data.props.unshift(event, this);
		data.func.apply(model, data.props);
	}

	/**
	 * [private] - nested object.observe to ensure we capture all changes in scope
	 * @param object host The scope/this you want to force when resulting function is run
	 * @param object obj The obj to watch
	 * @param function callback The callback function to run with host scope
	 * @param string path internal pointer to nested object path, leave blank
	 */
	var _observeNested = function(host, obj, callback, path) 
	{
		for (var key in obj) if (!!obj[key] && typeof obj[key] == 'object' && obj[key].toString() == '[object Object]') _observeNested(host, obj[key], callback, path + '.' + key);
    	Object.observe(obj, function(changes) { callback.apply(host, [changes, path]) });
	};

	/**
	 * [private] - nested object.unobserve to ensure we remove all observations
	 * @param object obj The obj to watch
	 * @param function callback The callback function that was used when observing
	 */
	var _unobserveNested = function(obj, callback) 
	{
		for (var key in obj) if (!!obj[key] && typeof obj[key] == 'object' && obj[key].toString() == '[object Object]') _unobserveNested(obj[key], callback);
		Object.unobserve(obj[key], callback);
	};

	/**
	 * [private] - function to run when observing an objects changes, updates bindings to resemble changes
	 * @param array changes The changes as an array of changes
	 * @param string path The path to the value observed from scope (in dot form)
	 */
	var _observeBinding = function(changes, path)
	{
		// fix path
		path = !path ? '' : path.replace('undefined.', '');
		if (path.length > 0) path += '.';

		// make changes
		for (var i = 0; i < changes.length; i++) 
		{	
			var change = changes[i];
			var name = changes[i].name;	

			// forward to any observer function set on scope
			if (this.scope.observer) this.scope.observer.apply(this.scope, [path + name, change]);

			// push changes to all naffs
			var matches = this.querySelectorAll("[naff*='" + path + name + "']");
			for (var i = 0; i < matches.length; i++) if (matches[i].getAttribute('naff').split('|')[1] == path + name) 
			{
				_updateBind(matches[i], this.scope);
			}	
		}
	};

	/**
	 * [private] - get a list of all bindable children with naff attributes
	 * @param object element The element to start looking from
	 * @return array An array of dom elements that are only in this scope and have naff attribute
	 */
	var _getBindableChildren = function(element)
	{
		var nodes = element.childNodes;
		var matches = [];
		for (var i = 0; i < nodes.length; i++) 
		{
			if (nodes[i].nodeName != '#text' && nodes[i].hasAttribute('naff')) matches.push(nodes[i]);			
			if (!nodes[i].scope && nodes[i].childNodes.length > 0) matches = matches.concat(_getBindableChildren(nodes[i]));
		};

		return matches;
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
	}

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
	}

	return {
		getScope: getScope,
		getParentScope: getParentScope,
		registerElement: registerElement,
		cloneObject: cloneObject
	};
})();