# razorNAFF Web Component Helper Library


__Browser Support__ - IE9+, Chrome, FF, Safari, Opera


razorNAFF is a helper library that makes it easier to create web components, enabling you to easily build web components, create page apps and use the power of html imports, lightdom etc. There are various features included in razorNAFF to make life a little easier like component registration, data binding, lightdom inclusion (without need for shadow dom) and templating using the slightly modified rivets and sightglass (via single bundled js file), as well as event firing.

This library also comes with its own suite of web components that use this library to help give you a good place to start building apps and websites right away.


## Installation  


razorNAFF is located on git hub [https://github.com/smiffy6969/razor-naff] and can be downloaded from there, or the prefered method is to use bower.

You may use the --save flag to store installation info in a central project bower.json file, if you do not have one already, you can do this first.


```
bower init
```


Installing is simple via bower in the command line, from your project root folder... The dependancies required (rivets and sightglass) are both bundled in seeing as some tweaking is needed for naff.


```
bower install razor-naff --save
```


## Setup


In order to use the NAFF library, you need to include it, there are no dependancies outside of rivets and sightglass (should you wish to use binding and templating which are bundled in), but you will need to polyfill missing functions for older browsers, such as webcomponentsjs (imports, custom components etc...), the easiest way is using bower installing webcomponentsjs can be found on github. You can of course use your own if you wish, this is what we use as standard, we have added them as a dependancy in the bower file so it installs them for you. Should you wish to use another polyfill for object observing and maybe xtags for web components, by all means give it a try.


```html
<script type="text/javascript" src="bower_components/webcomponentsjs/webcomponents.min.js"></script>
<script type="text/javascript" src="bower_components/razor-naff/build/naff.bundled.min.js"></script>
```


Now we have the polyfills and NAFF bundle installed (or you can just add naff if you do not need binding and templating and not using any naff web components), we can use the pair together to build web components.


## Usage


To use the razorNAFF library, it all starts with `naff`, which is the base object name for razorNAFF. We use this name to access NAFF functions...


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


The difference with NAFF getScope and native selection is that in the NAFF example, we search backwards out through the parents until we find the scope of the custom element, meaning our custom element logic will work on all instances of `<x-foo></x-foo>` independently without issue. The native selector method will only work on the first x-foo element it finds. This is how we can grab correct scope from within a web component should we loose it.


The other benefit of using naff is that it allows us to abstract back the use of shadow dom should we wish to use it. quite simply, shadow dom allows us to encapsulate our custom elements html, style and logic to stop outside things affecting the web component as well as inside things leaching out. Whilst you can build your own components using shadow dom, all naff web components do not use shadow dom.


The other major benefit of using shadow dom was the ability to use light dom inclusion, to embed content into your web component from your html document like so...


```html
<!-- the web component template -->
<template id="naff-test"><strong><content></content></strong></naff-test>

<!-- using the new component in your html document with light dom content (the 'hello' text, or this can be more html) -->
<naff-test>hello</naff-test>

<!-- rendered once web component registers is a hybrid of the web component template and any contents of light dom supplied if component allows this just like shadow dom does -->
<naff-test><strong>hello</strong></naff-test>
```


razorNAFF has reproduced this functionality so you can get the benefits of light dom without the need for using shadow dom, whilst still allowing css and logic to bleed in if you like using things such as bootstrap!. You can also use the same shadow dom concepts to target content in the element to appear in specific places inside the template as follows.


```html
<!-- the web component template -->
<template id="naff-test">
	<h1><content select="heading"></content></h1>
	<p>This is from template</p>
	<p><content select="main"></content></p>
</naff-test>

<!-- using the new component in your html document with light dom content (the 'hello' text, or this can be more html) -->
<naff-test>
	<heading>This is a heading</heading>
	<main>This is main contents</main>
</naff-test>

<!-- rendered once web component registers is a hybrid of the web component template and any contents of light dom supplied if component allows this just like shadow dom does -->
<naff-test>
	<h1>This is a heading</h1>
	<p>This is from template</p>
	<p>This is main contents</p>
</naff-test>
```


The reasons for this is functionality being added is mainly due to lack of browser support or decent polyfills for shadow dom at present. If you do wish to use shadow dom with your own components, simply add shadowDom property, setting it to true when registering your components, but please be aware support is sparse and polyfills are very limited, so for now it is recommended to use the benefits of light dom provided by naff and be more specific with naming inside your web component when it comes to class names. To keep things running smooth and stop bleed in where you do not want it, prefixing private only class names with a hyphon will help, or you can simple use your id name as a prefix and always start your style with the tag name (which is the id name of the template). Below is an example of naff in action, creating a web component.


```html
<!-- STYLE - Encapsulate all css to tag name -->
<style type="text/css">
	x-foo -test button { opacity: 0.9; border: 1px solid #bbb; background: #ddd; color: #222; cursor: pointer; }
</style>

<!-- TEMPLATE -->
<template id="x-foo">
	<div class="-test">
		<button naff-on-click="pushed()"></button>
		<content></content>
	</div>
</template>

<!-- LOGIC -->
<script>
	naff.registerElement({
		// Setup

		name: 'x-foo', 		// Custome element name
		extends: null, 		// do we extend another element
		shadowDom: false, 	// should we force shadow dom on all instances for browser with support or try to polyfill support (experimental at best!)
		dataBind: true, 	// we want to use data-binding and templating in template

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
			// when host attribute changes, event is fired on change automatically
			// *attributechanged where * = name of attribute, along with detail of old and new values
			console.log('attributeChanged');
		},

		// Declare Properties

		clickedTimes: 0,

		// Custom methods

		pushed: function(event)
		{
			this.fire('clicked', 'optional-extra-details'); // fire event on host element, can also use naff.fire(this.host, 'clicked', 'optional')
			this.clickedTimes++;
			console.log(clickedTimes);
		}
	});
</script>
```


First of all, styling, we have placed this outside of the template because we are not using shadow dom, we are using light dom ability as supplied by naff, this will ensure styling only loads once and targets the correct component in both cases. If you are going to force `shadowDom: true` in your registration, then you can just put the style in the template, this will load the style for each dom fragment like so...


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


Again this is up to you, if you do wish to go shadow dom you will now see style loaded in each fragment created.


The button click in the html is mapped back to the root scope of the custom element instance (not the actual xfoo template object above... the instance of x-foo in the dom that was created from the object template above, think of the above as a blueprint that is copied to each element instance. Always ensure when working inside the proto structure methods, always refer to 'this' as the base scope as this will be the specific element instance in the dom.


Using data binding in your web component, should only be an option if you need to perform actions based on user interaction, below is a stripped down example of this.


```html
<template id="x-foo">
	<div class="-test">
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
	<div class="-test">
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


When creating custom properties, please ensure you keep away from using the following names, as these will clash with default properties/methods...

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
* fire()


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


When the custom element is created, this function is fired, use for setting things up, created event is triggered from host element after completion.


```javascript
// ...
	created: function()
	{
		setSomethingUp();
	},
// ...
```


## attached()


When the custom element is attached to the dom, this function is fired, use this as your starting point, treat as the dom is ready, attached event is triggered from host element after completion


```javascript
// ...
	attached: function()
	{
		runSomething();
	},
// ...
```


## detached()


When the custom element is removed from the dom, this function is fired, use this to clean things up, free memory, remove listeners etc. Detached event is triggered from host element after completion


```javascript
// ...
	detached: function()
	{
		runSomething();
	},
// ...
```


## attributeChanged(name [string], oldVal [string], newVal [string])


This function is run when custom element attributes change, this is the actual instance in the dom. When an attribute is added, removed or changed, this function will report those changes to allow you to update your custom element how you wish, 'attribute name'attributechanged event is triggered from host element after completion with detail of old and new values e.g. colorattributechanged.


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


## fire(name [string], details [mixed])


This function can be used to fire off custom events from your component, which is handy when you need to provide feedback on things that happen inside. You can override this if you wish, or just use the default fire function provided by naff.


* name - The name of the event
* details - [optional] Any extra details like strings, literals, objects etc


```javascript
// ...
	clicked: function(event)
	{
		this.fire('clicked');
		this.fire('clicked', event);
	},
// ...
```


## customFunction([event, [propertyA, ...]])


Any custom functions created and used in the binding process, for instance `naff-on-click="test('boo', tested)"`, will map all properties, resolving them to scope properties and append them to the function targetted along with the event that spawned it. If you do not use a custom function in the binding process, simply use it as any other method.


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

PLEASE NOTE: Do not use the base version of rivets and sightglass with naff, please use the bundled version to keep scope isolation.


## Helper Functions in NAFF (naff.[function name])


### getScope(origin)


Will grab the current working scope for the web component based on the origin you start from. Looks backwards from origin until it find the web component scope. Origin should be an element to start looking from. This can be handy when you loose scope and cannot find it inside a web component.


```javascript
// ...
	test: function()
	{
		element = whatever;
		function someFunction(element)
		{
			console.log(naff.getScope(element)); // should find the scope of the web component the element is in
		}
	},
// ...
```


* origin - The starting element to look backwards from.


### getParentScope(origin[, name])


Will grab the current working scope for the parent web component based on the origin you start from. Looks backwards from origin until it find the web component scope of the parent. Origin should be an element to start looking from. This can be handy when you want to find the scope of a parent web component, use name to identify the id of the parent element if you want to traverse more than one parent.


```javascript
// ...
	test: function()
	{
		element = whatever;
		function someFunction(element)
		{
			console.log(naff.getParentScope(element)); // should find the scope of the web component the element is in
		}
	},
// ...
```


* origin - The starting element to look backwards from.
* name (optional) - The name of the parent scope to find.


### registerElement(blueprint)


Will register a new web component with the attached blueprint. The blue print should contain at least a name, in order to register, adding in more as needed.


```javascript
naff.registerElement({name: 'x-foo'});

// or

naff.registerElement({
	// Setup

	name: 'x-foo', 		// Custome element name
	extends: null, 		// do we extend another element
	shadowDom: false, 	// should we force shadow dom on all instances for browser with support or try to polyfill support (experimental at best!)
	dataBind: true, 	// we want to use data-binding and templating in template

	// built in methods

	created: function()
	{

	},

	attached: function()
	{

	},

	detached: function()
	{

	},

	attributeChanged: function(name, oldVal, newVal)
	{

	}
});
```


* blueprint - The blueprint object.


### registerApplication(blueprint)


Will register a new application with the attached blueprint. The blue print should contain at least a name and the ready function, in order to register, adding in more as needed.


```javascript
naff.registerApplication({
	name: 'naff-app',

	ready: function()
	{

	}
});
```


* blueprint - The blueprint object.


## Creating a Single Page Application


Web components are create for modular code, but they will not be that great in a plain old html document (unless you are building a static site). If you wish to use your components in an application, then NAFF can also help with registerApplication(). NAFF can take your html, bundle it into an app element (pretty much like a custom element) and allow you to start using this as a basis for your application. You can embed apps in apps (use getParentScope to traverse back and target the child app to traverse forward), and you can do all the nice things in your app you can in components, it's just a little more sparse to begin with.

Once of the benefits of using the NAFF application method is that you do not have to worry about waiting for the document to be ready, as the app is bootstrapped to the element once its ready. In addition to this, you can add a resolve attribute to your app element to defer rendering until binding is complete, fading the app in when ready. Once you have your app set out, you can use the ready function to get things going, and all the databinding goodness to makeyour app work.


### Your Main HTML Document


```html
<!DOCTYPE html>
<html>
	<head>
		<meta charset="utf-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1">
		<title>razorNAFF Application Demo</title>

		<!-- Polyfill native API's that are missing -->
		<script type="text/javascript" src="../../webcomponentsjs/webcomponents.min.js"></script>
		<script type="text/javascript" src="../../object.observe/dist/object-observe.min.js"></script>

		<!-- Load the naff helper library used by the web components -->
		<script type="text/javascript" src="../build/naff.bundled.min.js"></script>

		<!-- load app specific logic and style -->
		<link rel="stylesheet" type="text/css" href="naff-app.css">
		<script type="text/javascript" src="naff-app.js"></script>

		<!-- sugar for demo page -->
	    <style type="text/css">
	    	* { font-family: sans-serif; }
	    </style>
	</head>
	<body>
		<!-- Example NAFF application, for demos on creating web components, please refer to razor-naff-components in github -->
		<!-- naff-app is the name of the app, resolve is to defer rendering until binding has complete, if you so wish... -->
		<naff-app resolve>
			<h1>Test razorNAFF Application</h1>
			<p>Test application: {{properties.test}}: {{properties.clickedTimes}}</p>
			<button naff-on-click="clicked()">Increment</button>
		</naff-app>
	</body>
</html>
```


Here you need to add in your polyfill, add in naff.bundled and from this point it is up to you how you structure things. I have chosen to load app level logic and styling from seperate files to keep things clean and take advantage of less, so I pull in these files now. If you are importing any other web components, do this before your app calls. If you wish to pull in your app as a html import, you will need to bundle your style and logic in the same file as assets cannot be loaded from imported html documents.


The above code sets up whats needed, then regsiteres a new app elememnt `<naff-app resolve></naff-app>'. You can call this what you like, just ensure it has one hyphon and is only letters, numbers and hyphons starting with a letter or hyphon (you can use underscores too but html looks better if you stick with hyphons). The extra attribute here is the resolver, it defers rendering of the app until the app is registered and attached to the dom, fading the app in once bootstrapped to the element.


Inside the app element, you can now do your magic, using the binding features of rivets and sightglass, with all logic refering back to your project js file.


```javascript
/**
 * Sample razorNAFF application, bootstrapping the to <naff-app></naff-app> elements as a seperate instance if used more than once
 * @param name The name of the element to bootstrap too
 * @param properties The object holding all properties for app (stops issues with binding loss on repeats in rivets), change this name if you wish
 * @function ready When the app is ready to rock, this is your main place for doing cool stuff
 */
naff.registerApplication({
	name: 'naff-app',

	properties: {
		test: 'yeah!!',
		clickedTimes: 0
	},

	ready: function()
	{
		// Initial setup
		console.log('app is ready');
	},

	clicked: function()
	{
		this.properties.clickedTimes++;
	}
});
```


We register the new app as a custom element application, bootstraping the name to the elements found (so you can use the app more than once per page, and embed apps in apps too). It is best to create some sort of properties object to hold all app properties, this stops binding issues when using repeats in your binding, pluss it keeps things neet and makes you declare all properties (use something: null to declare new property). From this point on your good to go, the ready function is provided as a kickstart to your app, and everything else is up to you. All features off application elements are the same as custom elements, we just set it up a little different, so all of the above web components info works here too. Simply put we are just creating a simple new element to house our app without the templating stuff.
