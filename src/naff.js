// create module
var naff = (function () 
{
	// constructor
	function naff(origin){
		switch (typeof origin)
		{
			case 'undefined': this.origin = null; break;
			case 'string': this.origin = document.querySelector(origin); break;
			case 'object': this.origin = origin; break;
		}

		return this;
	}

	// special functions //

	naff.prototype.applyTemplate = function()
	{
		if (!this.origin) return;

		this.originCopy = document.createElement('copy');
		this.originCopy.innerHTML = this.origin.innerHTML;
		this.originAltered = document.createElement('altered');
		this.originAltered.innerHTML = this.origin.template.innerHTML;
		
		var matches = this.origin.template.content.querySelectorAll('content[select]');
		var match = this.origin.template.content.querySelector('content');

		if (matches.length > 0) 
		{
			for (var i = 0; i < matches.length; i++) {
				if (matches[i].hasAttribute('select') && this.originCopy.querySelector(matches[i].getAttribute('select')))
				{
					var ele = this.originAltered.querySelector('content[select=' + matches[i].getAttribute('select') + ']');
					ele.parentNode.insertBefore(this.originCopy.querySelector(matches[i].getAttribute('select')).cloneNode(true), ele);
					ele.parentNode.removeChild(ele);
				}
			};
		} 
		else if (match) this.originAltered.querySelector('content').innerHTML = this.originCopy.innerHTML; 
	
		this.origin.innerHTML = this.originAltered.innerHTML;
		
		return this;
	}

	// chaining functions

	naff.prototype.findScope = function()
	{
		if (!this.origin) return this;
		
		var parent = this.origin;
		while (!!parent.tagName && !parent.template) parent = parent.parentNode;
		this.scope = !!parent.template ? parent : null;

		return this;
	}

	naff.prototype.findParentScope = function(name)
	{
		if (!this.scope) this.findScope();
		
		var parent = this.scope.parentNode;
		while (!!parent.tagName && !(!!name && parent.tagName == name.toUpperCase() && parent.template) && !(!name && parent.template)) parent = parent.parentNode;
		this.scope = !!parent.template ? parent : null;

		return this;
	}

	// Returning functions

	naff.prototype.getScope = function()
	{
		if (!this.origin) return this;
		if (!this.scope) this.findScope();
		return this.scope;
	}

	naff.prototype.getParentScope = function(name)
	{
		if (!this.origin) return this;
		if (!this.scope) this.findParentScope();
		return this.scope;
	}

	return function(selector){
		return new naff(selector);
	}
})();