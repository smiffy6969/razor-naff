// naff.js
// version: (please see package.js)
// author: Paul Smith
// license: MIT
(function ()
{
    'use strict';

    /* CONFIG */

    if (typeof rivets !== 'undefined')
    {
		rivets.configure({
			prefix: 'naff',
			preloadData: true,
			rootInterface: '.',
			templateDelimiters: ['{{', '}}'],

			// Augment the event handler of the on-* binder
			handler: function(target, event, binding)
			{
    			var parts = binding.keypath.replace(')', '').split('(');
    			var args = parts[1].split(',');

    			for (var i = 0; i < args.length; i++) args[i] = _parseData(args[i], target);

                // resolve correct scope that is bound to function
                target = getScope(target);
                while (target && target.name !== binding.model.name) target = getScope(target.host.parentNode);

                if (typeof target[parts[0]] == 'undefined') throw 'Error: cannot find function \'' + parts[0] + '\' in element scope \'' + binding.model.name + '\'';

                args.unshift(event);
    			target[parts[0]].apply(target, args);
			}
		});
	}

    if (typeof sightglass !== 'undefined')
    {
        sightglass.adapters = rivets.adapters;
        sightglass.root = '.';
    }

	/* PUBLIC */

	/**
	 * [public] - Get origins working scope (custom element root)
	 * @param mixed origin The place to start looking from, usually 'this' but can be selector string
	 * @return object Custom element root working scope
	 */
	var getScope = function(origin)
	{
		origin = _getElement(origin);
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
		origin = _getElement(origin);
		if (!origin) throw 'Origin not specified, please add starting point for scope lookup';

		var parent = getScope(origin); // get current scope
        parent = getScope(parent.host.parentNode); // get parent scope

        if (typeof name !== 'undefined') while (parent.parentNode && parent.host && parent.host.tagName !== name.toUpperCase()) parent = getScope(parent.parentNode);
        return parent;
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
            this.scope.host = this;

            if (typeof this.scope.created != 'undefined') this.scope.created();
		};

		proto.attachedCallback = function()
		{
            if (typeof this.scope.location === 'function')
            {
                var hashCache = getLocation();
                this.scope.location.call(this.scope, hashCache, null);

                var self = this;
                window.addEventListener("hashchange", function(event)
                {
                    // call hashCache seperately to stop reference and force new object, otherwise have to clone
                    self.scope.location.call(self.scope, getLocation(), hashCache);
                    hashCache = getLocation();
                }, false);
            }

			var app = this;
            rivets.bind(app, app.scope);

            setTimeout(function()
    		{
                if (app.hasAttribute('cloak')) app.setAttribute('cloak', 'false');
                if (typeof app.scope.ready != 'undefined') app.scope.ready();
                fire(app, 'ready');
    		}, 1);
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

			var scope = this.scope.host = this;
			if (!this.scope.fire) this.scope.fire = function(name, detail) { naff.fire.call(scope, null, name, detail); };
			if (!!blueprint.created) this.scope.created();
            fire(this, 'created');
		};

		proto.attachedCallback = function()
		{
            if (typeof this.scope.location === 'function')
            {
                var hashCache = getLocation();
                this.scope.location.call(this.scope, hashCache, null);

                var self = this;
                window.addEventListener("hashchange", function(event)
                {
                    // call hashCache seperately to stop reference and force new object, otherwise have to clone
                    self.scope.location.call(self.scope, getLocation(), hashCache);
                    hashCache = getLocation();
                }, false);
            }

			if (!!template)
			{
				_applyTemplate(this, template, blueprint.shadowDom, blueprint.dataBind);
				this.scope.template = !!this.shadowRoot ? this.shadowRoot : this;
			}

            var app = this;
            setTimeout(function()
    		{
                if (app.scope.host.hasAttribute('cloak')) app.scope.host.setAttribute('cloak', 'false');
                if (!!blueprint.attached) app.scope.attached();
                fire(app, 'attached');
    		}, 1);
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

    /**
     * [public] - Micro tool to make ajax/rest requests and return promise, can be called directly using ajax (for basic calls), or via get, post, put, delete
     * @param string token The token to set for authorization requests
     * @return ajax function [type, url, data[, headers]] - Basic ajax request
     *      @param string type The type of request to make, get, post, put, delete...
     *      @param string url The correctly formed URL to hit...
     *      @param string data Any data to send along the way...
     *      @param object headers [optional] headers as key:value
     * @return get function [url, id] - GET rest request
     *      @param string url The url to get from
     *      @param string id [optional] The id of the resource to get
     * @return post function [url, data] - POST rest request
     *      @param string url The url to get from
     *      @param string data [optional] The data to send in to the post request
     * @return put function [url, data] - PUT rest request
     *      @param string url The url to get from
     *      @param string data The data to send in to the put request
     * @return delete function [url, id] - DELETE rest request
     *      @param string url The url to get from
     *      @param string id The id of the resource to delete
     */
    var request = {
        token: null, // Authorization token cache for syncrhonizing handshaking

        ajax: function (type, url, data, headers) {
            var scope = this;
            type = type.toUpperCase();
            var promise = new Promise(function(resolve, reject)
            {
                var XHR = XMLHttpRequest || ActiveXObject;
                var xhrRequest = new XHR('MSXML2.XMLHTTP.3.0');
                xhrRequest.open(type, url, true);
                if (typeof headers !== 'undefined')
                {
                    if (request.token !== null) headers.Authorization = request.token;
                    for (var key in headers) xhrRequest.setRequestHeader(key, headers[key]);
                }
                xhrRequest.onreadystatechange = function ()
                {
                    if (xhrRequest.readyState === 4)
                    {
                        // sort out response, sniff out json and convert
                        var output = xhrRequest.responseText;
                        if (typeof headers['Content-Type'] !== 'undefined' && headers['Content-Type'].indexOf('json') >= 0)
                        {
                            try { output = JSON.parse(xhrRequest.responseText); }
                            catch(e) {}
                        }

                        // set token
                        request.token = this.getResponseHeader('Authorization');

                        // set response type
                        if (xhrRequest.status === 200) resolve({data: output, response: xhrRequest});
                        else reject({data: output, response: xhrRequest});
                    }
                };
                xhrRequest.send(data);
            });
            return promise;
        },

        get: function (url, id) {
            var headers = {'Content-Type': 'application/json;charset=UTF-8', 'Cache-Control': 'no-cache'};
            return this.ajax('GET', url + (typeof id !== 'undefined' && id !== null ? '/' + id : ''), null, headers);
        },

        put: function (url, data) {
            var headers = {'Content-Type': 'application/json;charset=UTF-8', 'Cache-Control': 'no-cache'};
            try { data = JSON.stringify(data); }
            catch(e) {}
            return this.ajax('PUT', url, data, headers);
        },

        post: function (url, data) {
            var headers = {'Content-Type': 'application/json;charset=UTF-8', 'Cache-Control': 'no-cache'};
            try { data = JSON.stringify(data); }
            catch(e) {}
            return this.ajax('POST', url, data, headers);
        },

        delete: function (url, id) {
            var headers = {'Content-Type': 'application/json;charset=UTF-8', 'Cache-Control': 'no-cache'};
            return this.ajax('DELETE', url + (typeof id !== 'undefined' && id !== null ? '/' + id : ''), null, headers);
        }
    };

    /**
	 * [public] - parse URL hash data and return hash object, gives details like path, hash route, hash variables etc
	 * @return object The URL hash object containing parsed hash data like route, path and variables
	 */
    var getLocation = function()
    {
        var url = decodeURI(window.location.href);

        // basic route
        if (url.indexOf('#') < 0) return {route: '', params: {}};
        var hashString = url.substring(url.indexOf('#') + 1, url.length);
        if (hashString.indexOf('?') < 0) return {route: hashString, params: {}};

        // parse params
        var route = hashString.substring(0, hashString.indexOf('?'));
        var params = {};
        var parts = hashString.substring(hashString.indexOf('?') + 1, hashString.length).split('&');
        for (var i = 0; i < parts.length; i++)
        {
            var param = parts[i].split('=');
            if (param[0].length < 1) continue;
            try { param[1] = JSON.parse(param[1]); }
            catch(e) {}
            params[param[0]] = param[1] || '';
        }

        return {route: route, params: params};
    };

    /**
	 * [public] - set a part of the URL hash (route or params or both), gives details like path, hash route, hash variables etc
	 * @param object obj The hash object to update the URL with e.g. {route: '/new/route', params:{one: 'first', two: [1,2,3]}}
	 */
    var setLocation = function(obj)
    {
        if (typeof obj == 'undefined') return;

        // grab current url and hash
        var url = decodeURI(window.location.href);
        var newUrl = url.split('#')[0] + '#';

        // update route
        newUrl += typeof obj.route != 'undefined' ? obj.route : url.indexOf('#') < 0 ? '' : url.substring(url.indexOf('#') + 1, url.length).split('?')[0];

        // update params
        if (typeof obj.params != 'undefined')
        {
            newUrl += '?';
            for (var key in obj.params) newUrl += key + '=' + JSON.stringify(obj.params[key]) + '&';
            newUrl = newUrl.substring(0, newUrl.length - 1);
        }

        window.location.href = encodeURI(newUrl);
    };

    /**
	 * [public] - Cookies control, get, set, remove and check a cookie
     * @return get function [name] - Fetch a cookie
     *      @param string name The name of the cookie to fetch
     * @return set function [name, value, exp, path, domain, secure] - Set a cookie value
     *      @param string name The name of the cookie set
     *      @param string value The value to set the cookie to
     *      @param mixed exp [optional] The expiry for the cookie as a number, string or date value
     *      @param string domain [optional] The domain for the cookie
     *      @param bool secure [optional] Should this only be for https
     * @return remove function [name, path, domain] - Remove a cookie
     *      @param string name The name of the cookie set
     *      @param string value The value to set the cookie to
     *      @param string domain [optional] The domain for the cookie
     * @return has function [name] - Is the cookie set
     *      @param string name The name of the cookie set
     *      @return bool Is the cookie set or not
	 */
    var cookie = {
        get: function (name)
        {
            if (!name) return null;
            var reg = new RegExp("(?:(?:^|.*;)\\s*" + encodeURIComponent(name).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=\\s*([^;]*).*$)|^.*$");
            return decodeURIComponent(document.cookie.replace(reg, "$1")) || null;
        },
        set: function (name, value, exp, path, domain, secure)
        {
            if (!name || /^(?:expires|max\-age|path|domain|secure)$/i.test(name)) return false;

            var expire = "";
            if (typeof exp !== 'undefined')
            {
                if (exp.constructor == Number) expire = exp === Infinity ? "; expires=Fri, 31 Dec 9999 23:59:59 GMT" : "; max-age=" + exp;
                if (exp.constructor == String) expire = "; expires=" + exp;
                if (exp.constructor == Date) expire = "; expires=" + exp.toUTCString();
            }

            domain = domain ? "; domain=" + domain : "";
            path = path ? "; path=" + path : "";
            secure = secure ? "; secure" : "";

            return document.cookie = encodeURIComponent(name) + "=" + encodeURIComponent(value) + expire + domain + path + secure;
        },
        remove: function (name, path, domain)
        {
            if (!cookie.has(name)) return false;

            domain = domain ? "; domain=" + domain : "";
            path = path ? "; path=" + path : "";

            return document.cookie = encodeURIComponent(name) + "=; expires=Thu, 01 Jan 1970 00:00:00 GMT" + domain + path;
        },
        has: function (name)
        {
            if (!name) return false;
            var reg = new RegExp("(?:^|;\\s*)" + encodeURIComponent(name).replace(/[\-\.\+\*]/g, "\\$&") + "\\s*\\=");
            return reg.test(document.cookie);
        }
    };

	/* PRIVATE */

	/**
	 * [private] - Apply a template to a new custom element in light dom (default) or shadow dom (with 'shadow-dom' attribute on custom element)
	 * @param mixed host The custom element to apply the template to, usually 'this' but can be selector string
	 */
	var _applyTemplate = function(host, template, shadowDom, dataBind)
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

            // apply data binding to template if set, do this before merging in content to stop dual binding
            if (!!bind && typeof rivets != 'undefined') rivets.bind((shadow ? root : host), host.scope);

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
			// cache content from host, if this fails with things like naff if, need to swap this a childNodes.length > 0..... childNodes[0]
            content = document.createDocumentFragment();
            while(host.firstChild) content.appendChild(host.firstChild);

            // apply template
			if (shadow)
			{
				root = host.createShadowRoot();
				root.innerHTML = template.innerHTML;
			}
			else host.innerHTML = template.innerHTML;

            // apply data binding to template if set, do this before merging in content to stop dual binding
            if (!!bind && typeof rivets != 'undefined') rivets.bind((shadow ? root : host), host.scope);

			// grab content area
			ele = shadow ? root.querySelector('content') : host.querySelector('content');

			// add children from host to parent and remove parent content element
			var fragment = document.createDocumentFragment();
			while(content.firstChild) fragment.appendChild(content.firstChild);
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

    		// apply data binding to template if set
    		if (!!bind && typeof rivets != 'undefined') rivets.bind((shadow ? root : host), host.scope);
		}
	};

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
	var _getElement = function(element)
	{
		switch (typeof element)
		{
			case 'undefined': return null;
			case 'string': return document.querySelector(element);
			case 'object': return element;
		}
	};

	var naff = {
		getScope: getScope,
		getParentScope: getParentScope,
		registerElement: registerElement,
		registerApplication: registerApplication,
		cloneObject: cloneObject,
		fire: fire,
        request: request,
        getLocation: getLocation,
        setLocation: setLocation,
        cookie: cookie
	};

    // Export module for Node and the browser.
    if (typeof module !== 'undefined' && module.exports) module.exports = naff;
    else if (typeof define === 'function' && define.amd) define([], function() { return this.naff = naff; });
    else this.naff = naff;
}).call(this);
