# Razor NAFF Web Component Helper Library


Razor NAFF is a helper library to make it easier to create native web components written in vanilla javascript, or allowing you to use the register function to make life a little easier, the choice is yours. It aims to keep out of your way, allowing you to create native web components without any framework, or if you wish, it can be a little more helpful, building the component and registering it for you. If you choose to use the helper tools, there is also simple two way binding, scope management and a more structured approach to building custom elements, but with this comes overhead.

For best results, it is probably best to go somewhere in the middle, basic components use native javascript, with more complex components using the binding features to make things easier. The end result here would be good optimization of resources.

Various tools are available, allowing you to apply templates to custom elements, find base scope of the custom element from any children and even let you search for other scopes to run native JS protoype functions. The idea behind NAFF was to provide a simple way to create web components with internal logic without pulling you too much away from native JS.

This library also comes with its own suite of web components that use this library to help give you a good place to start building apps and websites right away.


## Installation  


Razor NAFF is located on git hub [TBD] and can be downloaded from there, or the prefered method is to use bower.

You may use the --save flag to store installation info in a central project bower.json file, if you do not have one already, you can do this first.


```
bower init
```


Installing is simple via bower in the command line, from your project root folder...


```
bower install razor-naff-components --save
```


## Setup


In order to use the NAFF library, you need to include it, there are no dependancies in NAFF, but you will need to polyfill missing functions for older browsers, such as webcomponentsjs.


```html
<script src="bower_components/webcomponentsjs/webcomponents.min.js"></script>
<script src="bower_components/razor-naff/build/naff.min.js"></script>
```


Now we have the polyfills and NAFF installed, so we can use the pair together to build web components (you can swap webcomponentsjs with others is you wish, such as x-tags).


## Usage


To use the NAFF library, it all starts with 'naff', which is the base name for razorNAFF. We use this name to access all NAFF functions...


```javascript
var scope = naff.getScope(this);
scope.someCustomElementFunction();

// or

naff.getScope(this).someCustomElementFunction();
```


These two snippets to the same thing, both take in the current point in the dom, and allow you to get the scope of the containing custom element you are working in. It then runs a function on the scope returned, which could be evaluated to


```javascript
var scope = document.querySelector('x-foo');
scope.someCustomElementFunction();

// or

document.querySelector('x-foo').someCustomElementFunction();
```


The difference with NAFF and native selection is that in the NAFF example, we search backwards out through the parents until we find the scope of the custom element, meaning our custom element code will work on all instances of `<x-foo></x-foo>` without issue, whereas the native selector method will only work on the first x-foo element it finds. This is how we can map functions from templates in custom element children direct to the containing custom element scope. This is handy as it can be the place where we store all logic associated with the custom element, as it may be built up from multiple elements and do various things. 


The other benefit of using naff is that it allows us to abstract back the use of shadow dom. quite simply, shadow dom allows us to encapsulate our custom elements html, style and logic to stop outside things affecting the web component as well as inside things leaching out. Whilst you can build your own components using shadow dom, or just normal light dom (where there is no exncapsulation of html, style and logic), all naff components are dual use. Simply add the 'shadow-dom' attribute to your custom element call `<x-foo shadow-dom></x-foo>`, to have your elements content created in a shadow root for encapuslation when using the naff register function, or you can set the shadowDom property, setting it to true when registering your components through naff.


You may want to encapsulate all the time, some of the time, or you may want outside logic and style to bleed in, in the naff components we have created all logic and style in root and not the template, then used '/deep/' to reference back in with specific tag name declarations, this allows you to use either shadow dom or light dom (default). Reasons for this are primarily due to some browsers still not shipping with shadow dom support or shadow dom active (support but must be turned on by user), as such we are offering the best of both worlds, all still with a single load of style and logic per import.

Now when you use naff to get the working scope, it will still get you the root custom element even if working in a shadow root, something that you cannot do using just querySelector(), so using naff to resolve scope, shadow dom should not cause you any issues.


```html
<template id="x-foo">
	<div class="test">
		<button onclick="naff.getScope(this).someFunctionOfXFoo()"></button>
	</div>
</template>
```


This allows us to map this click back to the custom x-foo logic in the web component file, whilst it is possible to do this with vanilla JS, from this point onwards, we will be using the naff register function to build and apply our custom element. Yes this can be used to build vanilla web components, but I am not going to teach you how to write vanilla JS.


If you wish to go down the vanilla path, the below as a good starting point... 


```javascript
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


From, this point on, vanilla JS is up to you... Now on to using the naff helpers more.


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

		observer: function(path, change)
		{
			// when scope data changes
			console.log('observer');
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


First of all, styling, we have placed this outside fo the tmeplate because we are allowing the component to be used in light and shadow dom, this will ensure styling only loads once and targets the correct component inboth case. If you are going to force `shadowDom: true` in your registration, then you can just put the style in the template, omit the /deep/ calls, this will load the style for each dom fragment liek so...


```html
<!-- TEMPLATE -->
<template id="x-foo">
	<style type="text/css">
		button { opacity: 0.9; border: 1px solid #bbb; background: #ddd; color: #222; cursor: pointer; }
	</style>
	<div class="test">
		<button onclick="naff.getScope(this).pushed()"></button>
		<content></content>
	</div>
</template>
```


Again this is up to you, whilst I prefer the more universal approach, which only loads style once, the latter loads style into a forced shadow dom element, meaning more style is loaded, but it is cleaner styling.


The button click in the html is mapped back to the root scope of the custom element instance (not the actual xfoo object above... the instance of x-foo in the dom that was created from the object above, think of the above as a blueprint that is copied to each element). Always ensure when working inside the proto structure methods, always refer to 'this' as the base scope as this will be the specific element instance in the dom, using the 'proto' variable to reference methods and properties will affect all instances of this custom element in the dom. Also note that whilst creating a property such as `someProperty = 'test'`, always access it in functions as `this.someProperty` to ensure you read/update the dom instance copy and not the underlying custom object blueprint above as this will change it for all instance in the dom.


You can take this one step further, by taking advantage of the data binding and templating features, this gives basic binding and templating to make things simpler, just remember though the more features you use the more overhead, this is why we let you choose how much you want naff to help you. The folowing should do the same as the above using binding. We have omitted unsused functions for clarity.


```html
<template id="x-foo">
	<div class="test">
		<button naff="click|pushed()"></button>
		<content></content>
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


You could even map the clickedTimes property make now for some great binding goodness...


```html
<template id="x-foo">
	<div class="test">
		<p>Clicked <span naff="text|clickedTimes"></span></p>
		<button naff="onclick|pushed()"></button>
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


Now you should see your clicks automatically updating the dom. Whilst we do currently allow primatives, strings in quotes, functions and pretty much any even type you like, we do draw the line at this point, just enough to be helpful.


## Templating (using dataBind: true)


If you do wish to use datbinding, the following should give you an idea of how to use the templating/binding features. All binding starts with the universal `naff=""` attribute. You can use this to bind  



... TO BE CONTINUED, WIP