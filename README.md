# Razor NAFF Web Component Helper Library


Razor NAFF is a helper library that makes it easier to create native web components written in vanilla javascript, it basically provides two major functions allowing you to traverse custom object scopes, enabling you to easily target logic from within the custom element. In addition to these two functions, should you wish to make things a little simpler with more sugar, there are optional features that can also provide registration such as data binding and templating using the slightly modified rivets and sightglass (via single bundled js file).

For best results, it is probably best to go middle ground, basic components using native javascript, with more complex components (with multiple child elements) using the binding features of rivets and sightglass to make things easier. The end result here would be good optimization of resources. With the optional features comes overhead, data binding is nice but it has it's prices, so NAFF tries to add templating and binding using the simple and lean rivets and sightglass included bundle. It is recommended to keep simple components as vanilla as possible for speed and stability.

This library also comes with its own suite of web components that use this library to help give you a good place to start building apps and websites right away.


## Installation  


Razor NAFF is located on git hub [https://github.com/smiffy6969/razor-naff] and can be downloaded from there, or the prefered method is to use bower.

You may use the --save flag to store installation info in a central project bower.json file, if you do not have one already, you can do this first.


```
bower init
```


Installing is simple via bower in the command line, from your project root folder... The depnedancies required (rivets and sightglass) are both bundled in seeing as some tweaking is needed for naff.


```
bower install razor-naff --save
```


## Setup


In order to use the NAFF library, you need to include it, there are no dependancies outside of rivets and sightglass (should you wish to use binding and templating), but you will need to polyfill missing functions for older browsers, such as webcomponentsjs.


```html
<script src="bower_components/webcomponentsjs/webcomponents.min.js"></script>
<script src="bower_components/razor-naff/build/naff.bundled.min.js"></script>
```


Now we have the polyfills and NAFF bundle installed (or you can just add naff if you do not need binding and templating), we can use the pair together to build web components (you can swap webcomponentsjs with others if you wish, such as x-tags).


## Usage


To use the NAFF library, it all starts with `naff`, which is the base name for razorNAFF. We use this name to access NAFF functions...


```javascript
var scope = naff.getScope(this);
scope.someCustomElementFunction();

// or

naff.getScope(this).someCustomElementFunction();
```


These two snippets do the same thing, both take in the current point in the dom (the origin of where you want to start looking from), and allow you to get the scope of the containing custom element you are working in (by looking outwards). It then runs a function on the scope returned, which could be evaluated to


```javascript
var scope = document.querySelector('x-foo');
scope.someCustomElementFunction();

// or

document.querySelector('x-foo').someCustomElementFunction();
```


The difference with NAFF and native selection is that in the NAFF example, we search backwards out through the parents until we find the scope of the custom element, meaning our custom element logic will work on all instances of `<x-foo></x-foo>` independantly without issue. The native selector method will only work on the first x-foo element it finds. This is how we can map functions from templates in custom element children direct to the containing custom element scope. This is handy as it is the place where we store all logic associated with the custom element.


The other benefit of using naff is that it allows us to abstract back the use of shadow dom. quite simply, shadow dom allows us to encapsulate our custom elements html, style and logic to stop outside things affecting the web component as well as inside things leaching out. Whilst you can build your own components using shadow dom, or just normal light dom (where there is no exncapsulation of html, style and logic), all naff web components are dual use. Simply add the 'shadow-dom' attribute to your custom element call `<x-foo shadow-dom></x-foo>`, to have your elements content created in a shadow root for encapuslation when using the naff register function, or you can set the shadowDom property, setting it to true when registering your components through naff (non vanilla).


You may want to encapsulate all the time, some of the time, or you may want outside logic and style to bleed in when using tools like bootstrap, in the naff components we have created all logic and style in root and not the template, then used '/deep/' to reference back in with specific tag name declarations, this allows you to use either shadow dom or light dom (default). Reasons for this are primarily due to some browsers still not shipping with shadow dom support or shadow dom active (support but must be turned on by user in browser config), as such we are offering the best of both worlds, all still with a single load of style and logic per import.

Now when you use naff to get the working scope, it will still get you the root custom element even if working in a shadow root, something that you cannot do using just querySelector(), so using naff to resolve scope, shadow dom should not cause you any issues.


```html
<template id="x-foo">
	<div class="test">
		<button onclick="naff.getScope(this).someFunctionOfXFoo()"></button>
	</div>
</template>
```


This allows us to map this click back to the custom x-foo logic in the web component file, whilst it is possible to do this with vanilla JS as above, from this point onwards, we will be using the naff register function to build and apply our custom element. Yes this can be used to build vanilla web components, but I am not going to teach you how to write vanilla JS web components as there are plenty of examples on the web already, we are going to use the naff optional tools.


If you wish to go down the vanilla path, the below as a good starting point for a new vanilla web component using one of the naff functions to obtain scope, the other function is called getParentScope, which enables you to traverse back to a parent custom element scope.


```html
<!-- STYLE - Encapsulate all css to tag name to stop bleed out of component style, use deep to ensure both normal or shadow dom usage -->
<style type="text/css">
	html /deep/ button { opacity: 0.9; border: 1px solid #bbb; background: #ddd; color: #222; cursor: pointer; }
</style>

<!-- TEMPLATE -->
<template id="x-foo">
	<div class="test">
		<button onclick="naff.getScope(this).pushed()"></button>
		<content></content>
	</div>
</template>

<!-- LOGIC -->
<script>
(function()
{
	/* SETUP */

	// setup new prototype for custom element
	var xFooProto = Object.create(HTMLElement.prototype);

	// apply template to element (if any)
	xFooProto.template = document._currentScript.ownerDocument.querySelector('#x-foo');

	// on created, apply template
	xFooProto.createdCallback = function() {
		this.innerHTML = this.template.innerHTML;
	};

	// on attributes changed
	xFooProto.attributeChangedCallback = function(name, oldVal, newVal)
	{
		// iterate over changes
		switch (name)
		{
			case 'name':
				this.querySelector('something').setAttribute('name', newVal);
			break;
		}
	};

	/* ELEMENT */

	xFooProto.pushed = function() {
	  console.log('pushed() called...');
	};

	/* INSERTION */

	// register custom element
	document.registerElement('x-foo', { prototype: xFooProto });
})()
</script>
```


From, this point on, vanilla JS is up to you... Now on to using the naff helpers more, lets look at the example below...


```html
<!-- STYLE - Encapsulate all css to tag name to stop bleed out of component style, use deep to ensure both normal or shadow dom usage -->
<style type="text/css">
	html /deep/ button { opacity: 0.9; border: 1px solid #bbb; background: #ddd; color: #222; cursor: pointer; }
</style>

<!-- TEMPLATE -->
<template id="x-foo">
	<div class="test">
		<button onclick="naff.getScope(this).pushed()"></button>
		<content></content>
	</div>
</template>

<!-- LOGIC -->
<script>
	naff.registerElement({
		// Setup

		name: 'x-foo', 		// Custome element name
		extends: null, 		// do we extend another element
		shadowDom: false, 	// should we force shadow dom on all instances
		dataBind: false, 	// do we want to use data-binding and templating in template

	 	// built in methods

		created: function()
		{
			// when created
			console.log('created');

			this; 				// The host scope instance, which is the instance of this blueprint

			this.host; 			// The host element instance, so you can get attributes etc

			this.template; 		// The template instance, so you can use querySelector inside the template
								// Please note template and host ARE NOT THE SAME (they can resolve) to the same thing
								// if not using shadow dom, but if using shadow dom they differ, so always use
								// host for root element and template for insternal access
		},

		attached: function()
		{
			// when added to dom
			console.log('attached');
		},

		detached: function()
		{
			// when removed from dom
			console.log('detached');
		},

		attributeChanged: function(name, oldVal, newVal)
		{
			// when host attribute changes
			console.log('attributeChanged');
		},

		// Declare Properties

		clickedTimes: 0,

		// Custom methods

		pushed: function(event)
		{
			this.clickedTimes++;
			console.log(clickedTimes);
		}
	});
</script>
```


First of all, styling, we have placed this outside of the tmeplate because we are allowing the component to be used in light and shadow dom, this will ensure styling only loads once and targets the correct component in both cases. If you are going to force `shadowDom: true` in your registration, then you can just put the style in the template, omit the /deep/ calls, this will load the style for each dom fragment like so...


```html
<!-- TEMPLATE -->
<template id="x-foo">
	<style type="text/css">
		button { opacity: 0.9; border: 1px solid #bbb; background: #ddd; color: #222; cursor: pointer; }
	</style>
	<div class="test">
		<button onclick="naff.getScope(this).pushed()"></button>
	</div>
</template>
```


Again this is up to you, whilst I prefer the more universal approach, which only loads style once, the latter loads style into a forced shadow dom element, meaning more style is loaded (css loads for each encapsulated element in its document fragment), but it is cleaner styling. I am not going to push one method over another, I prefer to output style once, not ten times for ten instances of your web component, even if you have to deep link back in, it is simply less code in the dom (see for yourself, use shadow dom and you will see the same style in each fragment).


The button click in the html is mapped back to the root scope of the custom element instance (not the actual xfoo template object above... the instance of x-foo in the dom that was created from the object template above, think of the above as a blueprint that is copied to each element instance. Always ensure when working inside the proto structure methods, always refer to 'this' as the base scope as this will be the specific element instance in the dom.


You can take this one step further, by taking advantage of the data binding and templating features provided by rivets and sightglass (use the bundled build file), this gives basic binding and templating to make things simpler. Just remember though the more features you use the more overhead, this is why we let you choose how much you want naff to help you. The folowing should do the same as the above using binding. We have omitted unsused functions for clarity.


```html
<template id="x-foo">
	<div class="test">
		<button naff-on-click="pushed()"></button>
	</div>
</template>

<script>
	naff.registerElement({
		// Setup

		name: 'x-foo', 		// Custome element name
		dataBind: true, 	// do we want to use data-binding and templating in template

		// Declare Properties

		clickedTimes: 0,

		// Custom methods

		pushed: function(event)
		{
			this.clickedTimes++;
			console.log(clickedTimes);
		}
	});
</script>
```


You could even map the clickedTimes property back to an element for some great binding goodness...


```html
<template id="x-foo">
	<div class="test">
		<p>Clicked <span naff-text="clickedTimes"></span></p>
		<p>Clicked {{clickedTimes}}</p>
		<button naff-on-click="pushed()"></button>
	</div>
</template>

<script>
	naff.registerElement({
		// Setup

		name: 'x-foo', 		// Custome element name
		dataBind: true, 	// do we want to use data-binding and templating in template

		// Declare Properties

		clickedTimes: 0,

		// Custom methods

		pushed: function(event)
		{
			this.clickedTimes++;
		}
	});
</script>
```


Now you should see your clicks automatically updating the dom using element attributes or mustache brackets to bind the data. All binding is offered by rivets and sightglass so for more information on this, please refer to these projects and substitute 'rv' for 'naff' in all instances [http://rivetsjs.com/docs/reference/].


## Custom Properties/Methods


When creating custom properties, please ensure you keep away from using the following names, as these will clash with default properties...

* host
* template
* scope
* name
* extends
* dataBind
* created()
* attached()
* detached()
* attributeChanged()


All the above are default names for properties and methods, they are either set by default or configured by you in the registration of the component. Only use these when adding default functions or configuring the registration. Using this.* to set any of the above will result in default properties/methods changing.


## Default Properties


### this __object__ (scope)


Using `this` in any function defined within the naff registration, will refer to the custom element instance created in the dom, NOT the registration blueprint function.


```javascript
// ...
	clickedTimes: 0,

	pushed: function(event)
	{
		this.clickedTimes++;
	},
// ...
```

this.host // host
this.template // template


### this.host __HTML object__ (custom element)


This is the custom element root, the actual custom element as you added it in your main html document, use this to get access to the host element for things like reading attributes etc. Please note that this is not the same as `this.template`, whilst they can resolve to the same thing if not using shadow dom, when shadow dom is used, the host is the root and the template is the document fragment contents. Always use this.host when refering to the actual custom element and its interactions with the rest of the world.


```javascript
// ...
	something: function()
	{
		var hostAttribute = this.host.getAttribute('something');
		this.host.style.display = 'none';
	},
// ...
```


### this.template __HTML object__ (custom element contents)


This is the custom element contents as you see it in the template, use this to get access to the elements in the template. Please note that this is not the same as `this.host`, whilst they can resolve to the same thing if not using shadow dom, when shadow dom is used, the template is the document fragment contents. If you try to do querySelector on this.host when shadow dom is in use, you will not return the contents of the template. Please use `this.template` when refering to template elements.


```javascript
// ...
	something: function()
	{
		var children = this.template.childNodes;
		var div = this.template.querySelector('div');
	},
// ...
```


## Default Methods


## created() 


When the custom element is created, this function is fired, use for setting things up.


```javascript
// ...
	created: function()
	{
		setSomethingUp();
	},
// ...
```


## attached()


When the custom element is attached to the dom, this function is fired, use this as your starting point, treat as the dom is ready.


```javascript
// ...
	attached: function()
	{
		runSomething();
	},
// ...
```


## detached()


When the custom element is removed from the dom, this function is fired, use this to clean things up, free memory, remove listeners etc.


```javascript
// ...
	attached: function()
	{
		runSomething();
	},
// ...
```


## attributeChanged(name [string], oldVal [string], newVal [string])


This function is run when custom element attributes change, this is the actual instance in the dom. When an attribute is added, removed or changed, this function will report those changes to allow you to update your custom element how you wish.


* name - The name of the attribute changed
* oldValue - The value before it changed or null if not previously set
* newValue - The value it was changed to


```javascript
// ...
	attributeChanged: function(name, oldVal, newVal)
	{
		console.log(name, oldValue, newValue);
	},
// ...
```


## customFunction(event, [propertyA, ...])


Any custom functions created and used in the binding process, for instance `naff-on-click="test('boo', tested)"`, will map all properties, resolving them to scope properties and append them to the function targetted...


```javascript
// ...
	tested: 0,
	test: function(event, booText, another)
	{
		console.log(booText, another); // 'boo', 0 as another maps back to 'this.tested'
	},
// ...
```


* event - The actual event that happened
* [properties...] - The properties sent in by the event action


## Templating and Binding


As stated, templeting and binding is offered using rivets and sightglass [http://rivetsjs.com] so for all references to this, please refer to rivetsjs website. For reference though, the following is available (as is custom binding extensions as per rivetsjs).


* naff-text
* naff-html
* naff-show
* naff-hide
* naff-enabled
* naff-disabled
* naff-if
* naff-unless
* naff-value
* naff-checked
* naff-unchecked
* naff-on-[event]
* naff-each-[item]
* naff-class-[classname]
* naff-[attribute]

Website - [http://rivetsjs.com]

Guide - [http://rivetsjs.com/docs/guide/]

Binding reference - [http://rivetsjs.com/docs/reference/]


Many many thanks to Michael Richards for his work on this exceptional tool [https://github.com/mikeric].

PLEASE NOTE: Do not use the base version of rivets and sightglass with naff, please use the bundled version to keep scope isolation