/**
 * Sample razorNAFF application, bootstrapping the to <naff-app></naff-app> elements as a seperate instance if used more than once
 * @param name The name of the element to bootstrap too
 * @param private The object holding all properties for app (stops issues with binding loss on repeats in rivets), change this name if you wish
 * @function ready When the app is ready to rock, this is your main place for doing cool stuff
 */
naff.registerApplication({
	name: 'naff-app',

	private: {
		test: 'yeah!!',
		clickedTimes: 1,
		route: {}
	},

	ready: function()
	{
		// Initial setup
		console.log('app is ready');

		// Single ajax request example returning a promise
		naff.request.get('../../razor-naff/demo/ajax.php').then(function(result)
		{
			console.log('Asynchronous xhr/ajax/rest single call success', result);
		}).catch(function(result)
		{
			console.log('Asynchronous xhr/ajax/rest single call failure', result);
		});

		// Multiple ajax requests resolved to single promise all complete
		Promise.all([
			naff.request.get('../../razor-naff/demo/ajax.php'),
			naff.request.get('../../razor-naff/demo/ajax.php'),
			naff.request.get('../../razor-naff/demo/ajax.php')
		]).then(function(results)
		{
			console.log('Asynchronous xhr/ajax/rest multiple call success', results);
		}).catch(function(results)
		{
			console.log('Asynchronous xhr/ajax/rest multiple call failure', results);
		});
	},

	location: function(a, b, c)
	{
		this.private.route = {};
		this.private.route[a.route || 'one'] = true;
	},

	clicked: function()
	{
		this.private.clickedTimes++;
	},

	changeRoute: function(event, route)
	{
		// use naff function for changing route to preserve any params that may be on url hash
		naff.setLocation({'route': route});
	}
});
