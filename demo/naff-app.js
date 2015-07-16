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
		clickedTimes: 1
	},

	ready: function()
	{
		// Initial setup
		console.log('app is ready');

		// Single ajax request example returning a promise
		naff.request.get('../../razor-naff/demo/ajax.php').then(function(result)
		{
			console.log('then', result);
		}).catch(function(result)
		{
			console.log('catch', result);
		});

		// Multiple ajax requests resolved to single promise all complete
		Promise.all([
			naff.request.get('../../razor-naff/demo/ajax.php'),
			naff.request.get('../../razor-naff/demo/ajax.php'),
			naff.request.get('../../razor-naff/demo/ajax.php')
		]).then(function(results)
		{
			console.log('then', results);
		}).catch(function(results)
		{
			console.log('catch', results);
		});
	},

	clicked: function()
	{
		this.properties.clickedTimes++;
	}
});
